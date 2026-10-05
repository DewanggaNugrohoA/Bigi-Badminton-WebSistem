# AGENTS.md — Bigi Badminton

Instruksi permanen untuk semua agent di workspace ini. Baca seluruh file ini sebelum mengerjakan tugas apa pun.

## 1. Proyek

Sistem Reservasi dan Informasi Open Mabar **Bigi Badminton** (GOR dengan 2 lapangan). Proyek Tim 1B, Program Studi Sistem Informasi, Universitas Bengkulu.

Sumber kebenaran, dengan urutan prioritas jika ada konflik:

1. **Panduan Revisi** (pemisahan Panel Kasir dari Panel Admin)
2. **System Proposal v2.0** (bagian yang tidak direvisi)
3. Asumsi yang tertulis di file ini dan di `docs/ASUMSI.md`

Jangan menambah fitur di luar dokumen. Jika ada hal yang tidak jelas, pilih opsi paling sederhana, lalu catat di `docs/ASUMSI.md`.

## 2. Stack

| Bagian | Pilihan |
|---|---|
| Framework | Laravel (versi stabil terbaru yang cocok dengan PHP di Laragon) |
| Frontend | Inertia + React + TypeScript + Tailwind CSS + shadcn/ui (starter kit React bawaan Laravel, autentikasi bawaan Laravel, **bukan WorkOS**) |
| Database | MySQL dari Laragon. Nama DB `bigi_badminton`, host `127.0.0.1`, user `root`, password kosong (hanya untuk lokal) |
| Real-time chat | Laravel Reverb |
| Export Excel | `maatwebsite/excel` (dipakai di Panel Admin, bukan di User Panel) |
| Upload | Disk `public` + `php artisan storage:link` |
| Zona waktu / bahasa | `Asia/Jakarta`, locale `id` |

Jangan menebak perintah instalasi. Cek dokumentasi resmi Laravel untuk versi yang terpasang.

## 3. Tiga role dan panel

| Role | Panel | Rute | Redirect setelah login |
|---|---|---|---|
| `user` | Dashboard User + Open Mabar | `/dashboard`, `/open-mabar/*`, `/pengaturan/*` | `/dashboard` |
| `admin` | Panel Admin | `/admin/*` | `/admin` |
| `kasir` | Panel Kasir | `/kasir/*` | `/kasir` |

Halaman publik (tanpa login): `/`, `/login`, `/register`.

Aturan akses:

- Login **satu pintu** (`/login`) untuk ketiga role. Login memakai **email + password**.
- Setiap grup rute dilindungi middleware `role:<nama-role>` yang dicek **pada setiap request**. Role salah menghasilkan **403**, bukan redirect diam-diam.
- Akun dengan `status_akun = nonaktif` tidak boleh login (tampilkan pesan yang jelas).
- Akun kasir **dinonaktifkan, tidak dihapus**, supaya riwayat transaksi utuh.

## 4. Matriks hak akses (CRUD Analysis, versi revisi)

| Objek data | User | Admin | Kasir |
|---|---|---|---|
| Akun user | CRU (akun sendiri) | R | - |
| Akun admin | - | CRU | - |
| Akun kasir | - | CRU (nonaktifkan, bukan hapus) | RU (akun sendiri) |
| Reservasi | CR (lihat status miliknya) | CRUD | - |
| Menu (POS) / Produk | - | CRUD (daftar menu dan harga) | R |
| Transaksi POS | - | R | CR |
| Laporan Keuangan | - | CRUD | - |
| Snack / stok (restock, opname) | - | R | RU |
| Shift kasir | - | R | CRU |
| Void / Retur | - | RU (setujui/tolak) | C |
| Audit log | - | R | - |
| Informasi pemain | R | CRUD | - |
| Jadwal mabar | CRUD (milik sendiri) | RU | - |
| Forum chat | CR | R | - |

## 5. Model data

Aturan penamaan, supaya sama dengan Class Diagram dan ERD:

- Nama tabel dan kolom **persis** seperti di Class Diagram/ERD (snake_case).
- Primary key bernama `id_<entitas>` (contoh `id_user`, `id_reservasi`). Set `$table` dan `$primaryKey` secara eksplisit di setiap model.
- Tambahan teknis yang diperbolehkan: `timestamps()` pada semua tabel.
- Kolom tambahan di luar dokumen ditandai **[+]** di prompt dan dicatat di `docs/ASUMSI.md`.

Daftar tabel (19), kolom lengkapnya ada di Prompt 1A:

`users`, `lapangan`, `produk`, `reservasi`, `detail_reservasi`, `pembayaran`, `shift_kasir`, `transaksi_pos`, `detail_transaksi_pos`, `retur_void`, `restock`, `stock_opname`, `audit_log`, `informasi`, `biaya_operasional`, `laporan_keuangan`, `open_mabar`, `peserta_mabar`, `chat_mabar`.

## 6. Aturan bisnis lintas panel

1. Stok barang terpotong **setelah pembayaran dikonfirmasi**, bukan saat item dipilih.
2. `transaksi_pos.id_user` adalah **kasir** yang melayani, bukan pembeli.
3. Pembayaran sewa lapangan (DP/Lunas) dicatat oleh **Admin**, bukan Kasir.
4. Kasir **tidak bisa melihat** data reservasi.
5. Void/retur diajukan Kasir dan **harus disetujui Admin**. Stock opname oleh Kasir **tidak** perlu persetujuan, tetapi tercatat di `audit_log`.
6. Open Mabar baru berstatus `menunggu`. Hanya yang `disetujui` yang tampil ke pengguna lain.
7. Aktivitas penting (void, retur, restock, opname, selisih kas) dicatat di `audit_log`.
8. Seluruh slot reservasi tidak boleh bentrok (validasi di Panel Admin).

## 7. Aturan UI

- Semua teks antarmuka dalam **Bahasa Indonesia**.
- Tema **gelap** sebagai default (`<html class="dark">`). Satu variabel warna brand `--brand` bernilai `#6633ee` (turunan dari `#63e` pada referensi background). Ganti di satu tempat jika ada warna brand resmi.
- Komponen referensi ada di `docs/ui-reference/`. Baca, adaptasi, **jangan ubah file referensinya**:
  - `dithered-footer.tsx`, `tailwind-css-background-snippet.tsx`, `sign-in-page.tsx`, `navigation-menu.tsx`
- Letakkan hasil adaptasi di `resources/js/components/` (komponen shadcn tetap di `components/ui/`).
- **Tidak boleh ada** (tidak ada di proposal): login Google/GitHub, newsletter, lupa password, "ingat saya", 2FA, verifikasi email, hapus akun.
- Responsif mobile-first. Komponen interaktif harus bisa dipakai dengan keyboard dan punya label yang jelas.
- Konten teks fasilitas, alamat, nomor WA, dan Instagram disimpan di satu tempat (`config/bigi.php` dan `resources/js/lib/content.ts`) supaya mudah diganti.

## 8. Aturan kerja agent

- Gunakan **Planning mode**. Tampilkan implementation plan dulu, lalu kerjakan.
- Kerjakan **hanya fase yang diminta**. Jangan melompat ke fase berikutnya.
- Setelah tiap fase: jalankan migrasi, typecheck, build frontend, dan test, lalu perbaiki semua error.
- Setiap fase diakhiri satu `git commit` dengan pesan jelas. Jangan commit `.env`.
- Jangan mengubah isi `docs/ui-reference/`.
- Catat asumsi baru di `docs/ASUMSI.md`.
- Di akhir fase, tulis ringkasan singkat: apa yang dibuat, apa yang sengaja ditunda, dan cara mengujinya.
