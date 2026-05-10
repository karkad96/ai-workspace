import os
import sqlite3

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
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL DEFAULT 'New chat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            conversation_id INTEGER,
            user_msg TEXT NOT NULL,
            bot_msg TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );
    """)
    # Migration: add conversation_id to existing rows
    try:
        conn.execute("ALTER TABLE chat_history ADD COLUMN conversation_id INTEGER REFERENCES conversations(id)")
        conn.commit()
    except Exception:
        pass
    conn.close()


def create_user(email: str, hashed_password: str) -> dict:
    conn = _conn()
    try:
        conn.execute("INSERT INTO users (email, hashed_password) VALUES (?, ?)", (email, hashed_password))
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


def create_conversation(user_id: int, title: str) -> dict:
    conn = _conn()
    try:
        cur = conn.execute(
            "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
            (user_id, title[:80]),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM conversations WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def get_conversation(conversation_id: int, user_id: int) -> dict | None:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT * FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_conversations(user_id: int) -> list[dict]:
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def delete_conversation(conversation_id: int, user_id: int):
    conn = _conn()
    try:
        conn.execute(
            "DELETE FROM chat_history WHERE conversation_id = ? AND user_id = ?",
            (conversation_id, user_id),
        )
        conn.execute(
            "DELETE FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id),
        )
        conn.commit()
    finally:
        conn.close()


def get_conversation_messages(conversation_id: int, user_id: int) -> list[dict]:
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT user_msg, bot_msg FROM chat_history WHERE conversation_id = ? AND user_id = ? ORDER BY created_at ASC",
            (conversation_id, user_id),
        ).fetchall()
        return [{"user": r["user_msg"], "bot": r["bot_msg"]} for r in rows]
    finally:
        conn.close()


def save_message(conversation_id: int, user_id: int, user_msg: str, bot_msg: str):
    conn = _conn()
    try:
        conn.execute(
            "INSERT INTO chat_history (user_id, conversation_id, user_msg, bot_msg) VALUES (?, ?, ?, ?)",
            (user_id, conversation_id, user_msg, bot_msg),
        )
        conn.execute(
            "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (conversation_id,),
        )
        conn.commit()
    finally:
        conn.close()
