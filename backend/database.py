from sqlalchemy import create_engine

# Kunci masuk ke MySQL (Bawaan XAMPP)
USERNAME = 'root'
PASSWORD = ''  
HOST = 'localhost'
DATABASE = 'xgboost_honda'

# Membuat jembatan koneksi
url_koneksi = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}/{DATABASE}"
engine = create_engine(url_koneksi)

if __name__ == "__main__":
    try:
        with engine.connect() as koneksi:
            print("✅ YEY! Program Python berhasil nyambung ke database MySQL!")
    except Exception as e:
        print(f"❌ Gagal nyambung, error: {e}")