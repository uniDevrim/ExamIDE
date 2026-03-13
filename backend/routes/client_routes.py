from flask import Blueprint, request, jsonify, session
from ..execution_pool import pool_manager
import time
import json
import os
from datetime import datetime

client_bp = Blueprint('client_bp', __name__)


@client_bp.route('/exam/status', methods=['GET'])
def exam_status():

    if 'user' not in session and not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 401

    # Update last-seen for the student on every poll (usually every few seconds)
    if 'user' in session:
        student_id = session['user'].get('no')
        if student_id:
            pool_manager.touch_student(student_id, request.remote_addr)

    return jsonify(pool_manager.get_exam_status()), 200

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

        try:
            container.reload() 
            if container.status != "running":
                raise Exception("Stale container")
        except:
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
        if container:
            pool_manager.cleanup(container)


@client_bp.route('/submit', methods=['POST'])
def submit():

    data = request.json or {}
    exam_id = data.get('exam_id')
    student_id = data.get('student_id')       
    lang = data.get('language', 'python')
    questions = data.get('questions') 

    if not exam_id or not student_id or not questions:
        return jsonify({"error": "Missing exam_id, student_id or questions"}), 400
    submissions_dir = os.path.join('grader', 'submissions', str(exam_id))
    os.makedirs(submissions_dir, exist_ok=True)
    submission_path = os.path.join(submissions_dir, f"{student_id}.json")

    if os.path.exists(submission_path):
        return jsonify({"error": "Already submitted"}), 403

    tests_dir = os.path.join('grader', 'test_cases', str(exam_id))
    if not os.path.exists(tests_dir):
        return jsonify({"error": "Exam not found"}), 404

    result_questions = []

    for q in questions:
        question_id = q.get('question_id')
        code = q.get('code', '')

        test_file = os.path.join(tests_dir, f"{question_id}.json")
        if not os.path.exists(test_file):
            result_questions.append({
                "question_id": question_id,
                "code": code,
                "tests": []
            })
            continue

        with open(test_file) as f:
            test_data = json.load(f)

        test_results = []

        for test in test_data.get('tests', []):
            stdin_input = test.get('input', '')
            expected = test.get('expected', '').strip()

            passed = pool_manager.run_with_stdin(
                code=code,
                lang=lang,
                stdin_input=stdin_input,
                expected_output=expected
            )
            test_results.append(passed)

        result_questions.append({
            "question_id": question_id,
            "code": code,
            "tests": test_results   
        })

    submission = {
        "student_id": student_id,
        "submitted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "questions": result_questions
    }

    with open(submission_path, 'w') as f:
        json.dump(submission, f, indent=2)

    return jsonify({"message": "Submitted successfully"}), 200