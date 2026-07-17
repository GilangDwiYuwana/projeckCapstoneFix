from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from datetime import datetime, date
import xgboost as xgb
import joblib
import numpy as np
import pandas as pd
import subprocess
import os
import sys
import logging
import io
import csv
import json
import shutil
import bcrypt

from database import engine
from redis_client import r

# ─────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# AI MODEL
# ─────────────────────────────────────────
model          = xgb.XGBRegressor()
le_produk      = None
le_metode      = None
model_meta     = {}
min_period     = None
avg_units_map  = {}
default_units  = 0.0

def load_ai_assets():
    global model, le_produk, le_metode, model_meta, min_period, avg_units_map, default_units
    try:
        if os.path.exists("model_omset.json"):
            model.load_model("model_omset.json")
            logger.info("Model berhasil dimuat.")
        if os.path.exists("le_produk.pkl") and os.path.exists("le_metode.pkl"):
            le_produk = joblib.load("le_produk.pkl")
            le_metode = joblib.load("le_metode.pkl")
            logger.info("Encoder berhasil dimuat.")
        if os.path.exists("model_meta.json"):
            with open("model_meta.json", "r", encoding="utf-8") as f:
                model_meta = json.load(f)
            if "min_period" in model_meta:
                min_period = datetime.fromisoformat(model_meta["min_period"])
            avg_units_map = model_meta.get("avg_units", {})
            default_units = float(model_meta.get("default_units", 0.0))
            logger.info("Model metadata berhasil dimuat.")
    except Exception as e:
        logger.error(f"Gagal memuat aset AI: {e}")


