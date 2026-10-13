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
- Tombol Reservasi via WA di navbar dihapus atas keputusan tim; tombol tetap ada di hero dan footer.

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

## 8. Fase 1F — Dashboard User & Pengaturan Akun (UC-10)

- **Toast Global:**
  - Menggunakan komponen `sonner` shadcn/ui yang dipasang pada `PublicLayout` mendengarkan shared props `flash.success` dan `flash.error` secara terpusat.
  - Notifikasi inline ganda di halaman Open Mabar telah dibersihkan agar seluruh aksi terintegrasi dengan toast seragam.
- **Navigasi Akun Berdasarkan Role:**
  - Role `user`: Menu akun di navbar memuat tautan ke `/dashboard`, `/pengaturan/akun`, dan `Keluar`.
  - Role `admin`: Menu akun di navbar hanya memuat tautan ke panel `/admin` dan `Keluar`.
  - Role `kasir`: Menu akun di navbar hanya memuat tautan ke panel `/kasir` dan `Keluar`.
- **Halaman Galat (403 & 404):**
  - Menggunakan komponen Inertia `Pages/Error.tsx` berbahasa Indonesia dengan tombol kembali kontekstual berdasarkan role pengguna (admin ke `/admin`, kasir ke `/kasir`, user ke `/dashboard`, tamu ke `/`).
- **Dashboard User (`/dashboard`):**
  - Bersifat read-only: Menampilkan ringkasan status jadwal mabar milik pengguna, daftar reservasi lapangan milik pengguna (eager loaded relasi lapangan & pembayaran), serta mabar mendatang yang diikuti.
  - User A diisolasi penuh dari melihat data reservasi dan mabar milik User B.
- **Pengaturan Akun (`/pengaturan/akun`):**
  - Pengguna hanya memiliki hak CRU pada akunnya sendiri. Tidak ada fungsi hapus akun, 2FA, lupa password, maupun preferensi tema.
  - Validasi update profil menolak email duplikat milik pengguna lain dan menerima jika email milik sendiri tidak berubah.
  - Validasi ganti kata sandi mewajibkan verifikasi `current_password` yang cocok.

## 9. Revisi Autentikasi No. HP & Verifikasi OTP WhatsApp
- **Penghapusan Kolom Email pada Pendaftaran & Login User:**
  - Pendaftaran pengguna (`/register`) tidak lagi meminta input email, hanya nama, nomor WhatsApp (No. HP), dan kata sandi.
  - Kolom `email` pada tabel `users` dijadikan `nullable()`.
  - Kolom `no_whatsapp` pada tabel `users` memiliki indeks unik (`unique`).
  - Halaman login (`/login`) menggunakan nomor WhatsApp sebagai identitas utama pengguna, namun backend tetap mendukung `email` untuk kompatibilitas akun Admin dan Kasir.
- **Mekanisme Verifikasi OTP WhatsApp:**
  - Setelah mengisi form pendaftaran, sistem menyimpan data sementara pada tabel `verifikasi_otp` dan membuat 6-digit kode OTP dengan masa berlaku 10 menit.
  - Layanan WhatsApp Gateway (`App\Services\WhatsAppService`) mengirimkan kode via API (mendukung provider Fonnte/Wablas dengan token di `.env`).
  - Pada lingkungan pengujian / lokal di mana `WA_GATEWAY_TOKEN` kosong, kode OTP dicatat ke log sistem dan ditampilkan pada flash pesan dev agar pengujian lokal tetap berjalan lancar.
  - Pengguna melakukan verifikasi pada rute `/register/verifikasi`. Setelah kode cocok, data user resmi dibuat di tabel `users` (`role = user`, `status_akun = aktif`) dan diarahkan ke `/login`.
- **Standar & Validasi Nomor WhatsApp/HP Indonesia:**
  - Input nomor WhatsApp pada form Login, Register, dan Pengaturan Profil dibatasi ketat hanya menerima karakter angka (huruf dan simbol otomatis dicegah/dibersihkan).
  - Nomor harus berawalan `08` (jika user paste format `+628...` atau `628...`, sistem otomatis menormalisasikannya menjadi `08...`).
  - Panjang nomor dibatasi minimal 10 digit dan maksimal 13 digit angka (`regex:/^08[0-9]{8,11}$/`), sesuai standar penomoran seluler di Indonesia.

## 10. Integrasi Badge Keanggotaan Member (Award Badge) di Panel User
- **Otoritas Status Member:**
  - Status keanggotaan (`jenis_pelanggan = 'member'` dan `status_member = 'aktif'`) sepenuhnya merupakan wewenang Admin. User tidak dapat mengubah status keanggotaannya sendiri secara mandiri.
- **Tampilan Badge Interaktif 3D di Panel User:**
  - Komponen `AwardBadge` (`resources/js/components/ui/award-badge.tsx`) mengadaptasi efek 3D matrix tilt interaktif dan kilau holografik (`mixBlendMode: overlay`) untuk badge keanggotaan Bigi Badminton.
  - Badge keanggotaan (`BigiMemberBadge`) **HANYA** muncul di akun pengguna jika pengguna telah disetujui / diubah oleh Admin menjadi member aktif (`user.jenis_pelanggan === 'member' && user.status_member === 'aktif'`).
  - Letak tampilan badge di User Panel:
    1. **Dashboard User (`/dashboard`)**: Di dalam Welcome Banner Card pengguna di sisi kanan (desktop) atau sejajar (mobile), berdampingan dengan tanggal masa aktif member.
    2. **Pengaturan Akun (`/pengaturan/akun`)**: Di dalam kotak status keanggotaan sebagai penanda status resmi member aktif.
  - Jika pengguna masih berstatus reguler atau belum diaktifkan oleh Admin, badge tidak ditampilkan (hanya menampilkan status reguler standar).

## 11. Manajemen Akun Staf (Admin & Kasir)
- Seluruh akun staf tidak lagi disediakan melalui akun sampel/dummy bawaan seeder; akun dibuat secara aman melalui perintah `php artisan bigi:buat-admin`.