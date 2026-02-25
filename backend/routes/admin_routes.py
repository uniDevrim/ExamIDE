from flask import Blueprint, request, jsonify
from ..execution_pool import pool_manager

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/start_exam', methods=['POST'])
def start_exam():
    data = request.json
    language = data.get('language')
    
    if not language:
        return jsonify({"error": "Language required"}), 400
        
    if language not in ["python", "cpp", "csharp"]:
        return jsonify({"error": "Unsupported language"}), 400

    # Share the pool_manager across the app
    pool_manager.set_exam_language(language)
    
    return jsonify({"status": "Exam started", "mode": language}), 200