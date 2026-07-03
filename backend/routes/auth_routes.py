from flask import Blueprint, render_template, request, redirect, url_for, session, current_app, flash
from datetime import datetime, timezone
from ..execution_pool import pool_manager
import time
import secrets
from collections import defaultdict

auth_bp = Blueprint('auth', __name__)

# Lightweight in-memory rate limiter: IP address -> list of login attempt timestamps
login_attempts = defaultdict(list)

def is_rate_limited(ip):
    now = time.time()
    # Keep attempts from the last 60 seconds
    login_attempts[ip] = [t for t in login_attempts[ip] if now - t < 60]
    if len(login_attempts[ip]) >= 5:  # Limit to 5 attempts per minute
        return True
    login_attempts[ip].append(now)
    return False

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    incoming_token = request.args.get('token')
    system_token = current_app.config.get('ADMIN_LOGIN_TOKEN')
    
    if incoming_token:
        if incoming_token == system_token:
            session.clear()
            session.permanent = True
            session['is_admin'] = True
            session['role'] = 'admin'
            session['csrf_token'] = secrets.token_hex(32)
            return redirect(url_for('admin_bp.admin_dashboard'))
        else:
            pass

    if session.get('is_admin'):
        return redirect(url_for('admin_bp.admin_dashboard'))

    if request.method == 'POST':
        if session.get('is_admin'):
            return redirect(url_for('admin_bp.admin_dashboard'))
            
        client_ip = request.remote_addr
        if is_rate_limited(client_ip):
            flash("Çok fazla giriş denemesi yaptınız. Lütfen 1 dakika sonra tekrar deneyin.")
            return render_template('login.html'), 429

        ogrenci_no = request.form.get('ogrenci_no', '').strip()
        ad = request.form.get('ad', '').strip()
        soyad = request.form.get('soyad', '').strip()
        bolum = request.form.get('bolum', '').strip()
        sinif = request.form.get('sinif', '').strip()

        # Input Validation
        if not ogrenci_no or not ad or not soyad or not bolum or not sinif:
            flash("Lütfen tüm alanları doldurun.")
            return render_template('login.html'), 400

        if not ogrenci_no.isalnum() or not (5 <= len(ogrenci_no) <= 20):
            flash("Geçersiz öğrenci numarası. 5-20 arası alfanümerik karakter olmalıdır.")
            return render_template('login.html'), 400

        if len(ad) > 50 or len(soyad) > 50 or len(bolum) > 50 or len(sinif) > 50:
            flash("Giriş bilgileri çok uzun.")
            return render_template('login.html'), 400

        session.permanent = True
        session['user'] = {
            'no': ogrenci_no,
            'ad': ad,
            'soyad': soyad,
            'bolum': bolum,
            'sinif': sinif,
            'role': 'student'
        }
        session['is_admin'] = False
        
        student_data = {
            'no': ogrenci_no,
            'ad': ad,
            'soyad': soyad,
            'bolum': bolum,
            'sinif': sinif,
            'question': 1,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        pool_manager.add_student(ogrenci_no, student_data, ip=client_ip)
        return redirect(url_for('index'))

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))