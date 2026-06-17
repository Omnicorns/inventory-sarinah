# StokKu — Inventory API (non-ERP, internal)

REST API untuk manajemen inventory internal dengan dua peran: **admin** (petugas gudang)
dan **staff** (pemohon). Stok dikelola lewat *ledger* pergerakan stok, dengan alur
permintaan → persetujuan → serah-terima → struk.

Dibangun dengan **Spring Boot 3.3 + Spring Data JPA + Spring Security (JWT)**.
Default pakai **H2 in-memory** supaya langsung jalan tanpa setup database.

## Menjalankan

Butuh **JDK 17+** dan **Maven**.

```bash
mvn spring-boot:run
```

API jalan di `http://localhost:8080`. H2 console: `http://localhost:8080/h2-console`
(JDBC URL: `jdbc:h2:mem:stokku`, user `sa`, password kosong).

Pindah ke MySQL: edit `src/main/resources/application.yml` (blok MySQL sudah disiapkan,
tinggal di-uncomment) dan aktifkan dependency MySQL di `pom.xml`.

## Akun default (di-seed saat pertama jalan)

| Peran | Email             | Password   |
|-------|-------------------|------------|
| admin | admin@stokku.test | `password` |
| staff | budi@stokku.test  | `password` |

Login mengembalikan JWT. Kirim di header setiap request:
`Authorization: Bearer <token>`.

## Struktur tabel (8 tabel, dibuat otomatis oleh JPA)

`users` · `categories` · `products` · `item_requests` · `request_items` ·
`stock_movements` (ledger) · `issue_slips` (struk) · `issue_slip_items`.

Stok fisik produk = kolom cache yang selalu sinkron dengan total `stock_movements`.
**Stok tersedia = stok fisik − yang dialokasikan** (permintaan disetujui tapi belum diserahkan).

## Endpoint utama

Auth
- `POST /api/auth/login` — login, dapat token
- `GET  /api/auth/me` — profil sendiri

Produk & kategori
- `GET  /api/products?search=` — daftar + stok tersedia + status (AMAN/MENIPIS/HABIS)
- `GET  /api/products/low-stock`
- `GET  /api/products/{id}` · `GET /api/products/{id}/movements`
- `POST /api/products` *(admin)* · `PATCH /api/products/{id}` *(admin)*
- `GET  /api/categories` · `POST /api/categories` *(admin)*

Stok
- `POST /api/stock/incoming` *(admin)* — barang masuk
- `POST /api/adjustments` *(admin)* — penyesuaian (TAMBAH/KURANGI/SET)
- `GET  /api/movements` — 20 pergerakan terakhir

Permintaan
- `POST /api/requests` — staff mengajukan
- `GET  /api/requests` — admin: semua; staff: miliknya
- `GET  /api/requests/{id}`
- `POST /api/requests/{id}/approve` *(admin)* — body opsional untuk approve sebagian
- `POST /api/requests/{id}/reject` *(admin)*
- `POST /api/requests/{id}/deliver` *(admin)* — stok keluar + struk terbit
- `GET  /api/requests/{id}/slip` — struk

Laporan *(admin)*
- `GET /api/reports/summary`
- `GET /api/reports/outgoing-monthly`
- `GET /api/reports/top-products?limit=5`
- `GET /api/reports/by-division`
- `GET /api/reports/stock-card?productId=..&from=2026-06-01&to=2026-06-10` — kartu stok (saldo awal, masuk/keluar, saldo berjalan)

User & Divisi
- `GET  /api/users` *(admin)* — daftar user
- `POST /api/users` *(admin)* — tambah user baru; sertakan `divisionId` (tanpa self-register)
- `PATCH /api/users/me/password` — ganti password sendiri
- `GET  /api/divisions` — daftar divisi (untuk dropdown)
- `POST /api/divisions` *(admin)* — tambah divisi

## Scoping per divisi

Divisi adalah master data (`divisions`); user terikat ke satu divisi (admin pusat boleh tanpa divisi).
Nama divisi dibawa di dalam JWT, dan penegakan akses terjadi di service:
- `GET /api/requests` — ADMIN melihat semua; user lain hanya melihat permintaan **se-divisinya**.
- `GET /api/requests/{id}` — 403 jika bukan admin, bukan pemilik, dan beda divisi.
- Saat membuat permintaan, divisi **selalu diambil dari profil user** (bukan input bebas) agar tidak bisa dipalsukan.
Stok & approval tetap terpusat di admin gudang (satu gudang untuk semua divisi).

Akun seed: admin@stokku.test (ADMIN), budi@ (Operasional), sari@ (GA), rudi@ (Retail) — password `password`.

CORS sudah dikonfigurasi untuk `http://localhost:5173` dan `http://localhost:3000`
(ubah di `CorsConfig.java` untuk origin lain/produksi).

## Alur kapan stok berkurang

1. Staff `POST /api/requests` → status `MENUNGGU`, stok tidak berubah.
2. Admin `approve` → status `DISETUJUI`, stok **dialokasikan** (tersedia turun, fisik tetap).
   Sistem menolak jika jumlah melebihi stok tersedia.
3. Admin `deliver` → stok **fisik** berkurang (movement `KELUAR`) + struk `issue_slips` terbit.

Lihat `requests.http` untuk contoh lengkap semua request.

> Catatan: kode ini ditulis di lingkungan tanpa akses Maven Central, jadi belum
> dikompilasi di sana. Jalankan `mvn spring-boot:run` di mesin Anda untuk build pertama.
