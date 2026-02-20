import socket
import threading
import time
from flask import Flask, request, jsonify,render_template
from flask_cors import CORS

app = Flask(__name__,
            template_folder='../frontend_admin',
            static_folder='../frontend_admin')
CORS(app)

students_db = {}


def get_local_ip():
    """Bilgisayarın ağdaki gerçek IP'sini bulur."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Bağlantı kurmaz, sadece rotayı kontrol eder
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = socket.gethostbyname(socket.gethostname())
    finally:
        s.close()
    return ip


def admin_beacon():
    admin_ip = get_local_ip()
    server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    print(f"[*] Admin Yayını Başladı! IP: {admin_ip} Port: 5002")
    while True:
        # Mesajı gönder
        server.sendto(f"ADMIN_IP|{admin_ip}".encode(), ('<broadcast>', 37020))
        time.sleep(2)


@app.route('/report', methods=['POST'])
def receive_report():
    data = request.json
    student_ip = request.remote_addr

    students_db[student_ip] = {
        "student_id": data.get('student_id'),
        "name": data.get('student_name'),
        "surname": data.get('student_surname'),
        "full_name": data.get('student_name')+ ' ' +data.get('student_surname'),
        "question": data.get('question_no'),
        "timestamp": data.get('date')
    }

    print(f"[!] Veri Geldi: {data.get('student_name')} - Soru: {data.get('question_no')}")
    return jsonify({"status": "success"}), 200


@app.route('/admin')
def admin_page():
    return render_template('admin.html') # admin.html dosyasını 'templates' klasörüne koymalısın

# 2. JS'nin tabloyu doldurması için JSON verisi
@app.route('/api/students')
def get_students():
    # students_db'deki veriyi temiz bir formatta döndürür
    formatted_data = {}
    for ip, info in students_db.items():
        formatted_data[ip] = {
            "student_id": info.get('student_id'),
            "full_name": info.get('full_name'),
            "current_question": info.get('question'),
            "last_seen": info.get('timestamp')
        }
    return jsonify(formatted_data)

if __name__ == '__main__':
    threading.Thread(target=admin_beacon, daemon=True).start()
    # Admin paneli 5002 portunda tüm ağa açık
    app.run(host='0.0.0.0', port=5002)