"""
Script sekali-pakai untuk mengganti password_hash user jadi bcrypt yang valid.
Jalankan: python reset_password.py
Lalu masukkan email dan password baru yang diinginkan.
"""
import bcrypt
from sqlalchemy import text
from database import engine

def reset_password(email: str, new_password: str):
    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE users SET password_hash = :hash WHERE email = :email"),
            {"hash": hashed, "email": email}
        )
        if result.rowcount == 0:
            print(f"❌ Email '{email}' tidak ditemukan.")
        else:
            print(f"✅ Password untuk '{email}' berhasil diupdate ke bcrypt hash.")

if __name__ == "__main__":
    email = input("Email user: ").strip()
    new_password = input("Password baru: ").strip()
    reset_password(email, new_password)