from flask import Blueprint, render_template, request, redirect, url_for, session

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        session['user'] = {
            'no': request.form.get('ogrenci_no'),
            'ad': request.form.get('ad'),
            'soyad': request.form.get('soyad'),
            'bolum': request.form.get('bolum'),
            'sinif': request.form.get('sinif')
        }
        return redirect(url_for('index'))

    return render_template('login.html')


@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.login'))