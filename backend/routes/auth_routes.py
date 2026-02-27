from flask import Blueprint, render_template, request, redirect, url_for, session,current_app
import datetime
from ..execution_pool import pool_manager
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    incoming_token = request.args.get('token')
    system_token = current_app.config.get('ADMIN_LOGIN_TOKEN')
    
    if incoming_token:
        if incoming_token == system_token:
            session.permanent = True
            session['is_admin'] = True
            session['role'] = 'admin'
            return redirect(url_for('admin_bp.admin_dashboard'))
        else:
            pass

    if request.method == 'POST':
        session['user'] = {
            'no': request.form.get('ogrenci_no'),
            'ad': request.form.get('ad'),
            'soyad': request.form.get('soyad'),
            'bolum': request.form.get('bolum'),
            'sinif': request.form.get('sinif'),
            'role': 'student'
        }
        session['is_admin'] = False
        student_data = {
            'no': request.form.get('ogrenci_no'),
            'ad': request.form.get('ad'),
            'soyad': request.form.get('soyad'),
            'question': 1,
            'timestamp': datetime.datetime.now().strftime("%H:%M:%S")
        }
        pool_manager.add_student(request.remote_addr, student_data)
        return redirect(url_for('index'))


    return render_template('login.html')
@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.login'))