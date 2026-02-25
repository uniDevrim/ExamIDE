from flask import Flask, render_template
from flask_cors import CORS
from .routes.client_routes import client_bp
from .routes.admin_routes import admin_bp
from .utils import start_background_tasks

def create_app():
    app = Flask(__name__, 
                static_folder='../frontend_client', 
                template_folder='../frontend_client',
                static_url_path='')
    CORS(app)

    app.register_blueprint(client_bp, url_prefix='/api/client')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/')
    def index():
        return render_template("index.html")

    start_background_tasks()

    return app