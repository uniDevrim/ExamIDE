import socket
import time
import requests
import threading
import os

ADMIN_URL = os.getenv('ADMIN_URL')

def listen_for_admin():
    global ADMIN_URL
    if ADMIN_URL: return
    
    client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    client.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        client.bind(('', 37020))
        while True:
            data, addr = client.recvfrom(1024)
            message = data.decode()
            if "ADMIN_IP" in message:
                admin_ip = message.split("|")[1]
                ADMIN_URL = f"http://{admin_ip}:5002/report"
                break 
    except Exception as e:
        print(f"UDP Error: {e}")

def auto_report():
    time.sleep(5)
    while True:
        if ADMIN_URL:
            try:
                payload = {
                    "student_id": "2512729006",
                    "student_name": "Varol",
                    "student_surname": "Kara",
                    "question_no": 1,
                    "date": str(time.ctime()),
                }
                requests.post(ADMIN_URL, json=payload, timeout=5)
            except:
                pass
        time.sleep(10)

def start_background_tasks():
    threading.Thread(target=listen_for_admin, daemon=True).start()
    threading.Thread(target=auto_report, daemon=True).start()