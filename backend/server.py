import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.client_routes import client_bp
from dotenv import load_dotenv
# from routes.admin_routes import admin_bp # Uncomment when you fill this

load_dotenv()

app = Flask(__name__, static_folder='../frontend_client')
CORS(app)

# Register Blueprints with a URL prefix
app.register_blueprint(client_bp, url_prefix='/api/client')

PORT = int(os.getenv('PORT', 5000))

# Route to serve the frontend
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Serve other static files (js, css)
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, port=PORT)