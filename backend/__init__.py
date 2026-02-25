from flask import Flask, render_template,request,session,redirect,url_for
from flask_cors import CORS
from .routes.client_routes import client_bp
from .routes.admin_routes import admin_bp
from .routes.auth_routes import auth_bp
from .utils import start_background_tasks
import os

def create_app():
    app = Flask(__name__, 
                static_folder='../frontend_client', 
                template_folder='../frontend_client',
                static_url_path='')
    CORS(app)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'cok-gizli-bir-anahtar')



    app.register_blueprint(client_bp, url_prefix='/api/client')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(auth_bp)

    @app.before_request
    def require_login():
        exempt_endpoints = ['auth.login', 'static'] # Giriş gerektirmeyen "muaf" yollar

        if 'user' not in session and request.endpoint not in exempt_endpoints:
            # Eğer istek ana dizine ('index') geliyorsa ve giriş yoksa login'e at
            if request.endpoint == 'index' or (request.blueprint and request.blueprint != 'auth'):
                return redirect(url_for('auth.login'))

    @app.route('/')
    def index():
        return render_template("index.html", user=session.get('user'))

    start_background_tasks()

    return app