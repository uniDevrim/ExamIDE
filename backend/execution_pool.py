import docker
import threading
import queue
import time
import base64
import atexit
import os

DEFAULT_LANG = None  
POOL_SIZE = 3  
IMAGE_MAP = {
    "python": "python:3.9-slim",
    "cpp": "gcc:latest",
    "csharp": "mcr.microsoft.com/dotnet/sdk:7.0"
}

class WarmContainerPool:
    def __init__(self):
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

        # Exam state
        self.exam_state            = "idle"   # idle | running | paused | ended
        self.exam_data             = {}       # yüklenen JSON verisi
        self.exam_started_at       = None     # datetime — sınav başladığında
        self.exam_paused_at        = None     # datetime — son duraklama anı
        self.exam_total_paused_secs = 0.0    # toplam duraklatılan süre (saniye)

        atexit.register(self.shutdown)

    def add_student(self, student_id, data):
        self.students[student_id] = data

    def get_all_students(self):
        return self.students

    def update_student_question(self, student_id, question_no):
        if student_id in self.students:
            self.students[student_id]['question'] = question_no
            from datetime import datetime
            self.students[student_id]['timestamp'] = datetime.now().strftime("%H:%M:%S")

    # ── Exam State ─────────────────────────────────────────────
    def set_exam_data(self, data: dict):
        """Admin JSON yükleyince çağrılır."""
        self.exam_data = data

    def set_exam_state(self, state: str):
        """idle | running | paused | ended"""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        prev = self.exam_state

        if state == "running":
            if prev == "idle" and self.exam_started_at is None:
                # İlk kez başlıyor
                self.exam_started_at = now
            elif prev == "paused" and self.exam_paused_at is not None:
                # Resume: duraklatma süresini toplama ekle
                paused_dur = (now - self.exam_paused_at).total_seconds()
                self.exam_total_paused_secs += paused_dur
                self.exam_paused_at = None

        elif state == "paused" and prev == "running":
            self.exam_paused_at = now

        elif state in ("idle", "ended"):
            # Sınav sona erdi, duraklama varsa kapat
            if self.exam_paused_at is not None:
                paused_dur = (now - self.exam_paused_at).total_seconds()
                self.exam_total_paused_secs += paused_dur
                self.exam_paused_at = None

        self.exam_state = state

    def _remaining_seconds(self) -> float:
        """Kalan süreyi saniye cinsinden hesaplar."""
        from datetime import datetime, timezone
        raw_time = self.exam_data.get("time", "")
        if not raw_time or self.exam_started_at is None:
            return -1  # bilinmiyor

        # Toplam süresi saniyeye çevir
        total = self._parse_time_secs(str(raw_time).strip())
        if total <= 0:
            return -1

        now = datetime.now(timezone.utc)
        elapsed = (now - self.exam_started_at).total_seconds()
        paused  = self.exam_total_paused_secs
        # Hâlâ duraklatılmışsa o süreyi de çıkar
        if self.exam_paused_at is not None:
            paused += (now - self.exam_paused_at).total_seconds()

        remaining = total - (elapsed - paused)
        return max(remaining, 0)

    @staticmethod
    def _parse_time_secs(s: str) -> float:

        if ":" in s:
            parts = list(map(float, s.split(":")))
            if len(parts) == 3:
                return parts[0]*3600 + parts[1]*60 + parts[2]
            if len(parts) == 2:
                return parts[0]*60 + parts[1]
        try:
            n = float(s)
            return n * 60  # sayı ise dakika kabul et
        except ValueError:
            return 0

    def get_exam_status(self) -> dict:
        """Client polling için durum + soru verisi döner (test case cevapları HARİÇ)."""
        questions_safe = {}
        raw_questions = self.exam_data.get("questions", {})
        for key, q in raw_questions.items():
            questions_safe[key] = {
                "title"          : q.get("title", ""),
                "description"    : q.get("description", ""),
                "test-cases"     : q.get("test-cases", []),
                "run-time-limit" : q.get("run-time-limit", 5),
                "memory-limit"   : q.get("memory-limit", 1024),
                "points"         : q.get("points", 0),
            }
        exam_meta = {
            "name"        : self.exam_data.get("name", ""),
            "description" : self.exam_data.get("description", ""),
            "time"        : self.exam_data.get("time", ""),
            "language"    : self.exam_data.get("language", ""),
        } if self.exam_data else {}
        return {
            "state"             : self.exam_state,
            "started_at"        : self.exam_started_at.isoformat() if self.exam_started_at else None,
            "remaining_seconds" : self._remaining_seconds(),   # <-- kalan süre
            "exam"              : exam_meta,
            "questions"         : questions_safe,
        }
    # ────────────────────────────────────────────────────────────

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

    def run_with_stdin(self, code: str, lang: str, stdin_input: str, expected_output: str) -> bool:
        container = None
        image = IMAGE_MAP.get(lang)

        try:
            container = self.client.containers.run(
                image,
                command="sleep 30",
                detach=True,
                mem_limit="128m",
                network_disabled=True,
                working_dir="/tmp",
                auto_remove=True
            )
            container = self.get_container(lang)
            if container is None:
                print("[-] run_with_stdin: No container available")
                return False

            try:
                container.reload()
                if container.status != "running":
                    raise Exception("Stale container")
            except Exception:
                container = self.get_container(lang)
                if container is None:
                    return False

            if lang == "python":
                self.copy_code(container, "main.py", code)
                exec_cmd = "python3 /tmp/main.py"
            elif lang == "cpp":
                self.copy_code(container, "main.cpp", code)
                exec_cmd = "g++ -o /tmp/app /tmp/main.cpp && chmod +x /tmp/app && /tmp/app"
            elif lang == "csharp":
                self.copy_code(container, "Program.cs", code)
                exec_cmd = "cd /tmp && dotnet run"
            else:
                return False

            b64_input = base64.b64encode(stdin_input.encode('utf-8')).decode('utf-8')
            container.exec_run(f"sh -c 'echo {b64_input} | base64 -d > /tmp/stdin_input.txt'")
            full_cmd = f"sh -c '{exec_cmd} < /tmp/stdin_input.txt'"

            _, output_bytes = container.exec_run(full_cmd, demux=True)

            stdout = output_bytes[0].decode().strip() if output_bytes[0] else ""
            return stdout == expected_output.strip()
        
        except Exception as e:
            print(f"[-] run_with_stdin error: {e}")
            return False


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