from flask import Blueprint, request, jsonify
from backend.execution_pool import pool_manager
import time

client_bp = Blueprint('client_bp', __name__)

@client_bp.route('/run', methods=['POST'])
def run_code():
    # 1. Validate Input
    data = request.json or {}
    code = data.get('code')
    lang = data.get('language', 'python') # Default to python if missing

    if not code:
        return jsonify({"output": "No code provided", "exit_code": -1}), 400
    
    if lang not in ["python", "cpp", "csharp"]:
        return jsonify({"output": f"Language '{lang}' not supported"}), 400

    container = None
    try:
        # 2. Get Warm Container (Instant)
        container = pool_manager.get_container(lang)
        
        # 3. Prepare Execution Command
        exec_cmd = ""
        if lang == "python":
            pool_manager.copy_code(container, "main.py", code)
            exec_cmd = "python main.py"
            
        elif lang == "cpp":
            pool_manager.copy_code(container, "main.cpp", code)
            exec_cmd = "g++ -o app main.cpp && ./app"
            
        elif lang == "csharp":
            pool_manager.copy_code(container, "Program.cs", code)
            # Create a minimal .csproj for valid .NET execution
            csproj = '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net7.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup></Project>'
            pool_manager.copy_code(container, "App.csproj", csproj)
            # 'dotnet run' restores, builds, and runs.
            exec_cmd = "dotnet run --project /tmp/App.csproj"

        # 4. Execute
        # Timeout protects against infinite loops (e.g., while(True))
        start_time = time.time()
        
        # We use a shell to enable operators like '&&'
        exit_code, output_bytes = container.exec_run(
            f"sh -c '{exec_cmd}'", 
            demux=True  # Returns tuple (stdout, stderr)
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
        return jsonify({"output": f"System Error: {str(e)}"}), 500
        
    finally:
        # 5. Destroy Container
        if container:
            # Run cleanup in background ideally, but here for safety:
            pool_manager.cleanup(container)