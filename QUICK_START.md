# ⚡ Quick Start Guide

## Run the Application in 3 Steps

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python app.py
```

### Step 3: Open Browser
Navigate to: **http://localhost:5000**

That's it! 🎉

---

## What You'll See

1. **Subject Selection Screen** - Choose a subject or enter a custom one
2. **Chat Interface** - Ask questions and get AI-powered answers
3. **Results Display** - See answers, sources, and YouTube recommendations

## First Time Setup

Make sure you have PDFs organized in `subject_pdfs/` folder:
```
subject_pdfs/
├── DBMS/
│   └── your_file.pdf
└── ML/
    └── your_file.pdf
```

## Troubleshooting

- **Port 5000 in use?** Change port in `app.py`: `app.run(port=5001)`
- **No subjects showing?** Add PDF folders in `subject_pdfs/`
- **API errors?** Check `config.py` has valid RapidAPI key

For detailed setup, see `FRONTEND_SETUP.md`

