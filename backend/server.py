import os
import socket
import threading
import time
import requests
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='../frontend_client')
CORS(app)

# --- CONFIG ---
PORT = 5001  # server.py port
ADMIN_PORT = 5002  # app.py'nin port
ADMIN_URL = None #None
STUDENT_ID = "Ogrenci_Bektas"


# --- UDP DİNLEYİCİ ---
def listen_for_admin():
    global ADMIN_URL
    client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        client.bind(('', 37020))
        print("[*] Admin aranıyor...")
        while True:
            data, addr = client.recvfrom(1024)
            message = data.decode()
            if "ADMIN_IP" in message:
                admin_ip = message.split("|")[1]

                # ÖNEMLİ: Burada 'http=' değil 'http://' olmalı
                # Ayrıca sadece ilk bulduğunu sabitlemek için kontrol ekliyoruz
                if ADMIN_URL is None:
                    ADMIN_URL = f"http://{admin_ip}:5002/report"
                    print(f"[!] Admin IP Sabitlendi: {ADMIN_URL}")

    except Exception as e:
        print(f"[-] UDP Hatası: {e}")
# --- REPORTING ---
def auto_report():
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
                # app.py (5002 portu) üzerindeki /report endpoint'ine gönderir
                response = requests.post(ADMIN_URL, json=payload, timeout=5)
                if response.status_code == 200:
                    print(f"[+] Rapor Admin'e iletildi ({ADMIN_URL})")
            except Exception as e:
                print(f"[-] Admin'e erişilemiyor: {e}")
        else:
            print("[?] Admin IP henüz bulunamadı, bekleniyor...")

        time.sleep(5)


@app.route('/')
def index():
    return "Öğrenci Sunucusu Çalışıyor (Port 5001)"


if __name__ == '__main__':
    threading.Thread(target=listen_for_admin, daemon=True).start()
    threading.Thread(target=auto_report, daemon=True).start()

    # DİKKAT: debug=False yaptık çünkü debug=True threadleri çift başlatır
    app.run(host='0.0.0.0', port=PORT, debug=False)