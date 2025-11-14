# auth
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from local_rag import generate_answer
from youtube_search import get_youtube_links
import os
from users import init_db, authenticate_user, create_user, verify_token, invalidate_token

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for frontend

# Initialize users DB
init_db()

# Serve frontend
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Don't serve API routes as static files
    if path.startswith('api/'):
        return None
    return send_from_directory('static', path)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "AI Tutor API is running"})

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Get list of available subjects"""
    # Auth: require Bearer token
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    user = verify_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    pdf_dir = "subject_pdfs"
    if not os.path.exists(pdf_dir):
        return jsonify({"subjects": []})
    
    subjects = [d for d in os.listdir(pdf_dir) if os.path.isdir(os.path.join(pdf_dir, d))]
    return jsonify({"subjects": subjects})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        # Auth: require token
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        user = verify_token(token)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        query = data.get('query', '').strip()
        subject = data.get('subject', '').strip()
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        if not subject:
            return jsonify({"error": "Subject is required"}), 400
        
        # Generate answer using RAG
        answer, sources = generate_answer(query, subject)
        
        # Get YouTube video suggestions
        try:
            videos = get_youtube_links(query, limit=3)
        except Exception as e:
            print(f"⚠️ YouTube search error: {e}")
            videos = []
        
        # Save chat history for the user
        try:
            from users import add_chat_entry
            if user and 'id' in user:
                add_chat_entry(user['id'], subject, query, answer, sources, videos)
        except Exception as e:
            print(f"⚠️ Could not save chat history: {e}")

        return jsonify({
            "answer": answer,
            "sources": sources,
            "videos": videos,
            "subject": subject
        })
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    ok, result = create_user(username, password)
    if not ok:
        return jsonify({"error": result}), 400

    # auto-login - generate token and return user info
    auth_ok, token = authenticate_user(username, password)
    if not auth_ok:
        return jsonify({"message": "user created, please login"}), 201
    user = verify_token(token)
    return jsonify({"token": token, "user": user}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    ok, result = authenticate_user(username, password)
    if not ok:
        return jsonify({"error": result}), 401
    token = result
    user = verify_token(token)
    return jsonify({"token": token, "user": user})


@app.route('/api/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    if token:
        invalidate_token(token)
    return jsonify({"message": "logged out"})


@app.route('/api/history', methods=['GET'])
def history():
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    user = verify_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        from users import get_chat_history
        history = get_chat_history(user['id'], limit=200)
        return jsonify({"history": history})
    except Exception as e:
        print(f"⚠️ Could not load history: {e}")
        return jsonify({"history": []})

if __name__ == '__main__':
    print("\n🚀 Starting AI Tutor API Server...")
    print("📡 API will be available at http://localhost:5000")
    print("🌐 Frontend should connect to http://localhost:5000/api\n")
    app.run(debug=True, port=5000, host='0.0.0.0')


