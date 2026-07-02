import pandas as pd
import mysql.connector

def jalankan_import_relasional():
    nama_file = 'dataset-FIX.csv'
    
    # 1. Koneksi ke Database XAMPP
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",      
            database="xgboost_honda" # Sesuai dengan nama database kamu
        )
        cursor = db.cursor()
        print("1. Berhasil terhubung ke database xgboost_honda!")
    except Exception as e:
        print("❌ Error koneksi:", e)
        return

    # 2. Membaca file CSV
    print(f"2. Sedang membaca file {nama_file}...")
    try:
        df = pd.read_csv(nama_file)
    except Exception as e:
        print(f"❌ Gagal membaca file {nama_file}. Pastikan file ada di folder yang sama. Error: {e}")
        return

    # 3. Kamus untuk menerjemahkan teks ke ID Produk (Foreign Key)
    produk_map = {
        'Honda Beat': 1, 'Honda CB150R': 2, 'Honda CBR150R': 3,
        'Honda CRF150L': 4, 'Honda PCX 160': 5, 'Honda Revo Fit': 6,
        'Honda Scoopy': 7, 'Honda Stylo 160': 8, 'Honda Supra X 125': 9,
        'Honda Vario 125': 10, 'Honda Vario 160': 11
    }

    # 4. Hapus data penjualan yang lama agar bersih
    cursor.execute("DELETE FROM penjualan")
    db.commit()
    print("3. Membersihkan tabel 'penjualan' yang lama...")

    # 5. Eksekusi pemindahan data
    print("4. Sedang mengirim data relasional ke MySQL, tunggu sebentar...")
    berhasil = 0

    for index, row in df.iterrows():
        nama_motor = str(row['Produk']).strip()
        id_produk = produk_map.get(nama_motor)
        
        if id_produk is not None:
            # Memastikan format tanggal bersih
            tanggal = str(row['Tanggal'])[:10] 
            harga = row['Total_Penjualan']
            metode = row['Metode_Bayar']

            sql = "INSERT INTO penjualan (id_produk, tanggal, harga, metode_pembayaran) VALUES (%s, %s, %s, %s)"
            val = (id_produk, tanggal, harga, metode)
            cursor.execute(sql, val)
            berhasil += 1

    db.commit()
    print(f"✅ BERHASIL! {berhasil} baris data asli sudah masuk ke struktur relasional yang baru!")

if __name__ == "__main__":
    jalankan_import_relasional()