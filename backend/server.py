import os
import socket
import threading
import time
import requests
from flask import Flask, send_from_directory, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Make sure imports are correct based on file location
from routes.client_routes import client_bp
import execution_pool 

load_dotenv()

app = Flask(__name__, 
            static_folder='../frontend_client', 
            static_url_path='',
            template_folder='../frontend_client')

CORS(app)

# --- FIX 1: Add url_prefix so it matches your JavaScript fetch() ---
app.register_blueprint(client_bp, url_prefix='/api/client')

PORT = int(os.getenv('PORT', 5000))
ADMIN_PORT = int(os.getenv('ADMIN_PORT', 5002))

# --- FIX 2: Load Admin URL from .env if possible (Bypasses UDP in Docker) ---
ADMIN_URL = os.getenv('ADMIN_URL') 

# --- UDP DİNLEYİCİ ---
def listen_for_admin():
    global ADMIN_URL
    
    # If .env provided the URL, we don't need to listen!
    if ADMIN_URL:
        print(f"[+] Admin URL loaded from config: {ADMIN_URL}")
        return

    client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        client.bind(('', 37020))
        print("[*] Admin aranıyor (UDP)...")
        while True:
            data, addr = client.recvfrom(1024)
            message = data.decode()
            if "ADMIN_IP" in message:
                admin_ip = message.split("|")[1]
                if ADMIN_URL is None:
                    ADMIN_URL = f"http://{admin_ip}:5002/report"
                    print(f"[!] Admin IP Sabitlendi: {ADMIN_URL}")
                    # Once found, we can stop listening or keep updating. 
                    # Returning here saves resources.
                    return 

    except Exception as e:
        print(f"[-] UDP Hatası: {e}")

# --- REPORTING ---
def auto_report():
    # Wait a bit for system to settle
    time.sleep(5)
    
    while True:
        if ADMIN_URL:
            try:
                payload = {
                    "student_id": "2512729021",
                    "student_name": "Bektaş",
                    "student_surname": "Parlak",
                    "question_no": 3,
                    "date": str(time.ctime()),
                }
                response = requests.post(ADMIN_URL, json=payload, timeout=5)
                if response.status_code == 200:
                    print(f"[+] Rapor Admin'e iletildi ({ADMIN_URL})")
            except Exception as e:
                print(f"[-] Admin'e erişilemiyor: {e}")
        else:
            print("[?] Admin IP henüz bulunamadı...")

        time.sleep(10) # Slowed down to 10s to not spam logs

@app.route('/')
def index():
    return render_template("index.html")

if __name__ == '__main__':
    # Only start the UDP thread if we didn't find the URL in .env
    if not ADMIN_URL:
        threading.Thread(target=listen_for_admin, daemon=True).start()
    else:
        print(f"[+] Skipping UDP listener, using configured Admin URL: {ADMIN_URL}")

    threading.Thread(target=auto_report, daemon=True).start()

    app.run(host='0.0.0.0', port=PORT, debug=False)