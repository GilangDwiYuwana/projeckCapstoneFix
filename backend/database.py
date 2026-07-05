import os
from sqlalchemy import create_engine

# Kunci masuk ke MySQL
# Kalau dijalankan di Railway, akan otomatis pakai environment variable dari service MySQL.
# Kalau dijalankan di komputer sendiri (XAMPP), otomatis fallback ke pengaturan lokal.
USERNAME = os.environ.get('MYSQLUSER', 'root')
PASSWORD = os.environ.get('MYSQLPASSWORD', '')
HOST = os.environ.get('MYSQLHOST', 'localhost')
PORT = os.environ.get('MYSQLPORT', '3306')
DATABASE = os.environ.get('MYSQLDATABASE', 'xgboost_honda')

# Membuat jembatan koneksi
url_koneksi = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"
engine = create_engine(url_koneksi)

if __name__ == "__main__":
    try:
        with engine.connect() as koneksi:
            print("✅ YEY! Program Python berhasil nyambung ke database MySQL!")
    except Exception as e:
        print(f"❌ Gagal nyambung, error: {e}")