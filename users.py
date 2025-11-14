import os
import sqlite3
import secrets
import datetime
from werkzeug.security import generate_password_hash, check_password_hash


DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
DB_PATH = os.path.join(DB_DIR, 'users.db')


def _get_conn(path=DB_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(path=DB_PATH):
    conn = _get_conn(path)
    cur = conn.cursor()
    # users table with optional display_name
    cur.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            password_hash TEXT NOT NULL,
            token TEXT,
            created_at TEXT NOT NULL
        )
        '''
    )

    # ensure display_name column exists for older DBs
    try:
        cur.execute("PRAGMA table_info(users)")
        cols = [r[1] for r in cur.fetchall()]
        if 'display_name' not in cols:
            cur.execute('ALTER TABLE users ADD COLUMN display_name TEXT')
    except Exception:
        pass

    # chats table for per-user history
    cur.execute(
        '''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT,
            question TEXT,
            answer TEXT,
            sources TEXT,
            videos TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        '''
    )
    conn.commit()
    conn.close()


def create_user(username: str, password: str):
    username = username.strip()
    if not username or not password:
        return False, 'username and password required'
    conn = _get_conn()
    cur = conn.cursor()
    try:
        pw_hash = generate_password_hash(password)
        # generate a friendly display name
        display_name = username
        cur.execute('INSERT INTO users (username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)',
                    (username, display_name, pw_hash, datetime.datetime.utcnow().isoformat()))
        conn.commit()
        # fetch created user id
        cur.execute('SELECT id, display_name FROM users WHERE username = ?', (username,))
        row = cur.fetchone()
        return True, {'id': row['id'], 'username': username, 'display_name': row['display_name']}
    except sqlite3.IntegrityError:
        return False, 'username already exists'
    finally:
        conn.close()


def authenticate_user(username: str, password: str):
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return False, 'invalid credentials'

    if not check_password_hash(row['password_hash'], password):
        conn.close()
        return False, 'invalid credentials'

    # generate token
    token = secrets.token_urlsafe(32)
    cur.execute('UPDATE users SET token = ? WHERE id = ?', (token, row['id']))
    conn.commit()
    conn.close()
    return True, token


def verify_token(token: str):
    if not token:
        return None
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, username, display_name, created_at FROM users WHERE token = ?', (token,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def invalidate_token(token: str):
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute('UPDATE users SET token = NULL WHERE token = ?', (token,))
    conn.commit()
    conn.close()


def add_chat_entry(user_id: int, subject: str, question: str, answer: str, sources: list, videos: list):
    conn = _get_conn()
    cur = conn.cursor()
    import json
    cur.execute('INSERT INTO chats (user_id, subject, question, answer, sources, videos, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (user_id, subject, question, answer, json.dumps(sources or []), json.dumps(videos or []), datetime.datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_chat_history(user_id: int, limit: int = 100):
    conn = _get_conn()
    cur = conn.cursor()
    import json
    cur.execute('SELECT id, subject, question, answer, sources, videos, created_at FROM chats WHERE user_id = ? ORDER BY id DESC LIMIT ?', (user_id, limit))
    rows = cur.fetchall()
    conn.close()
    out = []
    for r in rows:
        out.append({
            'id': r['id'],
            'subject': r['subject'],
            'question': r['question'],
            'answer': r['answer'],
            'sources': json.loads(r['sources']) if r['sources'] else [],
            'videos': json.loads(r['videos']) if r['videos'] else [],
            'created_at': r['created_at']
        })
    return out