def init_extra_tables():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS promosi (
                id_promosi INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                detail TEXT NOT NULL,
                author VARCHAR(255) DEFAULT 'Owner',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS laporan_staff (
                id_laporan INT AUTO_INCREMENT PRIMARY KEY,
                petugas VARCHAR(255) NOT NULL,
                units INT NOT NULL,
                omset DECIMAL(15,2) NOT NULL,
                filename VARCHAR(255),
                tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    logger.info("Tabel promosi & laporan_staff siap.")


def ensure_users_phone_column():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT ''"))
        logger.info("Kolom phone berhasil ditambahkan ke tabel users.")
    except Exception as e:
        logger.info(f"Kolom phone sudah ada atau tidak bisa ditambahkan: {e}")

@app.on_event("startup")
async def startup_event():
    load_ai_assets()
    init_extra_tables()
    ensure_users_phone_column()
    logger.info("Startup event complete.")

# ═══════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═══════════════════════════════════════════════════════
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class ProdukCreate(BaseModel):
    nama_motor: str
    kategori: str          # Metic | Kopling | Gigi
    harga_terbaru: float
    stok_awal: Optional[int] = 0

class ProdukUpdate(BaseModel):
    nama_motor: str
    kategori: str
    harga_terbaru: float

class StokUpdate(BaseModel):
    action: str             # "masuk" | "keluar"
    jumlah: int
    alamat: Optional[str] = "-"
    keterangan: Optional[str] = ""
    id_user: int

class StaffCreate(BaseModel):
    nama_lengkap: str
    email: str
    password: str
    phone: Optional[str] = ""

class StaffUpdate(BaseModel):
    nama_lengkap: str
    email: str
    password: Optional[str] = None
    phone: Optional[str] = ""

class TargetUpdate(BaseModel):
    bulan_tahun: str        # format YYYY-MM-DD (tanggal 1 di bulan tsb)
    target_unit: int
    estimasi_omset: float

class PromosiCreate(BaseModel):
    title: str
    detail: str
    author: Optional[str] = "Owner"

class LaporanCreate(BaseModel):
    petugas: str
    units: int
    omset: float
    filename: Optional[str] = ""

# ═══════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def row_to_dict(row):
    return dict(row._mapping)

# ─────────────────────────────────────────
# REDIS CACHE HELPERS
# ─────────────────────────────────────────
def cache_get(key: str):
    """Ambil data dari Redis. Return None kalau tidak ada / gagal."""
    try:
        cached = r.get(key)
        return json.loads(cached) if cached else None
    except Exception as e:
        logger.warning(f"Redis GET gagal ({key}): {e}")
        return None

def cache_set(key: str, value, ttl: int = 300):
    """Simpan data ke Redis dengan masa berlaku (detik). Default 5 menit."""
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"Redis SET gagal ({key}): {e}")

def cache_delete(*keys: str):
    """Hapus cache — dipanggil setelah data berubah (create/update/delete)."""
    try:
        if keys:
            r.delete(*keys)
    except Exception as e:
        logger.warning(f"Redis DELETE gagal ({keys}): {e}")

# ═══════════════════════════════════════════════════════
#  STARTUP: pastikan tabel tambahan (promosi & laporan) ada
# ═══════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════════════════
def normalize_role_for_frontend(db_role: str) -> str:
    """
    Frontend hanya mengenal 'owner' dan 'staff'.
    Database punya 3 role: Owner, Admin, Staff.
    Admin diperlakukan sama seperti Owner (akses penuh).
    """
    db_role_lower = db_role.lower()
    if db_role_lower in ("owner", "admin"):
        return "owner"
    return "staff"

@app.post("/login")
def login(req: LoginRequest):
    # req.role dari frontend selalu 'owner' atau 'staff' (huruf kecil).
    # Di database, role tersimpan sebagai 'Owner' / 'Admin' / 'Staff' (kapital di awal).
    # Untuk role 'owner' dari frontend -> cocokkan ke 'Owner' ATAU 'Admin' di database.
    if req.role == "owner":
        allowed_db_roles = ["Owner", "Admin"]
    else:
        allowed_db_roles = ["Staff"]

    roles_clause = ",".join([f"'{r}'" for r in allowed_db_roles])
    with engine.connect() as conn:
        result = conn.execute(
            text(f"""
                SELECT * FROM users
                WHERE email = :email
                  AND role IN ({roles_clause})
                  AND status = 'Aktif'
            """),
            {"email": req.email}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Email atau password salah.")

    user = row_to_dict(result)

    # Dukung password yang belum di-hash (migrasi awal) maupun yang sudah bcrypt
    stored = user["password_hash"]
    if stored.startswith("$2b$") or stored.startswith("$2a$"):
        valid = verify_password(req.password, stored)
    else:
        raise HTTPException(status_code=401, detail="Email atau password salah.")

    if not valid:
        raise HTTPException(status_code=401, detail="Email atau password salah.")

    return {
        "status": "success",
        "user": {
            "id": user["id_user"],
            "name": user["nama_lengkap"],
            "email": user["email"],
            "role": normalize_role_for_frontend(user["role"]),   # selalu 'owner' atau 'staff'
            "db_role": user["role"],                              # role asli dari database (Owner/Admin/Staff)
        }
    }

# ═══════════════════════════════════════════════════════
#  MASTER DATA PRODUK
# ═══════════════════════════════════════════════════════
@app.get("/produk")
def get_produk():
    cached = cache_get("produk:all")
    if cached is not None:
        return cached

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT p.id_produk AS id, p.nama_motor AS name, p.kategori AS category,
                   p.harga_terbaru AS price, COALESCE(s.sisa_stok, 0) AS stock
            FROM produk p
            LEFT JOIN stok_barang s ON s.id_produk = p.id_produk
            ORDER BY p.id_produk
        """)).fetchall()
    hasil = [row_to_dict(row) for row in rows]
    cache_set("produk:all", hasil, ttl=300)
    return hasil

@app.post("/produk")
def add_produk(payload: ProdukCreate):
    with engine.begin() as conn:
        result = conn.execute(
            text("INSERT INTO produk (nama_motor, kategori, harga_terbaru) VALUES (:nama, :kategori, :harga)"),
            {"nama": payload.nama_motor, "kategori": payload.kategori, "harga": payload.harga_terbaru}
        )
        new_id = result.lastrowid
        conn.execute(
            text("INSERT INTO stok_barang (id_produk, sisa_stok) VALUES (:id_produk, :stok)"),
            {"id_produk": new_id, "stok": payload.stok_awal}
        )
    cache_delete("produk:all")
    return {
        "id": new_id, "name": payload.nama_motor, "category": payload.kategori,
        "price": payload.harga_terbaru, "stock": payload.stok_awal
    }

@app.put("/produk/{produk_id}")
def update_produk(produk_id: int, payload: ProdukUpdate):
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE produk SET nama_motor=:nama, kategori=:kategori, harga_terbaru=:harga WHERE id_produk=:id"),
            {"nama": payload.nama_motor, "kategori": payload.kategori, "harga": payload.harga_terbaru, "id": produk_id}
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Produk tidak ditemukan.")
        stok_row = conn.execute(
            text("SELECT sisa_stok FROM stok_barang WHERE id_produk=:id"), {"id": produk_id}
        ).fetchone()
    stok = stok_row[0] if stok_row else 0
    cache_delete("produk:all")
    return {"id": produk_id, "name": payload.nama_motor, "category": payload.kategori,
            "price": payload.harga_terbaru, "stock": stok}

@app.delete("/produk/{produk_id}")
def delete_produk(produk_id: int):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM stok_barang WHERE id_produk=:id"), {"id": produk_id})
        conn.execute(text("DELETE FROM produk WHERE id_produk=:id"), {"id": produk_id})
    cache_delete("produk:all")
    return {"status": "success"}

# ═══════════════════════════════════════════════════════
#  STOK BARANG
# ═══════════════════════════════════════════════════════
@app.get("/stok")
def get_stok():
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT s.id_produk AS id, p.nama_motor AS nama, s.sisa_stok AS stok
            FROM stok_barang s
            JOIN produk p ON p.id_produk = s.id_produk
            ORDER BY p.nama_motor
        """)).fetchall()
    return [row_to_dict(r) for r in rows]

