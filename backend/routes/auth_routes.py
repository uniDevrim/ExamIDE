from flask import Blueprint, render_template, request, redirect, url_for, session,current_app
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # 1. GET ile gelen Token'ı yakala
    incoming_token = request.args.get('token')
    system_token = current_app.config.get('ADMIN_LOGIN_TOKEN')

    # Eğer URL'de bir token varsa (örn: /login?token=abc)
    if incoming_token:
        print("tokebnvar")
        if incoming_token == system_token:
            session['is_admin'] = True
            session['role'] = 'admin'
            print("is admin:",session['is_admin'])

            # Token doğru, login.html'i hiç yüklemeden admin'e uçur
            return redirect(url_for('admin_bp.admin_dashboard'))
        else:
            # Token yanlışsa hiçbir şey yapma, akış aşağıya (login.html'e) devam etsin
            pass

    # 2. POST isteği (Öğrenci formu doldurup gönderdiğinde)
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

        return redirect(url_for('index'))


    return render_template('login.html')
@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.login'))