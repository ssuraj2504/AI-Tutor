# local_rag.py
import os
import requests
from config import RAPID_API_KEY, RAPID_API_URL, RAPID_API_HOST
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

INDEX_DIR = "indexes"
PDF_DIR = "subject_pdfs"

def build_or_load_index(subject):
    os.makedirs(INDEX_DIR, exist_ok=True)
    index_path = os.path.join(INDEX_DIR, f"{subject}.faiss")
    pdf_path = os.path.join(PDF_DIR, subject)
    if not os.path.exists(pdf_path):
        print(f"❌ No notes found for {subject}. Add PDFs to {pdf_path}")
        return None

    if os.path.exists(index_path):
        print(f"✅ Loaded existing index for {subject}")
        return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
    else:
        print(f"📘 Building new index for {subject}...")
        docs = []
        for file in os.listdir(pdf_path):
            if file.endswith(".pdf"):
                loader = PyPDFLoader(os.path.join(pdf_path, file))
                docs.extend(loader.load())

        splitter = CharacterTextSplitter(chunk_size=800, chunk_overlap=150)
        chunks = splitter.split_documents(docs)
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(index_path)
        print(f"✅ Index built for {subject} with {len(chunks)} chunks")
        return vectorstore


def call_rapidapi_llm(prompt):
    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "web_access": False
    }
    headers = {
        "x-rapidapi-key": RAPID_API_KEY,
        "x-rapidapi-host": RAPID_API_HOST,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(RAPID_API_URL, json=payload, headers=headers)
        print("🔹 API Status:", response.status_code)
        print("🔹 API Response:", response.text)
        data = response.json()
        if "result" in data:
            return data["result"].strip()
        else:
            return str(data)
    except Exception as e:
        print("⚠️ API Error:", e)
        return f"⚠️ API Error: {e}"



def generate_answer(query, subject):
    index = build_or_load_index(subject)
    if index is None:
        return "No index found for this subject.", []

    results = index.similarity_search(query, k=3)
    context = "\n".join([r.page_content.strip() for r in results])[:1500]

    prompt = (
        f"You are an AI tutor for engineering students.\n"
        f"Use the following context from the notes to answer the question.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        f"Answer clearly and concisely for students."
    )

    answer = call_rapidapi_llm(prompt)
    sources = list({r.metadata['source'] for r in results})
    return answer, sources