@app.post("/stok/{produk_id}/update")
def update_stok(produk_id: int, payload: StokUpdate):
    with engine.begin() as conn:
        current = conn.execute(
            text("SELECT sisa_stok FROM stok_barang WHERE id_produk=:id"), {"id": produk_id}
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Item stok tidak ditemukan.")

        sisa_stok = current[0]
        if payload.action == "masuk":
            sisa_stok += payload.jumlah
        elif payload.action == "keluar":
            if payload.jumlah > sisa_stok:
                raise HTTPException(status_code=400, detail="Stok tidak mencukupi.")
            sisa_stok -= payload.jumlah
        else:
            raise HTTPException(status_code=400, detail="Action tidak valid (masuk/keluar).")

        conn.execute(
            text("UPDATE stok_barang SET sisa_stok=:stok, update_terakhir=NOW() WHERE id_produk=:id"),
            {"stok": sisa_stok, "id": produk_id}
        )

        keterangan = payload.keterangan or ("Barang Masuk" if payload.action == "masuk" else "Barang Keluar")
        if payload.action == "keluar" and payload.alamat and payload.alamat != "-":
            keterangan = f"{keterangan} | Alamat: {payload.alamat}"

        conn.execute(
            text("""INSERT INTO riwayat_stok (id_produk, id_user, jenis_pergerakan, jumlah, keterangan)
                     VALUES (:id_produk, :id_user, :jenis, :jumlah, :keterangan)"""),
            {"id_produk": produk_id, "id_user": payload.id_user, "jenis": payload.action,
             "jumlah": payload.jumlah, "keterangan": keterangan}
        )

        nama_row = conn.execute(text("SELECT nama_motor FROM produk WHERE id_produk=:id"), {"id": produk_id}).fetchone()
        nama = nama_row[0] if nama_row else ""

    # stok berubah -> data /produk (yang menampilkan kolom stock) jadi basi, hapus cache-nya
    cache_delete("produk:all")

    return {
        "stok": {"id": produk_id, "nama": nama, "stok": sisa_stok},
        "riwayat": {
            "id": produk_id, "tanggal": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "nama": nama, "jenis": payload.action, "jumlah": payload.jumlah,
            "alamat": payload.alamat if payload.action == "keluar" else "-",
            "keterangan": keterangan, "petugas": f"User #{payload.id_user}",
        }
    }

@app.get("/stok/riwayat")
def get_riwayat():
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT r.id_riwayat AS id, r.tanggal_pencatatan AS tanggal, p.nama_motor AS nama,
                   r.jenis_pergerakan AS jenis, r.jumlah AS jumlah, r.keterangan AS keterangan,
                   u.nama_lengkap AS petugas
            FROM riwayat_stok r
            JOIN produk p ON p.id_produk = r.id_produk
            LEFT JOIN users u ON u.id_user = r.id_user
            ORDER BY r.tanggal_pencatatan DESC
            LIMIT 200
        """)).fetchall()

    result = []
    for r in rows:
        d = row_to_dict(r)
        d["tanggal"] = d["tanggal"].strftime("%Y-%m-%d %H:%M") if isinstance(d["tanggal"], datetime) else str(d["tanggal"])
        # Pisahkan alamat dari keterangan jika ada
        alamat = "-"
        if d["keterangan"] and "| Alamat:" in d["keterangan"]:
            parts = d["keterangan"].split("| Alamat:")
            d["keterangan"] = parts[0].strip()
            alamat = parts[1].strip()
        d["alamat"] = alamat
        result.append(d)
    return result

# ═══════════════════════════════════════════════════════
#  DATASET & AI
# ═══════════════════════════════════════════════════════
@app.get("/check-dataset")
def check_dataset():
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM data_penjualan")).fetchone()[0]
    return {"exists": count > 0, "rows": count}

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        filename = (file.filename or "").lower()
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Tipe file tidak didukung. Unggah .csv, .xlsx, atau .xls.")

        required_cols = {"Tanggal", "Produk", "Jenis_Motor", "Jumlah_Terjual", "Harga_Satuan", "Total_Penjualan", "Metode_Bayar"}
        if not required_cols.issubset(set(df.columns)):
            raise HTTPException(status_code=400, detail=f"Kolom dataset tidak sesuai. Wajib ada: {', '.join(required_cols)}")

        df["Tanggal"] = pd.to_datetime(df["Tanggal"])

        with engine.begin() as conn:
            # Replace seluruh data lama dengan dataset baru
            conn.execute(text("DELETE FROM data_penjualan"))
            for _, row in df.iterrows():
                conn.execute(
                    text("""INSERT INTO data_penjualan
                             (Tanggal, Produk, Jenis_Motor, Jumlah_Terjual, Harga_Satuan, Total_Penjualan, Metode_Bayar)
                             VALUES (:tanggal, :produk, :jenis, :jumlah, :harga_satuan, :total, :metode)"""),
                    {
                        "tanggal": row["Tanggal"].to_pydatetime(),
                        "produk": str(row["Produk"]),
                        "jenis": str(row["Jenis_Motor"]),
                        "jumlah": int(row["Jumlah_Terjual"]),
                        "harga_satuan": int(row["Harga_Satuan"]),
                        "total": int(row["Total_Penjualan"]),
                        "metode": str(row["Metode_Bayar"]),
                    }
                )

        return {"status": "success", "message": f"Dataset berhasil diunggah! {len(df)} baris dimasukkan ke database."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_python_command():
    python_cmd = shutil.which("python") or shutil.which("python3")
    if python_cmd:
        return python_cmd
    return sys.executable

@app.post("/retrain")
def run_retrain():
    try:
        python_cmd = get_python_command()
        timeout_seconds = 300
        result = subprocess.run(
            [python_cmd, "train_model.py"],
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        if result.returncode == 0:
            load_ai_assets()
            payload = {"status": "success", "message": "Model berhasil dilatih ulang!"}
            if os.path.exists("model_meta.json"):
                try:
                    with open("model_meta.json", "r", encoding="utf-8") as f:
                        payload["metrics"] = json.load(f).get("training_metrics", {})
                except Exception:
                    payload["metrics"] = {}
            payload["stdout"] = result.stdout.strip()
            return payload
        return {"status": "error", "message": result.stderr.strip(), "stdout": result.stdout.strip()}
    except subprocess.TimeoutExpired as e:
        return {"status": "error", "message": f"Proses retrain melebihi batas waktu {timeout_seconds} detik.", "stdout": e.stdout or "", "stderr": e.stderr or ""}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/prediksi-tren")
def get_prediksi_tren(produk: str, metode: str, jumlah_bulan: int):
    global min_period, avg_units_map, default_units
    if le_produk is None or le_metode is None or min_period is None:
        raise HTTPException(status_code=400, detail="Model belum dilatih atau metadata model tidak tersedia. Lakukan Training terlebih dahulu.")
    try:
        p_enc = le_produk.transform([produk])[0]
        m_enc = le_metode.transform([metode])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Produk '{produk}' atau metode '{metode}' tidak dikenal.")

    try:
        base_units = float(avg_units_map.get(produk, {}).get(metode, default_units))
    except Exception:
        base_units = default_units

    now = datetime.now()
    hasil = []
    for i in range(1, jumlah_bulan + 1):
        target_dt = pd.Timestamp(now) + pd.DateOffset(months=i)
        month_index = ((target_dt.year - min_period.year) * 12 + (target_dt.month - min_period.month))
        sin_month = np.sin(2 * np.pi * target_dt.month / 12)
        cos_month = np.cos(2 * np.pi * target_dt.month / 12)
        feat = np.array([[p_enc, m_enc, month_index, sin_month, cos_month, base_units]], dtype=float)
        pred = float(model.predict(feat)[0])
        if pred < 50000000:
            rec = "Omset rendah, saran: promo diskon."
        elif pred > 100000000:
            rec = "Omset tinggi, fokus pelayanan VIP."
        else:
            rec = "Stok aman, pertahankan penjualan."
        hasil.append({
            "bulan": f"{target_dt.month}-{target_dt.year}",
            "omset": round(pred, 2),
            "rekomendasi": rec,
            "units_proxy": round(base_units, 2)
        })
    return {"data_tren": hasil}

# ═══════════════════════════════════════════════════════
#  STAFF (users dengan role = staff)
# ═══════════════════════════════════════════════════════
@app.get("/staff")
def get_staff():
    cached = cache_get("staff:all")
    if cached is not None:
        return cached

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT id_user AS id, nama_lengkap AS name, email, phone, role
            FROM users WHERE role = 'Staff'
            ORDER BY id_user DESC
        """)).fetchall()
    hasil = [row_to_dict(row) for row in rows]
    cache_set("staff:all", hasil, ttl=300)
    return hasil

