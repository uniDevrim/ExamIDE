import docker
import threading
import queue
import time
import base64
import atexit

# Configuration
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
        self.running = True
        
        # 1. THE REAPER: Kill any leftovers from previous runs
        self._purge_zombies()
        
        # Start the background janitor
        self.monitor_thread = threading.Thread(target=self._maintain_pool, daemon=True)
        self.monitor_thread.start()
        print(f"[+] Execution Pool Initialized. Target warm count: {POOL_SIZE}")

        # Try to clean up on normal exit
        atexit.register(self.shutdown)

    def _purge_zombies(self):
        """Finds and kills containers left behind by previous server restarts."""
        print("[*] Hunting for zombie containers...")
        # We look for containers with our specific label
        zombies = self.client.containers.list(
            all=True, 
            filters={"label": "created_by=exam_ide_pool"}
        )
        for z in zombies:
            try:
                z.remove(force=True)
                print(f"    - Killed zombie: {z.short_id}")
            except:
                pass
        print(f"[*] Purge complete. Deleted {len(zombies)} orphans.")

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
                # 2. TAGGING: Mark this container as ours
                labels={"created_by": "exam_ide_pool"} 
            )
        except Exception as e:
            print(f"[-] Failed to spawn {lang}: {e}")
            return None

    def _maintain_pool(self):
        while self.running:
            for lang, q in self.pools.items():
                if q.qsize() < POOL_SIZE:
                    c = self._create_container(lang)
                    if c:
                        q.put(c)
            time.sleep(1)

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
        # ... (Keep your Base64 version here) ...
        b64_code = base64.b64encode(code_str.encode('utf-8')).decode('utf-8')
        cmd = f"sh -c 'echo {b64_code} | base64 -d > /tmp/{filename}'"
        container.exec_run(cmd)

    def shutdown(self):
        self.running = False
        self._purge_zombies()

# Singleton Instance
pool_manager = WarmContainerPool()