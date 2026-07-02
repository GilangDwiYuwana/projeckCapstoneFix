"""
Jalankan script ini di komputer kamu (folder backend) untuk generate
SQL insert akun owner dengan password ter-hash yang valid.

Cara pakai:
    python generate_owner_hash.py

Lalu copy hasil SQL yang muncul, dan jalankan di MariaDB/phpMyAdmin.
"""
import bcrypt

# ── Ubah sesuai keinginan ──────────────────────────────
NAMA     = "Owner Honda"
EMAIL    = "owner@honda.com"
PASSWORD = "owner123"
# ────────────────────────────────────────────────────────

hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

print("\n=== COPY SQL DI BAWAH INI KE MARIADB ===\n")
print(f"""USE xgboost_honda;

INSERT INTO users (nama_lengkap, email, password_hash, role, status)
VALUES (
    '{NAMA}',
    '{EMAIL}',
    '{hashed}',
    'owner',
    'aktif'
);

SELECT id_user, nama_lengkap, email, role, status FROM users WHERE role = 'owner';
""")
print("=== SELESAI ===\n")
print(f"Setelah insert, login dengan:")
print(f"  Email    : {EMAIL}")
print(f"  Password : {PASSWORD}")