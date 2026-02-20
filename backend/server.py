import os
import socket
import threading
import time
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Import routes and the execution pool
from routes.client_routes import client_bp
from execution_pool import pool_manager

load_dotenv()

app = Flask(__name__, 
            static_folder='../frontend_client', 
            static_url_path='',
            template_folder='../frontend_client')

CORS(app)

# Register the execution route
app.register_blueprint(client_bp, url_prefix='/api/client')

# Load Configuration
PORT = int(os.getenv('PORT', 5000))
ADMIN_PORT = int(os.getenv('ADMIN_PORT', 5002))
ADMIN_URL = os.getenv('ADMIN_URL') 

# --- ADMIN ROUTES ---
@app.route('/api/admin/start_exam', methods=['POST'])
def start_exam():
    """
    Called by the Teacher Console to set the active language.
    """
    data = request.json
    language = data.get('language')
    
    if not language:
        return jsonify({"error": "Language required"}), 400
        
    if language not in ["python", "cpp", "csharp"]:
        return jsonify({"error": "Unsupported language"}), 400

    # Triggers the pool to clean up old containers and spawn new ones
    pool_manager.set_exam_language(language)
    
    return jsonify({"status": "Exam started", "mode": language}), 200

# --- UDP DISCOVERY ---
def listen_for_admin():
    global ADMIN_URL
    
    if ADMIN_URL:
        return

    client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        client.bind(('', 37020))
        print("[*] Waiting for Admin broadcast (UDP)...")
        while True:
            data, addr = client.recvfrom(1024)
            message = data.decode()
            if "ADMIN_IP" in message:
                admin_ip = message.split("|")[1]
                if ADMIN_URL is None:
                    ADMIN_URL = f"http://{admin_ip}:5002/report"
                    print(f"[!] Admin IP Found: {ADMIN_URL}")
                    return 

    except Exception as e:
        print(f"[-] UDP Discovery Error: {e}")

# --- AUTO REPORTING ---
def auto_report():
    time.sleep(5)
    while True:
        if ADMIN_URL:
            try:
                # Replace this static data with real student info if available
                payload = {
                    "student_id": "2512729006",
                    "student_name": "Varol",
                    "student_surname": "Kara",
                    "question_no": 1,
                    "date": str(time.ctime()),
                }
                response = requests.post(ADMIN_URL, json=payload, timeout=5)
            except Exception:
                pass 
        else:
            print("[?] Admin IP not found yet...")

        time.sleep(10)

@app.route('/')
def index():
    return render_template("index.html")

if __name__ == '__main__':
    if not ADMIN_URL:
        threading.Thread(target=listen_for_admin, daemon=True).start()
    else:
        print(f"[+] Using Configured Admin URL: {ADMIN_URL}")

    threading.Thread(target=auto_report, daemon=True).start()

    app.run(host='0.0.0.0', port=PORT, debug=False)