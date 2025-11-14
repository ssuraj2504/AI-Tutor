from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from local_rag import generate_answer
from youtube_search import get_youtube_links
import os

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for frontend

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
    pdf_dir = "subject_pdfs"
    if not os.path.exists(pdf_dir):
        return jsonify({"subjects": []})
    
    subjects = [d for d in os.listdir(pdf_dir) if os.path.isdir(os.path.join(pdf_dir, d))]
    return jsonify({"subjects": subjects})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
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
        
        return jsonify({
            "answer": answer,
            "sources": sources,
            "videos": videos,
            "subject": subject
        })
    
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n🚀 Starting AI Tutor API Server...")
    print("📡 API will be available at http://localhost:5000")
    print("🌐 Frontend should connect to http://localhost:5000/api\n")
    app.run(debug=True, port=5000, host='0.0.0.0')

