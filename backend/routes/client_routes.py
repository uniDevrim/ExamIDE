from flask import Blueprint, request, jsonify
from ..execution_pool import pool_manager
import time

client_bp = Blueprint('client_bp', __name__)

@client_bp.route('/run', methods=['POST'])
def run_code():
    
    data = request.json or {}
    code = data.get('code')
    lang = data.get('language', 'python') 

    if not code:
        return jsonify({"stdout": "", "stderr": "Error: No code provided", "exit_code": -1}), 400
    
    if lang not in ["python", "cpp", "csharp"]:
        return jsonify({"stdout": "", "stderr": f"Error: Language '{lang}' not supported", "exit_code": -1}), 400

    container = None
    try:
        container = pool_manager.get_container(lang)
        
        if container is None:
            return jsonify({"stdout": "", "stderr": "Hata: Bu dil için hazır konteyner bulunamadı. Sınav başlatılmamış olabilir.", "exit_code": -1}), 503
        
        exec_cmd = ""
        
        if lang == "python":
            pool_manager.copy_code(container, "main.py", code)
            exec_cmd = "python3 /tmp/main.py" 
            
        elif lang == "cpp":
            pool_manager.copy_code(container, "main.cpp", code)
            exec_cmd = "g++ -o /tmp/app /tmp/main.cpp && chmod +x /tmp/app && /tmp/app"
            
        elif lang == "csharp":
            pool_manager.copy_code(container, "Program.cs", code)
            exec_cmd = "cd /tmp && dotnet run"

        start_time = time.time()
        
        exit_code, output_bytes = container.exec_run(
            f"sh -c '{exec_cmd}'", 
            demux=True 
        )
        
        stdout = output_bytes[0].decode() if output_bytes[0] else ""
        stderr = output_bytes[1].decode() if output_bytes[1] else ""
        
        return jsonify({
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code,
            "duration": round(time.time() - start_time, 2)
        })

    except Exception as e:
        print(f"[-] CRITICAL ERROR: {e}")
        return jsonify({"stdout": "", "stderr": f"System Error: {str(e)}", "exit_code": -1}), 500
        
    finally:
        # 5. Clean up
        if container:
            pool_manager.cleanup(container)