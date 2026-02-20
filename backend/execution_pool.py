import docker
import threading
import queue
import time
import tarfile
import io

# Configuration
POOL_SIZE = 3  # Keep 3 containers ready per language
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
        
        # Start the background janitor
        self.monitor_thread = threading.Thread(target=self._maintain_pool, daemon=True)
        self.monitor_thread.start()
        print(f"[+] Execution Pool Initialized. Target warm count: {POOL_SIZE}")

    def _create_container(self, lang):
        """Spawns a secure, isolated container idling on 'sleep infinity'."""
        image = IMAGE_MAP.get(lang)
        try:
            return self.client.containers.run(
                image,
                command="sleep infinity", 
                detach=True,
                mem_limit="128m",
                network_disabled=True,
                # 'user': '1000:1000', # Uncomment if you want non-root strictness (requires carefully built images)
                working_dir="/tmp",
                tmpfs={'/tmp': ''} # Writable RAM disk for speed
            )
        except Exception as e:
            print(f"[-] Failed to spawn {lang}: {e}")
            return None

    def _maintain_pool(self):
        """Background thread to refill queues."""
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
        return self.pools[lang].get(timeout=5) # Wait up to 5s for a container

    def cleanup(self, container):
        try:
            container.remove(force=True)
        except:
            pass

    def copy_code(self, container, filename, code_str):
        """Injects code directly into container memory (no shared volumes)."""
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode='w') as tar:
            data = code_str.encode('utf-8')
            info = tarfile.TarInfo(name=filename)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
        tar_stream.seek(0)
        container.put_archive("/tmp", tar_stream)

# Singleton Instance
pool_manager = WarmContainerPool()