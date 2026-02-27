import docker
import threading
import queue
import time
import base64
import atexit
import os  # <--- BUNU EKLEMEYİ UNUTMA

DEFAULT_LANG = None  
POOL_SIZE = 3  
IMAGE_MAP = {
    "python": "python:3.9-slim",
    "cpp": "gcc:latest",
    "csharp": "mcr.microsoft.com/dotnet/sdk:7.0"
}

class WarmContainerPool:
    def __init__(self):
        # DOCKER_HOST ortam değişkeni sayesinde Proxy'ye bağlanır
        self.client = docker.from_env()
        self.pools = {
            "python": queue.Queue(maxsize=POOL_SIZE),
            "cpp": queue.Queue(maxsize=POOL_SIZE),
            "csharp": queue.Queue(maxsize=POOL_SIZE)
        }
        self.active_language = DEFAULT_LANG
        self.running = True
        
        self._purge_zombies()
        
        self.monitor_thread = threading.Thread(target=self._maintain_pool, daemon=True)
        self.monitor_thread.start()

        self.students = {}
        
        atexit.register(self.shutdown)

    def add_student(self, ip, data):
        self.students[ip] = data

    def get_all_students(self):
        return self.students

    def update_student_question(self, ip, question_no):
        if ip in self.students:
            self.students[ip]['question'] = question_no
            from datetime import datetime
            self.students[ip]['timestamp'] = datetime.now().strftime("%H:%M:%S")

    def run_grader_container(self, student_code, language, exam_id=None):

        print(f"[+] Grader başlatılıyor... Dil: {language}")
        
        image_name = "exam-grader-iso" 
        network_name = os.getenv("DOCKER_NETWORK_NAME", "examide_internal-network")

        try:
            container = self.client.containers.run(
                image=image_name,
                command=["python", "grade.py", student_code], 
                detach=True,
                network=network_name, 
                environment={
                    "BACKEND_URL": "http://backend:5000", 
                    "LANGUAGE": language,
                    "EXAM_ID": str(exam_id) if exam_id else "unknown"
                },
                remove=True
            )
            return {"status": "success", "container_id": container.id}

        except Exception as e:
            print(f"[-] Grader Başlatma Hatası: {e}")
            return {"status": "error", "message": str(e)}

    def set_exam_language(self, lang):
        print(f"[!] Switching Exam Language to: {lang}")
        self.active_language = lang
    
        for pool_lang, q in self.pools.items():
             if pool_lang != lang:
                while not q.empty():
                    try:
                        container = q.get_nowait()
                        container.remove(force=True)
                    except:
                        pass

    def _maintain_pool(self):
        while self.running:
            if self.active_language:
                q = self.pools[self.active_language]
                if q.qsize() < POOL_SIZE:
                    c = self._create_container(self.active_language)
                    if c:
                        q.put(c)
            time.sleep(0.2)

    def _create_container(self, lang):
        image = IMAGE_MAP.get(lang)
        try:
            return self.client.containers.run(
                image,
                command="sleep infinity", 
                detach=True,
                mem_limit="128m",
                network_disabled=True, 
                working_dir="/tmp",
                labels={"created_by": "exam_ide_pool"}
            )
        except Exception as e:
            print(f"[-] Failed to spawn {lang}: {e}")
            return None

    
    def _purge_zombies(self):
        print("[*] Hunting for zombie containers...")
        zombies = self.client.containers.list(all=True, filters={"label": "created_by=exam_ide_pool"})
        for z in zombies:
            try:
                z.remove(force=True)
            except:
                pass

    def get_container(self, lang):
        if lang not in self.pools:
            raise ValueError(f"Unsupported language: {lang}")
        try:
            return self.pools[lang].get(timeout=10) 
        except queue.Empty:
            return None

    def cleanup(self, container):
        try:
            container.remove(force=True)
        except:
            pass

    def copy_code(self, container, filename, code_str):
        b64_code = base64.b64encode(code_str.encode('utf-8')).decode('utf-8')
        cmd = f"sh -c 'echo {b64_code} | base64 -d > /tmp/{filename}'"
        container.exec_run(cmd)

    def shutdown(self):
        self.running = False
        self._purge_zombies()

pool_manager = WarmContainerPool()