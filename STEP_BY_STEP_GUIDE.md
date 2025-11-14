# 📖 Step-by-Step Guide to Run AI Tutor

## Prerequisites
- Python 3.8 or higher installed
- Internet connection (for first-time setup and YouTube features)
- PDF files organized by subject (optional, but recommended)

---

## Step 1: Open Terminal/Command Prompt

### Windows:
- Press `Win + R`, type `cmd` or `powershell`, press Enter
- Or right-click in your project folder and select "Open in Terminal"

### Mac/Linux:
- Open Terminal application
- Navigate to your project folder using `cd` command

---

## Step 2: Navigate to Project Directory

```bash
cd "S:\backend learning\ash\AI-Tutor-Local - Copy"
```

**Note:** Replace the path with your actual project location if different.

---

## Step 3: Create Virtual Environment (Recommended)

### Windows:
```bash
python -m venv .venv
.\.venv\Scripts\activate
```

### Mac/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**What you'll see:** Your terminal prompt will show `(.venv)` at the beginning, indicating the virtual environment is active.

**If you get an error:** Make sure Python is installed. Try `python --version` to check.

---

## Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

**This will install:**
- Flask (web server)
- LangChain (AI framework)
- FAISS (vector database)
- Sentence Transformers (embeddings)
- And other required packages

**Time:** This may take 5-10 minutes depending on your internet speed.

**What you'll see:** Progress bars showing package installation.

**If you get errors:**
- Make sure you're in the project directory
- Try: `pip install --upgrade pip` first
- On Windows, you might need: `python -m pip install -r requirements.txt`

---

## Step 5: Organize Your PDFs (If Not Done Already)

Create subject folders and add PDF files:

```
subject_pdfs/
├── DBMS/
│   └── your_database_notes.pdf
├── ML/
│   └── machine_learning.pdf
└── OS/
    └── operating_systems.pdf
```

**How to do it:**
1. Open the `subject_pdfs` folder in your project
2. Create a new folder for each subject (e.g., "DBMS", "ML", "OS")
3. Copy your PDF files into the respective subject folders

**Note:** You can skip this step if you already have PDFs organized, or if you want to test with a custom subject name.

---

## Step 6: Check Your Configuration

Open `config.py` and verify your RapidAPI credentials are set:

```python
RAPID_API_KEY = "your-api-key-here"
RAPID_API_URL = "https://open-ai21.p.rapidapi.com/conversationllama"
RAPID_API_HOST = "open-ai21.p.rapidapi.com"
```

**If you don't have an API key:** You'll need to get one from RapidAPI. The app will still work but may show API errors.

---

## Step 7: Start the Server

```bash
python app.py
```

**What you'll see:**
```
🚀 Starting AI Tutor API Server...
📡 API will be available at http://localhost:5000
🌐 Frontend should connect to http://localhost:5000/api

 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

**Important:** Keep this terminal window open! The server must be running for the app to work.

**If you get an error:**
- **Port 5000 already in use:** Change the port in `app.py` (line 76) to `port=5001` or another number
- **Module not found:** Make sure you installed all dependencies (Step 4)
- **Permission denied:** On Mac/Linux, you might need `sudo` (not recommended) or change the port

---

## Step 8: Open the Application in Browser

1. Open your web browser (Chrome, Firefox, Edge, Safari, etc.)
2. Go to: **http://localhost:5000**

**What you'll see:**
- A beautiful gradient interface
- Subject selection screen (if you have PDFs organized)
- Or a message to add subjects

---

## Step 9: Use the Application

### 9.1 Select a Subject
- Click on a subject button (e.g., "DBMS", "ML")
- Or type a custom subject name in the input field and click "Use This"

### 9.2 Ask a Question
- Type your question in the chat input at the bottom
- Press `Enter` or click the send button (paper plane icon)

### 9.3 View Results
- Wait a few seconds for the AI to process
- You'll see:
  - **Answer:** AI-generated response
  - **Sources:** PDF files used for the answer
  - **Videos:** Recommended YouTube videos (clickable links)

### 9.4 Change Subject
- Click "Change Subject" button to go back and select a different subject

---

## Step 10: Stop the Server

When you're done:
1. Go back to the terminal window
2. Press `Ctrl + C` (Windows/Mac/Linux)
3. Type `deactivate` if you want to exit the virtual environment

---

## 🎯 Quick Reference Commands

```bash
# Activate virtual environment (Windows)
.\.venv\Scripts\activate

# Activate virtual environment (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python app.py

# Stop server
Ctrl + C
```

---

## 🔧 Troubleshooting

### Problem: "ModuleNotFoundError"
**Solution:** 
```bash
pip install -r requirements.txt
```

### Problem: "Port 5000 is already in use"
**Solution:** 
1. Close other applications using port 5000
2. Or change port in `app.py` line 76: `app.run(debug=True, port=5001)`
3. Then access at `http://localhost:5001`

### Problem: "No subjects showing"
**Solution:**
- Make sure you have folders in `subject_pdfs/` directory
- Each folder should contain at least one PDF file
- Refresh the browser page

### Problem: "Connection error" in browser
**Solution:**
- Make sure the server is running (Step 7)
- Check the terminal for error messages
- Verify you're accessing `http://localhost:5000`

### Problem: "API Error" in responses
**Solution:**
- Check `config.py` has valid RapidAPI credentials
- The app will still work but answers may be limited

### Problem: "Index not found" error
**Solution:**
- This is normal on first run
- The index will be built automatically when you ask the first question
- Wait a minute or two for the index to build

---

## 📝 First Run Notes

**On the first run:**
1. The app will download embedding models (~500MB) - this happens automatically
2. When you ask your first question about a subject, it will build the FAISS index (takes 1-2 minutes)
3. Subsequent questions will be much faster

**Be patient on first run!** The initial setup takes time but subsequent uses are fast.

---

## ✅ Success Checklist

- [ ] Virtual environment created and activated
- [ ] All dependencies installed
- [ ] PDFs organized in `subject_pdfs/` folders
- [ ] Server started successfully (no errors in terminal)
- [ ] Browser opens `http://localhost:5000` successfully
- [ ] Can see subject selection screen
- [ ] Can ask questions and get responses

---

## 🆘 Need Help?

1. Check the terminal for error messages
2. Check browser console (F12 → Console tab) for frontend errors
3. Verify all files are in the correct locations
4. Make sure Python version is 3.8 or higher: `python --version`

---

## 🎉 You're All Set!

Once you see the beautiful interface in your browser, you're ready to use your AI Tutor! Start asking questions and explore the features.

**Happy Learning! 🚀**

