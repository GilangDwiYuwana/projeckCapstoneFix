import pandas as pd
import xgboost as xgb
import joblib
import sys
import os
from database import engine # Pastikan file database.py sudah benar
from sklearn.preprocessing import LabelEncoder

def train_model():
    try:
        print("Sedang menarik data dari database...")
        # Gunakan query yang memastikan data terurut agar pola tren terlihat
        df = pd.read_sql("SELECT * FROM data_penjualan ORDER BY Tanggal ASC", con=engine)
        
        if df.empty:
            print("Error: Dataset kosong. Pastikan tabel 'data_penjualan' memiliki isi.")
            return

        # 2. Preprocessing
        df['Tanggal'] = pd.to_datetime(df['Tanggal'])
        df['Tahun'] = df['Tanggal'].dt.year
        df['Bulan'] = df['Tanggal'].dt.month

        # 3. Label Encoding
        le_produk = LabelEncoder()
        le_metode = LabelEncoder()

        # Fit dan transform
        df['Produk_Encoded'] = le_produk.fit_transform(df['Produk'])
        df['Metode_Encoded'] = le_metode.fit_transform(df['Metode_Bayar'])

        # 4. Definisikan Fitur (X) dan Target (y)
        X = df[['Produk_Encoded', 'Metode_Encoded', 'Tahun', 'Bulan']]
        y = df['Total_Penjualan']

        # 5. Training Model XGBoost
        print("Sedang melatih model XGBoost...")
        model = xgb.XGBRegressor(
            objective='reg:squarederror', 
            n_estimators=500, 
            learning_rate=0.05,
            max_depth=6
        )
        model.fit(X, y)

        # 6. Simpan model dan encoder
        # Pastikan folder backend sudah memiliki izin tulis
        model.save_model("model_omset.json")
        joblib.dump(le_produk, 'le_produk.pkl')
        joblib.dump(le_metode, 'le_metode.pkl')

        # Pesan sukses tanpa karakter khusus (untuk menghindari UnicodeEncodeError)
        print("MODEL PREDIKSI OMSET BERHASIL DILATIH!")

    except Exception as e:
        print(f"Error saat training: {str(e)}")
        sys.exit(1) # Keluar dengan status error agar FastAPI tahu

if __name__ == "__main__":
    train_model()