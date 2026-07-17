from redis_client import r

# tulis data ke Redis Cloud
r.set("test_key", "halo dari redis cloud")

# baca lagi data yang barusan ditulis
hasil = r.get("test_key")
print(hasil)