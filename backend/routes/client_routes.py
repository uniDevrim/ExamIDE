from flask import Blueprint, request, jsonify
import subprocess
import os
import uuid

client_bp = Blueprint('client_bp', __name__)

# Use absolute paths so it works regardless of where you run the script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
TEMP_DIR = os.path.join(BASE_DIR, '..', 'grader', 'temp_submissions')

@client_bp.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    if not code:
        return jsonify({"output": "No code provided"}), 400

    # Ensure the directory exists before writing
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)

    unique_filename = f"code_{uuid.uuid4().hex}.py"
    host_file_path = os.path.join(TEMP_DIR, unique_filename)

    try:
        with open(host_file_path, "w") as f:
            f.write(code)
            
        # Your Docker logic follows...
        docker_command = [
            "docker", "run", "--rm", "--network", "none",
            "-v", f"{host_file_path}:/app/code.py",
            "python:alpine",
            "python", "/app/code.py"
        ]
        
        result = subprocess.run(docker_command, capture_output=True, text=True, timeout=8)
        output = result.stdout if result.returncode == 0 else result.stderr
        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"output": f"Execution Error: {str(e)}"}), 500
    finally:
        if os.path.exists(host_file_path):
            os.remove(host_file_path)