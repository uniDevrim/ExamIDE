import docker
import threading
import queue
import time
import base64
import atexit

DEFAULT_LANG = None  
POOL_SIZE = 3   #hazırda bekleyen container sayısı
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
        
        # 1. Kill any zombies from previous runs
        self._purge_zombies()
        
        # 2. Start the background monitor
        self.monitor_thread = threading.Thread(target=self._maintain_pool, daemon=True)
        self.monitor_thread.start()
        
        atexit.register(self.shutdown)

    def set_exam_language(self, lang):
        """
        Called by the Admin 'Start Exam' button.
        Switches the active language and kills the unused ones.
        """
        print(f"[!] Switching Exam Language to: {lang}")
        self.active_language = lang
        
        # CLEANUP: Kill containers that don't match the new language
        for pool_lang, q in self.pools.items():
            if pool_lang != lang:
                while not q.empty():
                    try:
                        container = q.get_nowait()
                        container.remove(force=True)
                        print(f"    - Killed unused {pool_lang} container")
                    except:
                        pass

    def _maintain_pool(self):
        """
        The Brain: Only spawns containers for the ACTIVE language.
        """
        while self.running:
            if self.active_language and self.active_language in self.pools:
                q = self.pools[self.active_language]
                if q.qsize() < POOL_SIZE:
                    c = self._create_container(self.active_language)
                    if c:
                        q.put(c)
            time.sleep(1)

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
                tmpfs={'/tmp': ''},
                labels={"created_by": "exam_ide_pool"} # Tagging for cleanup
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
        return self.pools[lang].get(timeout=5)

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