@app.post("/staff")
def create_staff(payload: StaffCreate):
    with engine.connect() as conn:
        existing = conn.execute(text("SELECT id_user FROM users WHERE email=:email"), {"email": payload.email}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar.")

    hashed = hash_password(payload.password)
    phone_value = payload.phone or ""
    with engine.begin() as conn:
        result = conn.execute(
            text("""INSERT INTO users (nama_lengkap, email, password_hash, phone, role, status)
                     VALUES (:nama, :email, :pw, :phone, 'Staff', 'Aktif')"""),
            {"nama": payload.nama_lengkap, "email": payload.email, "pw": hashed, "phone": phone_value}
        )
        new_id = result.lastrowid
    cache_delete("staff:all")
    return {"id": new_id, "name": payload.nama_lengkap, "email": payload.email, "phone": phone_value, "role": "staff"}

@app.put("/staff/{staff_id}")
def update_staff(staff_id: int, payload: StaffUpdate):
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id_user FROM users WHERE id_user=:id AND role='Staff'"),
            {"id": staff_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Staff tidak ditemukan.")

        email_taken = conn.execute(
            text("SELECT id_user FROM users WHERE email=:email AND id_user != :id"),
            {"email": payload.email, "id": staff_id}
        ).fetchone()
        if email_taken:
            raise HTTPException(status_code=400, detail="Email sudah digunakan akun lain.")

        phone_value = payload.phone or ""
        if payload.password:
            hashed = hash_password(payload.password)
            conn.execute(
                text("""UPDATE users SET nama_lengkap=:nama, email=:email,
                         password_hash=:pw, phone=:phone WHERE id_user=:id"""),
                {"nama": payload.nama_lengkap, "email": payload.email, "pw": hashed, "phone": phone_value, "id": staff_id}
            )
        else:
            conn.execute(
                text("""UPDATE users SET nama_lengkap=:nama, email=:email,
                         phone=:phone WHERE id_user=:id"""),
                {"nama": payload.nama_lengkap, "email": payload.email, "phone": phone_value, "id": staff_id}
            )

    cache_delete("staff:all")
    return {"id": staff_id, "name": payload.nama_lengkap, "email": payload.email, "phone": phone_value, "role": "staff"}

@app.delete("/staff/{staff_id}")
def delete_staff(staff_id: int):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM users WHERE id_user=:id AND role='Staff'"), {"id": staff_id})
    cache_delete("staff:all")
    return {"status": "success"}

# ═══════════════════════════════════════════════════════
#  TARGET BULANAN
# ═══════════════════════════════════════════════════════
@app.get("/target")
def get_target():
    cached = cache_get("target:latest")
    if cached is not None:
        return cached

    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT * FROM target_bulanan ORDER BY bulan_tahun DESC LIMIT 1"
        )).fetchone()
    if not row:
        hasil = {"period": "Belum diatur", "omset": 0, "sales": 0}
        cache_set("target:latest", hasil, ttl=300)
        return hasil
    d = row_to_dict(row)
    bulan_tahun = d["bulan_tahun"]
    period = bulan_tahun.strftime("%B %Y") if isinstance(bulan_tahun, date) else str(bulan_tahun)
    hasil = {"period": period, "omset": float(d["estimasi_omset"]), "sales": d["target_unit"], "id": d["id_target"]}
    cache_set("target:latest", hasil, ttl=300)
    return hasil

