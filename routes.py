# routes.py
import uuid
from flask import Blueprint, render_template, request, jsonify, session, Response
from services import AdmissionAssistantService
import database
import utils

# Define blueprints
main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)

# Initialize service
service = AdmissionAssistantService()

def get_or_create_session_id():
    """Generates or retrieves a unique session ID for chat tracking."""
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return session['session_id']

# ==========================================
# HTML View Routes (main_bp)
# ==========================================

@main_bp.route('/')
def index():
    """Serves the main single-page application containing all view portals."""
    # Ensure session tracking is active
    get_or_create_session_id()
    
    # Retrieve current profile status if logged in
    student_email = session.get('student_email')
    profile = None
    if student_email:
        profile = database.get_profile(student_email)
        
    return render_template('index.html', profile=profile)

# ==========================================
# REST API Routes (api_bp)
# ==========================================

@api_bp.route('/chat', methods=['POST'])
def chat():
    """
    Handles student messages. Invokes the RAG system and Watsonx.ai model,
    maintaining context in the Flask session.
    """
    data = request.json or {}
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({"error": "Empty message."}), 400

    session_id = get_or_create_session_id()
    student_email = session.get('student_email')

    # Load session chat history
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    history = session['chat_history']

    # Execute service pipeline
    result = service.process_student_query(session_id, student_email, message, history)
    
    # Update session chat history
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": result["response"]})
    session['chat_history'] = history[-10:]  # Keep last 10 messages for token efficiency
    session.modified = True

    return jsonify({
        "response": result["response"],
        "is_live_watsonx": result["is_live_watsonx"]
    })

@api_bp.route('/chat/clear', methods=['POST'])
def clear_chat():
    """Clears the current chat session history."""
    session['chat_history'] = []
    session.modified = True
    return jsonify({"status": "Chat history cleared."})

@api_bp.route('/chat/export', methods=['GET'])
def export_chat():
    """Exports the chat transcript as a downloadable markdown document."""
    session_id = get_or_create_session_id()
    conn = database.get_db_connection()
    rows = conn.execute(
        "SELECT * FROM chat_logs WHERE session_id = ? ORDER BY id ASC", 
        (session_id,)
    ).fetchall()
    conn.close()
    
    chat_logs = [dict(row) for row in rows]
    md_content = utils.export_chat_history(session_id, chat_logs)
    
    return Response(
        md_content,
        mimetype="text/markdown",
        headers={"Content-disposition": f"attachment; filename=VFSTR_Counselling_Transcript_{session_id[:8]}.md"}
    )

@api_bp.route('/profile', methods=['GET', 'POST'])
def profile():
    """Manages student profile fetching and registration updates."""
    if request.method == 'POST':
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        education = data.get('education', '').strip()
        marks = float(data.get('marks', 0) or 0)
        pref_course = data.get('preferred_course', '').strip()
        career_goal = data.get('career_goal', '').strip()
        
        if not email or not name:
            return jsonify({"error": "Email and Name are required fields."}), 400
            
        # Write to SQLite
        updated_prof = database.save_or_update_profile(
            email=email, name=name, phone=phone, education=education, 
            marks=marks, preferred_course=pref_course, career_goal=career_goal
        )
        
        # Log session variables
        session['student_email'] = email
        session['student_name'] = name
        session.modified = True
        
        return jsonify({"message": "Profile updated successfully.", "profile": updated_prof})
    
    # GET Request: check session
    email = session.get('student_email')
    if not email:
        return jsonify({"profile": None})
        
    profile_data = database.get_profile(email)
    return jsonify({"profile": profile_data})

@api_bp.route('/profile/logout', methods=['POST'])
def logout():
    """Logs out the current student session."""
    session.pop('student_email', None)
    session.pop('student_name', None)
    session.pop('chat_history', None)
    session.modified = True
    return jsonify({"status": "Logged out."})

@api_bp.route('/eligibility', methods=['POST'])
def check_eligibility():
    """Performs dynamic eligibility calculations and course suggestions."""
    data = request.json or {}
    results = service.check_eligibility(data)
    return jsonify(results)

@api_bp.route('/bookmarks', methods=['GET', 'POST', 'DELETE'])
def bookmarks_handler():
    """Handles adding, listing, and deleting Q&A bookmarks for logged-in students."""
    email = session.get('student_email')
    if not email:
        return jsonify({"error": "Please register or log in to use bookmarks."}), 401
        
    if request.method == 'POST':
        data = request.json or {}
        query = data.get('query', '').strip()
        response = data.get('response', '').strip()
        if not query or not response:
            return jsonify({"error": "Incomplete QA data."}), 400
        database.add_bookmark(email, query, response)
        return jsonify({"message": "Bookmark added."})
        
    elif request.method == 'DELETE':
        data = request.json or {}
        query = data.get('query', '').strip()
        database.remove_bookmark(email, query)
        return jsonify({"message": "Bookmark removed."})
        
    # GET: return bookmarks list
    prof = database.get_profile(email)
    return jsonify({"bookmarks": prof.get("bookmarks", []) if prof else []})

# ==========================================
# Admin Operations
# ==========================================

@api_bp.route('/admin/analytics', methods=['GET'])
def admin_analytics():
    """Gets dashboard analytics for the admin panel."""
    stats = database.get_analytics()
    return jsonify(stats)

@api_bp.route('/admin/faq', methods=['GET', 'POST'])
def admin_faq():
    """Allows administrators to view, create, or update supplementary FAQs."""
    if request.method == 'POST':
        data = request.json or {}
        q = data.get('question', '').strip()
        a = data.get('answer', '').strip()
        c = data.get('category', 'General').strip()
        
        if not q or not a:
            return jsonify({"error": "Question and Answer cannot be empty."}), 400
            
        success = database.add_faq(q, a, c)
        if success:
            return jsonify({"message": "FAQ added successfully."})
        else:
            return jsonify({"error": "FAQ with this question already exists."}), 400
            
    # GET: return all
    return jsonify({"faqs": database.get_all_faqs()})

@api_bp.route('/admin/faq/<int:faq_id>', methods=['DELETE'])
def admin_delete_faq(faq_id):
    """Deletes an FAQ by ID."""
    database.delete_faq(faq_id)
    return jsonify({"message": "FAQ deleted."})
