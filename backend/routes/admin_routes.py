from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from ..execution_pool import pool_manager
import os
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
    data = request.json
    language = data.get('language')
    
    if not language:
        return jsonify({"error": "Language required"}), 400
        
    if language not in ["python", "cpp", "csharp"]:
        return jsonify({"error": "Unsupported language"}), 400

    pool_manager.set_exam_language(language)
    
    return jsonify({"status": "Exam started", "mode": language}), 200