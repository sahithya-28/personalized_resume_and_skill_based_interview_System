from __future__ import annotations

import hashlib
import hmac
import sqlite3
from pathlib import Path
from secrets import token_hex

DB_PATH = Path(__file__).resolve().parent / "app.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def _hash_password(password: str) -> str:
    salt_hex = token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        200000,
    ).hex()
    return f"{salt_hex}${derived}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, hashed = stored.split("$", 1)
    except ValueError:
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        200000,
    ).hex()
    return hmac.compare_digest(derived, hashed)


def create_user(full_name: str, email: str, password: str) -> tuple[bool, str]:
    normalized_email = email.strip().lower()
    password_hash = _hash_password(password)

    try:
        with _connect() as conn:
            conn.execute(
                "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
                (full_name.strip(), normalized_email, password_hash),
            )
            conn.commit()
    except sqlite3.IntegrityError:
        return False, "Email already registered"

    return True, "Account created successfully"


def authenticate_user(email: str, password: str) -> tuple[bool, dict | str]:
    normalized_email = email.strip().lower()

    with _connect() as conn:
        row = conn.execute(
            "SELECT full_name, email, password_hash FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()

    if not row:
        return False, "Invalid email or password"

    if not _verify_password(password, row["password_hash"]):
        return False, "Invalid email or password"

    return True, {"full_name": row["full_name"], "email": row["email"]}
