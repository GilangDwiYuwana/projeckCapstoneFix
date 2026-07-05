import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import sys
import os
import json
from database import engine  # pastikan database.py benar
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error

def train_model():
    try:
        print("Mengambil data dari database...")
        df = pd.read_sql("SELECT * FROM data_penjualan ORDER BY Tanggal ASC", con=engine)

        if df.empty:
            print("ERROR: Dataset kosong. Pastikan tabel 'data_penjualan' berisi data.")
            return

        # PREPROCESS: tanggal -> period bulanan
        df['Tanggal'] = pd.to_datetime(df['Tanggal'])
        df['Period'] = df['Tanggal'].dt.to_period('M').dt.to_timestamp()  # first day of month

        # AGGREGATE monthly sales per product + metode
        agg = df.groupby(['Produk', 'Metode_Bayar', 'Period'], as_index=False).agg({
            'Jumlah_Terjual': 'sum',
            'Total_Penjualan': 'sum'
        }).rename(columns={'Total_Penjualan': 'TotalMonthly', 'Jumlah_Terjual': 'UnitsMonthly'})

        if agg.shape[0] < 20:
            print("ERROR: Data terlalu sedikit setelah agregasi bulanan (butuh >=20 rows).")
            return

        # Create numeric time index (months since start) to capture trend
        agg = agg.sort_values('Period')
        min_period = agg['Period'].min()
        agg['MonthIndex'] = ((agg['Period'].dt.year - min_period.year) * 12 + (agg['Period'].dt.month - min_period.month)).astype(int)

        # Seasonality: cyclic encoding for month
        agg['Month'] = agg['Period'].dt.month
        agg['sin_month'] = np.sin(2 * np.pi * agg['Month'] / 12)
        agg['cos_month'] = np.cos(2 * np.pi * agg['Month'] / 12)

        # LABEL ENCODING for categorical features
        le_produk = LabelEncoder()
        le_metode = LabelEncoder()
        agg['Produk_Encoded'] = le_produk.fit_transform(agg['Produk'])
        agg['Metode_Encoded'] = le_metode.fit_transform(agg['Metode_Bayar'])

        # FEATURES & TARGET
        X = agg[['Produk_Encoded', 'Metode_Encoded', 'MonthIndex', 'sin_month', 'cos_month', 'UnitsMonthly']].astype(float)
        y = agg['TotalMonthly'].astype(float)

        # Train / validation split by time (last N months as test)
        last_period = agg['MonthIndex'].max()
        test_cutoff = last_period - 5  # gunakan last 6 months as validation
        train_mask = agg['MonthIndex'] <= test_cutoff
        test_mask = agg['MonthIndex'] > test_cutoff

        if train_mask.sum() < 10:
            print("WARNING: Data training terlalu sedikit, memakai split lain.")
            train_mask = np.ones(len(agg), dtype=bool)
            test_mask = np.zeros(len(agg), dtype=bool)

        X_train, y_train = X[train_mask], y[train_mask]
        X_val, y_val     = X[test_mask], y[test_mask]

        print(f"Rows total={len(agg)}, train={len(X_train)}, val={len(X_val)}")

        # XGBoost training with early stopping
        model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=2000,
            learning_rate=0.03,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=1
        )

        eval_set = [(X_train, y_train)]
        if len(X_val) > 0:
            eval_set.append((X_val, y_val))

        print("Melatih model XGBoost (dengan early stopping jika tersedia)...")
        try:
            model.fit(
                X_train,
                y_train,
                eval_set=eval_set,
                early_stopping_rounds=50,
                verbose=50
            )
        except TypeError as e:
            if "early_stopping_rounds" in str(e):
                print("early_stopping_rounds tidak didukung oleh versi XGBoost ini, melatih tanpa early stopping.")
                model.fit(
                    X_train,
                    y_train,
                    eval_set=eval_set,
                    verbose=50
                )
            else:
                raise

        # EVALUASI sederhana
        train_pred = model.predict(X_train)
        print("Train RMSE:", np.sqrt(mean_squared_error(y_train, train_pred)))
        if len(X_val) > 0:
            val_pred = model.predict(X_val)
            print("Val RMSE:  ", np.sqrt(mean_squared_error(y_val, val_pred)))

        # SIMULASI: contoh prediksi untuk beberapa future months (cek variasi)
        print("Contoh prediksi (produk/metode pertama, 6 bulan ke depan):")
        sample_produk = agg['Produk'].iloc[0]
        sample_metode = agg['Metode_Bayar'].iloc[0]
        p_enc = le_produk.transform([sample_produk])[0]
        m_enc = le_metode.transform([sample_metode])[0]
        future_months = [last_period + i for i in range(1, 7)]
        for mi in future_months:
            month = (min_period + pd.DateOffset(months=int(mi))).month
            sin_m = np.sin(2 * np.pi * month / 12)
            cos_m = np.cos(2 * np.pi * month / 12)
            # use recent average units as proxy (or 0)
            recent_units = int(agg.loc[(agg['Produk']==sample_produk)&(agg['Metode_Bayar']==sample_metode), 'UnitsMonthly'].mean() or 0)
            feat = np.array([[p_enc, m_enc, mi, sin_m, cos_m, recent_units]], dtype=float)
            pr = float(model.predict(feat)[0])
            print(f"  monthIndex={mi} => pred={pr:.2f}")

        # SAVE model & encoders
        model.save_model("model_omset.json")
        joblib.dump(le_produk, 'le_produk.pkl')
        joblib.dump(le_metode, 'le_metode.pkl')

        # SAVE metadata for prediction consistency
        avg_units = {}
        for _, row in agg.groupby(['Produk', 'Metode_Bayar'])['UnitsMonthly'].mean().reset_index().iterrows():
            avg_units.setdefault(row['Produk'], {})[row['Metode_Bayar']] = float(row['UnitsMonthly'])
        default_units = float(agg['UnitsMonthly'].mean())

        model_meta = {
            "min_period": min_period.isoformat(),
            "avg_units": avg_units,
            "default_units": default_units,
            "training_metrics": {
                "train_rmse": float(np.sqrt(mean_squared_error(y_train, train_pred))),
                "val_rmse": float(np.sqrt(mean_squared_error(y_val, val_pred))) if len(X_val) > 0 else None,
                "rows_total": len(agg),
                "train_rows": len(X_train),
                "val_rows": len(X_val)
            }
        }
        with open("model_meta.json", "w", encoding="utf-8") as f:
            json.dump(model_meta, f, indent=2)

        print("MODEL PREDIKSI OMSET BERHASIL DILATIH DAN DISIMPAN.")
        return 0

    except Exception as e:
        print(f"Error saat training: {str(e)}")
        return 1

if __name__ == "__main__":
    code = train_model()
    sys.exit(code)