@app.post("/target")
def set_target(payload: TargetUpdate):
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id_target FROM target_bulanan WHERE bulan_tahun=:bulan"),
            {"bulan": payload.bulan_tahun}
        ).fetchone()
        if existing:
            conn.execute(
                text("UPDATE target_bulanan SET target_unit=:unit, estimasi_omset=:omset WHERE id_target=:id"),
                {"unit": payload.target_unit, "omset": payload.estimasi_omset, "id": existing[0]}
            )
        else:
            conn.execute(
                text("""INSERT INTO target_bulanan (bulan_tahun, target_unit, estimasi_omset)
                         VALUES (:bulan, :unit, :omset)"""),
                {"bulan": payload.bulan_tahun, "unit": payload.target_unit, "omset": payload.estimasi_omset}
            )
    cache_delete("target:latest")
    return get_target()

# ═══════════════════════════════════════════════════════
#  PROMOSI
# ═══════════════════════════════════════════════════════
@app.get("/promosi")
def get_promosi():
    cached = cache_get("promosi:all")
    if cached is not None:
        return cached

    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id_promosi AS id, title, detail, author FROM promosi ORDER BY created_at DESC"
        )).fetchall()
    hasil = [row_to_dict(row) for row in rows]
    cache_set("promosi:all", hasil, ttl=300)
    return hasil

