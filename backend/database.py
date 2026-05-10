import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "chat.db")


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_msg TEXT NOT NULL,
            bot_msg TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()


def create_user(email: str, hashed_password: str) -> dict:
    conn = _conn()
    try:
        conn.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (email, hashed_password),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def get_user_by_email(email: str) -> dict | None:
    conn = _conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def save_history(user_id: int, user_msg: str, bot_msg: str):
    conn = _conn()
    try:
        conn.execute(
            "INSERT INTO chat_history (user_id, user_msg, bot_msg) VALUES (?, ?, ?)",
            (user_id, user_msg, bot_msg),
        )
        conn.commit()
    finally:
        conn.close()


def get_history(user_id: int) -> list[dict]:
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT user_msg, bot_msg FROM chat_history WHERE user_id = ? ORDER BY created_at ASC",
            (user_id,),
        ).fetchall()
        return [{"user": r["user_msg"], "bot": r["bot_msg"]} for r in rows]
    finally:
        conn.close()
