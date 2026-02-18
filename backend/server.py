import subprocess
import os
import uuid
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 5000))

SYSTEM_TEMP_DIR = tempfile.gettempdir()


@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    if not code:
        return jsonify({"output": "No code provided"}), 400

    unique_filename = f"code_{uuid.uuid4().hex}.py"
    host_file_path = os.path.join(SYSTEM_TEMP_DIR, unique_filename)

    try:
        with open(host_file_path, "w") as f:
            f.write(code)
        docker_command = [
            "docker", "run", "--rm", "--network", "none",
            "-v", f"{host_file_path}:/app/code.py",
            "python:alpine",
            "python", "/app/code.py"
        ]

        result = subprocess.run(
            docker_command,
            capture_output=True,
            text=True,
            timeout=8  
        )

        output = result.stdout if result.returncode == 0 else result.stderr
        return jsonify({"output": output})

    except subprocess.TimeoutExpired:
        return jsonify({"output": "Error: Execution timed out (Infinite Loop?)"}), 408
    except Exception as e:
        print(f"Sistem Hatası: {str(e)}")  # Terminalde hatayı görmek için
        return jsonify({"output": f"Server Error: {str(e)}"}), 500
    finally:
        if os.path.exists(host_file_path):
            os.remove(host_file_path)

if __name__ == '__main__':
    app.run(debug=True, port=PORT)