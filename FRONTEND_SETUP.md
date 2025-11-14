# 🚀 AI Tutor - Web Application Setup Guide

## Overview

This is a full-stack AI Tutor application with a beautiful modern frontend and Flask backend. The application allows students to ask questions about different subjects and get AI-powered answers with source references and YouTube video recommendations.

## Features

- ✨ **Modern, Responsive UI** - Beautiful gradient design with smooth animations
- 📚 **Multi-Subject Support** - Organize and query different subjects
- 🤖 **AI-Powered Answers** - RAG (Retrieval Augmented Generation) based responses
- 📖 **Source Tracking** - See which PDFs were used for answers
- 🎥 **YouTube Recommendations** - Get relevant video suggestions
- 💬 **Real-time Chat Interface** - Interactive chat experience

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### 2. Organize Your PDFs

Create subject folders in `subject_pdfs/` directory:

```
subject_pdfs/
├── OS/
│   ├── Lecture1.pdf
│   └── Lecture2.pdf
├── DBMS/
│   └── Database_Notes.pdf
└── CN/
    └── Networks.pdf
```

### 3. Start the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 4. Open in Browser

Open your web browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
AI-Tutor-Local/
├── app.py                 # Flask API server
├── local_rag.py           # RAG implementation
├── youtube_search.py      # YouTube search functionality
├── config.py             # API configuration
├── chat.py               # CLI version (optional)
├── static/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
├── subject_pdfs/         # PDF files organized by subject
├── indexes/              # Auto-generated FAISS indexes
└── requirements.txt      # Python dependencies
```

## API Endpoints

### `GET /api/health`
Health check endpoint
- **Response**: `{"status": "healthy", "message": "AI Tutor API is running"}`

### `GET /api/subjects`
Get list of available subjects
- **Response**: `{"subjects": ["OS", "DBMS", "CN"]}`

### `POST /api/chat`
Send a chat message
- **Request Body**:
  ```json
  {
    "query": "Explain normalization in databases",
    "subject": "DBMS"
  }
  ```
- **Response**:
  ```json
  {
    "answer": "Normalization is a process...",
    "sources": ["DBMS_Notes.pdf"],
    "videos": [
      {
        "title": "Database Normalization Explained",
        "link": "https://youtube.com/..."
      }
    ],
    "subject": "DBMS"
  }
  ```

## Usage

1. **Select a Subject**
   - Choose from available subjects or enter a custom subject name
   - Subjects are automatically detected from `subject_pdfs/` folder

2. **Ask Questions**
   - Type your question in the chat input
   - Press Enter or click the send button
   - Wait for the AI to process and respond

3. **View Results**
   - Read the AI-generated answer
   - Check the sources (PDF files used)
   - Click on recommended YouTube videos

4. **Change Subject**
   - Click "Change Subject" button to switch to a different subject

## Troubleshooting

### Server won't start
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Check if port 5000 is available
- Ensure virtual environment is activated

### No subjects showing
- Create folders in `subject_pdfs/` directory
- Add at least one PDF file to each subject folder
- Refresh the page

### API errors
- Check if `config.py` has valid RapidAPI credentials
- Ensure PDFs are properly formatted
- Check server console for error messages

### Frontend not loading
- Make sure `static/` folder exists with all files
- Check browser console for errors
- Verify server is running on port 5000

## Development

### Running in Debug Mode
The server runs in debug mode by default. To disable:
```python
app.run(debug=False, port=5000)
```

### Customizing the Frontend
- Edit `static/style.css` for styling
- Edit `static/script.js` for functionality
- Edit `static/index.html` for structure

### Adding New Features
- Backend: Modify `app.py` and related Python files
- Frontend: Update `static/` files
- API: Add new routes in `app.py`

## Notes

- **First Run**: The application will download embedding models (~500MB) on first use
- **Index Building**: FAISS indexes are built automatically when you first query a subject
- **Internet Required**: YouTube search requires internet connection
- **API Key**: Make sure `config.py` has valid RapidAPI credentials

## Technologies Used

- **Backend**: Flask, LangChain, FAISS, HuggingFace
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI/ML**: Sentence Transformers, RAG
- **Search**: YouTube Search API

## License

This is a final year project. Use as needed for educational purposes.

