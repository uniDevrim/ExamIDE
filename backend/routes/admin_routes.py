from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from ..execution_pool import pool_manager
import os
import json

template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend_admin'))
admin_bp = Blueprint('admin_bp', __name__, template_folder=template_dir)

students_db = {}

@admin_bp.route('/dashboard')
def admin_dashboard():
    if not session.get('is_admin'):
        return redirect(url_for('auth.login'))

    return render_template('admin.html')


@admin_bp.route('/students')
def get_students():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    all_students = pool_manager.get_all_students()

    formatted_data = {}
    for ip, info in all_students.items():
        formatted_data[ip] = {
            "student_id": info.get('no'),
            "full_name": f"{info.get('ad', '')} {info.get('soyad', '')}",
            "current_question": info.get('question', 1),
            "last_seen": info.get('timestamp', '—')
        }

    return jsonify(formatted_data)

@admin_bp.route('/start_exam', methods=['POST'])
def start_exam():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json or {}
    language = data.get('language')
    exam_data = data.get('exam_data')  # yüklenen JSON verisinin tamamı

    if not language:
        return jsonify({"error": "Language required"}), 400

    if language.lower() not in ["python", "cpp", "csharp"]:
        return jsonify({"error": "Unsupported language"}), 400

    pool_manager.set_exam_language(language.lower())

    if exam_data:
        pool_manager.set_exam_data(exam_data)

    pool_manager.set_exam_state("running")

    return jsonify({"status": "Exam started", "mode": language}), 200


@admin_bp.route('/pause_exam', methods=['POST'])
def pause_exam():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    if pool_manager.exam_state != "running":
        return jsonify({"error": "Exam is not running"}), 400

    pool_manager.set_exam_state("paused")
    return jsonify({"status": "Exam paused"}), 200


@admin_bp.route('/resume_exam', methods=['POST'])
def resume_exam():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    if pool_manager.exam_state != "paused":
        return jsonify({"error": "Exam is not paused"}), 400

    pool_manager.set_exam_state("running")
    return jsonify({"status": "Exam resumed"}), 200


@admin_bp.route('/end_exam', methods=['POST'])
def end_exam():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    if pool_manager.exam_state not in ("running", "paused"):
        return jsonify({"error": "No active exam"}), 400

    pool_manager.set_exam_state("ended")
    return jsonify({"status": "Exam ended"}), 200


@admin_bp.route('/exam/status')
def admin_exam_status():
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify(pool_manager.get_exam_status()), 200


# ---------------------------------------------------------------
# test case hazırlanımı
#
# POST /admin/exam/<exam_id>/tests
# Header: Authorization: Bearer <your_token>
#
# Body:
# {
#   "question_id": "q1",
#   "tests": [
#     { "input": "5\n3", "expected": "8" },
#     { "input": "0\n0", "expected": "0" }
#   ]
# }
# ---------------------------------------------------------------


@admin_bp.route('/exam/<exam_id>/tests', methods=['POST'])
def upload_tests(exam_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json or {}
    question_id = data.get('question_id')
    tests = data.get('tests')

    if not question_id or not tests:
        return jsonify({"error": "question_id and tests are required"}), 400

    for t in tests:
        if 'input' not in t or 'expected' not in t:
            return jsonify({"error": "Each test needs 'input' and 'expected'"}), 400

    tests_dir = os.path.join('grader', 'test_cases', str(exam_id))
    os.makedirs(tests_dir, exist_ok=True)

    test_file = os.path.join(tests_dir, f"{question_id}.json")
    with open(test_file, 'w') as f:
        json.dump({"question_id": question_id, "tests": tests}, f, indent=2)

    return jsonify({
        "status": "saved",
        "exam_id": exam_id,
        "question_id": question_id,
        "test_count": len(tests)
    }), 200


@admin_bp.route('/exam/<exam_id>/results', methods=['GET'])
def get_results(exam_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    submissions_dir = os.path.join('grader', 'submissions', str(exam_id))

    if not os.path.exists(submissions_dir):
        return jsonify([]), 200

    results = []
    for filename in os.listdir(submissions_dir):
        if filename.endswith('.json'):
            with open(os.path.join(submissions_dir, filename)) as f:
                results.append(json.load(f))

    return jsonify(results), 200