import socket
import threading
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

students_db = {}


# --- UDP BEACON ---
def admin_beacon():
    admin_ip = socket.gethostbyname(socket.gethostname())
    server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # 37020 portundan yayın yapıyoruz
    while True:
        server.sendto(f"ADMIN_IP|{admin_ip}".encode(), ('<broadcast>', 37020))
        time.sleep(2)


# --- VERİ TOPLAMA ENDPOINT'İ ---
@app.route('/report', methods=['POST'])
def receive_report():
    data = request.json
    student_ip = request.remote_addr  # İstek atan server.py'nin ağdaki IP'si

    # Payload'dan gelen verileri ayıkla
    student_id = data.get('student_id', 'Bilinmiyor')
    student_name = data.get('student_name', 'Bilinmiyor')
    student_surname = data.get('student_surname', 'Bilinmiyor')
    question_no = data.get('question_no', 0)
    report_time = data.get('date', time.ctime())

    # IP adresini anahtar (key) olarak kullanıyoruz
    students_db[student_ip] = {
        "student_id": student_id,
        "full_name": f"{student_name} {student_surname}",
        "current_question": question_no,
        "last_seen": report_time,
        "status": "Aktif"
    }

    # Terminale temiz bir log basalım
    print(f"[!] Rapor: {student_name} {student_surname} ({student_id}) - Soru: {question_no}")

    return jsonify({
        "status": "success",
        "message": f"Merhaba {student_name}, raporun alındı."
    }), 200
if __name__ == '__main__':
    # Duyuru servisini başlat
    threading.Thread(target=admin_beacon, daemon=True).start()
    # Flask'ı tüm ağa aç (0.0.0.0)
    print(f"[*] Admin Paneli Başlatıldı. IP: {socket.gethostbyname(socket.gethostname())}")
    app.run(host='0.0.0.0', port=5002)