@app.post("/promosi")
def add_promosi(payload: PromosiCreate):
    with engine.begin() as conn:
        result = conn.execute(
            text("INSERT INTO promosi (title, detail, author) VALUES (:title, :detail, :author)"),
            {"title": payload.title, "detail": payload.detail, "author": payload.author}
        )
        new_id = result.lastrowid
    cache_delete("promosi:all")
    return {"id": new_id, "title": payload.title, "detail": payload.detail, "author": payload.author}

@app.delete("/promosi/{promosi_id}")
def delete_promosi(promosi_id: int):
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM promosi WHERE id_promosi=:id"), {"id": promosi_id})
    cache_delete("promosi:all")
    return {"status": "success"}

# ═══════════════════════════════════════════════════════
#  LAPORAN STAFF
# ═══════════════════════════════════════════════════════
@app.get("/laporan")
def get_laporan(petugas: Optional[str] = None):
    query = "SELECT id_laporan AS id, petugas, units, omset, filename, tanggal FROM laporan_staff"
    params = {}
    if petugas:
        query += " WHERE petugas = :petugas"
        params["petugas"] = petugas
    query += " ORDER BY tanggal DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).fetchall()
    result = []
    for r in rows:
        d = row_to_dict(r)
        d["tanggal"] = d["tanggal"].strftime("%Y-%m-%d") if isinstance(d["tanggal"], datetime) else str(d["tanggal"])
        d["omset"] = float(d["omset"])
        result.append(d)
    return result

