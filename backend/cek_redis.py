from redis_client import r

# lihat semua key yang tersimpan
keys = r.keys("*")
print("Daftar key di Redis:", keys)

# lihat isi salah satu key (kalau ada)
if keys:
    for key in keys:
        print(f"\n--- {key} ---")
        print(r.get(key))