# ASUMSI & CATATAN PROYEK BIGI BADMINTON

## 1. Lingkungan & Lokasi
- Proyek dikerjakan langsung di root folder `C:\laragon\www\bigi-badminton`.
- Database MySQL bernama `bigi_badminton` pada host `127.0.0.1`, user `root`, password `""`.

## 2. File Referensi UI
- Folder `docs/ui-reference/` belum berisi file referensi UI dari pengguna saat inisialisasi. Agent tidak akan membuat atau mengisinya sendiri secara otomatis.

## 3. Skema Primary Key & Relasi
- Seluruh 19 tabel mengikuti penamaan Primary Key dan Foreign Key sesuai spesifikasi persis:
  - `id_user`, `id_lapangan`, `id_produk`, `id_reservasi`, `id_detail_reservasi`, `id_pembayaran`, `id_shift`, `id_transaksi`, `id_detail`, `id_retur`, `id_restock`, `id_opname`, `id_log`, `id_informasi`, `id_biaya`, `id_laporan`, `id_mabar`, `id_peserta`, `id_chat`.

## 4. Fase 1B — Kerangka Kerja, shadcn/ui & UI Publik
- Proyek memakai kerangka Laravel + Inertia yang dikonfigurasi mandiri (manual) dengan Vite + TypeScript, bukan starter kit resmi Laravel Breeze/Jetstream.
- shadcn/ui dipasang manual dengan preset nova (@base-ui/react) dan Tailwind CSS v4.
- Gambar latar login/register di public/images/login-bg.jpg merupakan placeholder dan perlu diganti dengan foto lapangan badminton asli.


## 5. Fase 1C — Homepage dan Reservasi via WhatsApp
- Teks profil GOR, fasilitas, dan tagline pada `resources/js/lib/content.ts` merupakan teks placeholder yang perlu diganti dengan data asli GOR Bigi Badminton saat siap produksi.
- Nomor WhatsApp admin diambil secara terpusat dari shared props `config.wa_admin_number` (berasal dari `.env` `WA_ADMIN_NUMBER`) tanpa nomor fallback yang di-hardcode di navbar, footer, maupun halaman.
- Fungsi `cleanWaNumber` membersihkan karakter non-angka dan mengubah awalan "0" menjadi "62".
- Template pesan WhatsApp yang digunakan adalah format baku tunggal sesuai spesifikasi tanpa pengisian otomatis nama lapangan.
- Papan skor pada homepage beroperasi murni secara client-side (state lokal React) tanpa request ke server.
- Section Pilihan Lapangan dan Papan Skor dihapus dari homepage atas keputusan tim.
- Section Berita & Pengumuman (Informasi Terbaru) dihapus dari homepage atas permintaan tim.

## 6. Fase 1D — Open Mabar: Cari, Buat, Ikut

- Filter `gender` pada halaman daftar jadwal (`/open-mabar`) menggunakan pencocokan **persis** (`WHERE gender = ?`), bukan `LIKE`. Artinya filter `putra` tidak akan menampilkan `campuran`.
- Rute `/open-mabar/create` dan `/open-mabar/saya` didaftarkan **sebelum** `/open-mabar/{mabar}` di `routes/web.php` untuk menghindari konflik parameter wildcard.
- Edit jadwal yang mengandung upload foto dikirim sebagai `POST` dengan field `_method=PUT` (method spoofing) karena PHP tidak mendukung multipart body pada request `PUT` langsung.
- Foto jadwal disimpan di disk `public` dalam subfolder `mabar/`. File lama dihapus secara otomatis saat foto diganti (`update`) atau jadwal dihapus (`destroy`). Seeder memakai nama file yang tidak nyata di storage, sehingga komponen `MabarImage` menampilkan placeholder bergambar ikon jika file tidak ditemukan atau gagal dimuat.
- Ikut jadwal menggunakan `DB::transaction` + `lockForUpdate` pada baris `open_mabar` untuk mencegah race condition saat slot kuota diisi secara bersamaan.
- Jika baris `peserta_mabar` untuk pasangan `(id_mabar, id_user)` sudah ada dengan status `batal`, maka status diubah menjadi `terdaftar` tanpa membuat baris baru (mematuhi unique constraint `['id_mabar', 'id_user']`).
- Pembuat jadwal (`id_user` pada `open_mabar`) **tidak** otomatis menjadi peserta.
- Ikut jadwal hanya diperbolehkan jika status jadwal adalah `disetujui`; jadwal berstatus `menunggu` atau `ditolak` menolak permintaan ikut.

## 7. Fase 1E — Forum Chat Real-time per Jadwal Mabar (UC-08)

- **Cara Menjalankan Real-time:**
  - Menjalankan web server: `php artisan serve` (atau via host lokal Laragon).
  - Menjalankan WebSocket Reverb server: buka terminal terpisah dan jalankan `php artisan reverb:start`.
  - Frontend development (jika mode dev): `npm run dev`.
- **Build Frontend & Environment Variables:**
  - Nilai variabel `VITE_REVERB_*` (`VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`) tertanam secara statis saat build bundling Vite.
  - Setiap kali konfigurasi Reverb pada file `.env` diubah atau diperbarui, proses build ulang (`npm run build`) **wajib** dijalankan kembali agar file build frontend di `public/build/` memuat konfigurasi WebSocket yang baru.
- **Deduplikasi Pesan & UX:**
  - Halaman chat memuat 50 pesan terakhir dengan urutan kronologis (dari lama ke baru).
  - State pesan di React mendeduplikasi pesan berdasarkan identifier pesan (`id` / `id_chat`) sehingga pengirim yang baru saja mengirim pesan langsung melihat pesannya di UI, dan ketika event siaran Echo diterima tidak terjadi pesan ganda.
  - Jika server Reverb tidak aktif, pengiriman pesan tetap berjalan normal lewat HTTP POST dan tersimpan di database `chat_mabar`, serta pesan langsung tampil kembali saat halaman dimuat ulang.
- **Hak Akses & Otorisasi Channel:**
  - Rute HTTP (`GET` dan `POST /open-mabar/{mabar}/chat`) dilindungi middleware `auth` dan `role:user`. Pengguna role `admin` dan `kasir` mendapatkan respons `403 Forbidden`.
  - Otorisasi channel privat WebSocket `mabar.{id_mabar}`:
    - Role `user`: diizinkan bergabung jika status jadwal mabar adalah `disetujui`. Jika berstatus `menunggu` atau `ditolak`, otorisasi ditolak.
    - Role `admin`: diizinkan bergabung sebagai pendengar (hak Read).
    - Role `kasir`: ditolak bergabung (`false`).