@app.post("/laporan")
def add_laporan(payload: LaporanCreate):
    with engine.begin() as conn:
        result = conn.execute(
            text("""INSERT INTO laporan_staff (petugas, units, omset, filename)
                     VALUES (:petugas, :units, :omset, :filename)"""),
            {"petugas": payload.petugas, "units": payload.units, "omset": payload.omset, "filename": payload.filename}
        )
        new_id = result.lastrowid
    return {
        "id": new_id, "petugas": payload.petugas, "units": payload.units,
        "omset": payload.omset, "filename": payload.filename,
        "tanggal": datetime.now().strftime("%Y-%m-%d")
    }

@app.get("/laporan/csv")
def download_laporan_csv():
    # Unduh laporan penjualan umum: semua staff dan semua entri.
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT tanggal, petugas, units, omset, filename FROM laporan_staff ORDER BY tanggal DESC"
        )).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Tanggal", "Petugas", "Unit", "Omset", "File"])
    for r in rows:
        d = row_to_dict(r)
        writer.writerow([d["tanggal"], d["petugas"], d["units"], d["omset"], d["filename"]])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=laporan-penjualan.csv"}
    )

@app.get("/laporan/staff/csv")
def download_laporan_staff_csv(petugas: Optional[str] = None, id_laporan: Optional[int] = None):
    # Unduh laporan khusus staff: gunakan petugas atau id_laporan.
    if not petugas and id_laporan is None:
        raise HTTPException(status_code=400, detail="Petugas atau id_laporan harus diberikan untuk unduh laporan staff.")

    query = "SELECT tanggal, petugas, units, omset, filename FROM laporan_staff"
    conditions = []
    params = {}
    if petugas:
        conditions.append("petugas = :petugas")
        params["petugas"] = petugas
    if id_laporan is not None:
        conditions.append("id_laporan = :id_laporan")
        params["id_laporan"] = id_laporan
    query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY tanggal DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Tanggal", "Petugas", "Unit", "Omset", "File"])
    for r in rows:
        d = row_to_dict(r)
        writer.writerow([d["tanggal"], d["petugas"], d["units"], d["omset"], d["filename"]])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=laporan-staff.csv"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)