# PROMPT USER PANEL — Bigi Badminton (untuk Antigravity)

Dokumen ini berisi **6 prompt berurutan (Fase 1A sampai 1F)**. Salin satu fase ke agent, tunggu selesai dan lolos pengecekan, baru lanjut ke fase berikutnya. Aturan permanen ada di `AGENTS.md`.

## Persiapan (dikerjakan manual, sekali saja)

1. Nyalakan **Laragon** (web server + MySQL). Pastikan PHP, Composer, dan Node.js tersedia.
2. Buat folder proyek, lalu simpan `AGENTS.md` di root folder itu.
3. Buat folder `docs/ui-reference/` dan simpan 4 kode komponen 21st.dev sebagai file:
   `dithered-footer.tsx`, `tailwind-css-background-snippet.tsx`, `sign-in-page.tsx`, `navigation-menu.tsx`.
4. (Opsional) Simpan PDF System Proposal dan Panduan Revisi di `docs/`.
5. Buka folder itu di Antigravity, pilih **Planning mode**, lalu jalankan Fase 1A.

## Keputusan dan asumsi yang dipakai

Hal berikut tidak tertulis tegas di dokumen, jadi sudah diputuskan di sini. Ubah jika dosen memutuskan lain.

| No | Keputusan | Dasar |
|---|---|---|
| 1 | **Open Mabar hanya bisa diakses setelah login** (daftar, detail, buat jadwal, chat). Homepage hanya memuat ajakan masuk | To-Be poin 3, UC-07 include Login |
| 2 | `laporan_keuangan` dibuat sebagai tabel **snapshot rekap** (ada di Class Diagram dan CRUD, tidak ada di ERD) | Class Diagram, CRUD |
| 3 | Nilai Enum (dokumen hanya menulis "Enum") ditetapkan di Fase 1A | Class Diagram |
| 4 | **[+] `users.status_akun`** (aktif/nonaktif) untuk menonaktifkan akun | Asumsi 6 revisi, UC-16 |
| 5 | **[+] `open_mabar.foto`** dan **`open_mabar.id_lapangan`** (opsional) | Narasi To-Be poin 3, FR poin 5 |
| 6 | **[+] `laporan_keuangan.id_laporan`** sebagai primary key | Class Diagram tidak mencantumkan PK |
| 7 | "Informasi pemain" (hak Read User) = **daftar peserta** pada detail Open Mabar. Tabel `informasi` = pengumuman di homepage | CRUD Analysis, FR poin 5 |
| 8 | "Papan skor" di homepage = widget skor manual di sisi klien, **tidak disimpan** ke database (tidak ada entitasnya) | To-Be poin 1 |
| 9 | Paket sesi member (FR poin 4) **tidak punya kelas** di Class Diagram. Tidak dibuat sekarang, diputuskan di prompt Admin | Class Diagram |
| 10 | User hanya **membaca** reservasi miliknya (status), reservasi diinput Admin. Cara Admin menautkan reservasi ke akun pelanggan diputuskan di prompt Admin | CRUD Analysis |

## Peta use case ke fase

| Use case | Fase |
|---|---|
| UC-03 Login | 1A (backend), 1B (UI) |
| UC-01 Registrasi Akun | 1B |
| UC-02 Melihat Homepage & Reservasi WA | 1C |
| UC-07 Kelola Informasi Mabar | 1D |
| UC-08 Akses Forum Chat | 1E |
| UC-10 Pengaturan Akun User | 1F |

Di luar dokumen ini (dibangun di prompt Admin dan Kasir): UC-04, 05, 06, 09, 11 sampai 18.

---

# FASE 1A — Fondasi: proyek, database, auth, role

**Mode:** Planning. **Hanya kerjakan Fase 1A.** Baca `AGENTS.md` dulu.

## Tujuan

Proyek Laravel berjalan di Laragon dengan database lengkap (19 tabel), login satu pintu dengan 3 role, dan middleware role. Belum ada UI publik.

## Langkah

### 1. Buat proyek

- Buat proyek Laravel dengan **starter kit React (Inertia)** dan autentikasi bawaan Laravel (bukan WorkOS). Cek dokumentasi resmi untuk perintah yang benar.
- Pasang dependensi dari `docs/ui-reference/`: `@base-ui/react`, `framer-motion`, `@tabler/icons-react`. Pastikan `clsx` dan `tailwind-merge` ada.
- Atur `.env` dan `.env.example`: koneksi MySQL Laragon (`bigi_badminton`), `APP_NAME="Bigi Badminton"`, `APP_LOCALE=id`, timezone `Asia/Jakarta`, `WA_ADMIN_NUMBER=` (format `62xxxxxxxxxx`).
- Buat `config/bigi.php` berisi: `wa_admin_number` (dari env), `alamat`, `instagram`, `jam_operasional` (nilai placeholder).
- Set `<html class="dark">` dan variabel `--brand: #6633ee`.

### 2. Sesuaikan autentikasi

- Login memakai **email + password** dan menolak akun `status_akun = nonaktif`.
- Registrasi memakai field: `nama`, `email`, `no_whatsapp`, `password`, konfirmasi password. Akun baru otomatis `role = user`, `jenis_pelanggan = reguler`, `status_member = tidak_aktif`, `status_akun = aktif`. Setelah registrasi sukses, arahkan ke halaman login dengan pesan sukses.
- **Nonaktifkan atau hapus**: lupa password, verifikasi email, 2FA, hapus akun, dan fitur login sosial jika ada.
- Setelah login, redirect sesuai role (`/dashboard`, `/admin`, `/kasir`).

### 3. Migration (urutan sesuai dependensi)

Semua tabel memakai `timestamps()` dan engine InnoDB. FK memakai `restrictOnDelete()` kecuali ditulis lain. Tulis FK dengan nama kolom PK yang eksplisit (contoh `constrained('users', 'id_user')`).

Urutan: `users`, `lapangan`, `produk`, `reservasi`, `detail_reservasi`, `pembayaran`, `shift_kasir`, `transaksi_pos`, `detail_transaksi_pos`, `retur_void`, `restock`, `stock_opname`, `audit_log`, `informasi`, `biaya_operasional`, `laporan_keuangan`, `open_mabar`, `peserta_mabar`, `chat_mabar`.

| Tabel | Kolom |
|---|---|
| `users` | `id_user` PK, `nama` varchar(255), `no_whatsapp` varchar(20), `email` varchar(255) unique, `password`, `role` enum(admin,kasir,user) default user, `jenis_pelanggan` enum(member,reguler) default reguler, `tanggal_mulai_member` date null, `tanggal_akhir_member` date null, `status_member` enum(aktif,tidak_aktif) default tidak_aktif, **[+]** `status_akun` enum(aktif,nonaktif) default aktif, `remember_token`. Tabel bawaan lain (sessions, cache, jobs) tetap; sesuaikan `sessions.user_id` agar tetap cocok dengan PK baru |
| `lapangan` | `id_lapangan` PK, `nama_lapangan` varchar(50), `harga_per_jam` decimal(12,2), `status_lapangan` enum(tersedia,perawatan), `keterangan` text null |
| `produk` | `id_produk` PK, `nama_produk` varchar(255), `kategori` varchar(100), `harga` decimal(12,2), `stok` int default 0, `stok_minimum` int default 0, `status_produk` enum(aktif,nonaktif) |
| `reservasi` | `id_reservasi` PK, `id_user` FK users, `tanggal_pemesanan` date, `total_biaya` decimal(12,2), `status_reservasi` enum(terkonfirmasi,selesai,batal) default terkonfirmasi |
| `detail_reservasi` | `id_detail_reservasi` PK, `id_reservasi` FK (cascadeOnDelete), `id_lapangan` FK, `tanggal_main` date, `jam_mulai` time, `jam_selesai` time, `durasi` int (menit), `subtotal` decimal(12,2). Index `(id_lapangan, tanggal_main)` |
| `pembayaran` | `id_pembayaran` PK, `id_reservasi` FK, `tanggal_pembayaran` date, `jenis_pembayaran` enum(DP,Lunas), `jumlah` decimal(12,2), `metode_pembayaran` enum(transfer,tunai,qris), `status_pembayaran` enum(menunggu,terkonfirmasi), `keterangan` text null |
| `shift_kasir` | `id_shift` PK, `id_user` FK (kasir), `waktu_buka` datetime, `waktu_tutup` datetime null, `modal_awal` decimal(12,2), `kas_sistem` decimal(12,2) null, `kas_fisik` decimal(12,2) null, `selisih` decimal(12,2) null, `status` enum(terbuka,ditutup) default terbuka |
| `transaksi_pos` | `id_transaksi` PK, `id_user` FK (**kasir**), `id_shift` FK, `no_transaksi` varchar(30) unique, `tanggal` datetime, `subtotal` decimal(12,2), `diskon` decimal(12,2) default 0, `total` decimal(12,2), `metode_bayar` enum(tunai,qris), `uang_diterima` decimal(12,2) null, `kembalian` decimal(12,2) null, `status_transaksi` enum(selesai,void,retur) default selesai, `catatan` text null |
| `detail_transaksi_pos` | `id_detail` PK, `id_transaksi` FK (cascadeOnDelete), `id_produk` FK, `jumlah` int, `harga` decimal(12,2), `subtotal` decimal(12,2) |
| `retur_void` | `id_retur` PK, `id_transaksi` FK, `id_user` FK (kasir pengaju), `id_admin` FK users **nullable** (penyetuju), `jenis` enum(void,retur), `alasan` text, `status` enum(menunggu,disetujui,ditolak) default menunggu, `tanggal` datetime |
| `restock` | `id_restock` PK, `id_produk` FK, `id_user` FK (kasir), `jumlah` int, `tanggal` date, `keterangan` text null |
| `stock_opname` | `id_opname` PK, `id_produk` FK, `id_user` FK (kasir), `stok_sistem` int, `stok_fisik` int, `selisih` int, `tanggal` date, `keterangan` text null |
| `audit_log` | `id_log` PK, `id_user` FK, `aksi` varchar(100), `objek` varchar(100), `keterangan` text null, `waktu` datetime |
| `informasi` | `id_informasi` PK, `id_user` FK, `judul` varchar(255), `gambar` varchar(255) null, `tanggal_publikasi` date null, `status` enum(draft,terbit) default draft |
| `biaya_operasional` | `id_biaya` PK, `id_user` FK (admin), `tanggal_biaya` date, `keterangan` text, `jumlah` decimal(12,2) |
| `laporan_keuangan` | **[+]** `id_laporan` PK, `periode_awal` date, `periode_akhir` date, `pendapatan_lapangan` decimal(12,2), `pendapatan_pos` decimal(12,2), `total_pengeluaran` decimal(12,2), `profit_bersih` decimal(12,2) |
| `open_mabar` | `id_mabar` PK, `id_user` FK, `judul` varchar(255), `tanggal` date, `jam_mulai` time, `jam_selesai` time, `gender` enum(putra,putri,campuran), `batas_usia_min` int, `batas_usia_max` int, `kuota` int, `deskripsi` text null, **[+]** `foto` varchar(255) null, **[+]** `id_lapangan` FK lapangan null, `status` enum(menunggu,disetujui,ditolak) default menunggu |
| `peserta_mabar` | `id_peserta` PK, `id_mabar` FK (cascadeOnDelete), `id_user` FK, `tanggal_daftar` date, `status_peserta` enum(terdaftar,batal) default terdaftar. Unique `(id_mabar, id_user)` |
| `chat_mabar` | `id_chat` PK, `id_mabar` FK (cascadeOnDelete), `id_user` FK, `pesan` text, `waktu` datetime |

### 4. Model dan relasi (Eloquent)

Buat 19 model dengan `$table` dan `$primaryKey` eksplisit. Relasi sesuai Class Diagram dan revisi:

- `User` hasMany: `Reservasi`, `OpenMabar`, `PesertaMabar`, `ChatMabar`, `Informasi`, `BiayaOperasional`, `TransaksiPos` (sebagai kasir), `ShiftKasir`, `Restock`, `StockOpname`, `AuditLog`. Juga `ReturVoid` sebagai pengaju (`id_user`) dan sebagai penyetuju (`id_admin`).
- `Reservasi` hasMany `DetailReservasi`, hasMany `Pembayaran`. `DetailReservasi` belongsTo `Lapangan`.
- `ShiftKasir` hasMany `TransaksiPos`. `TransaksiPos` hasMany `DetailTransaksiPos`, hasMany `ReturVoid`. `DetailTransaksiPos` belongsTo `Produk`.
- `Produk` hasMany `Restock`, `StockOpname`, `DetailTransaksiPos`.
- `OpenMabar` hasMany `PesertaMabar`, hasMany `ChatMabar`, belongsTo `User` (pembuat).
- Tambahkan konstanta/enum PHP untuk nilai enum di atas.
- Method domain pada `OpenMabar` yang dibutuhkan fase ini: `approveMabar()` dan `rejectMabar()` (mengubah `status`; UI-nya dibangun di prompt Admin).
- Method domain di kelas lain (mis. `hitungTotal()`, `bukaShift()`) cukup dibuat sebagai kerangka kosong dengan komentar `TODO` untuk prompt Admin/Kasir.

### 5. Middleware role dan rute placeholder

- Buat middleware `role` (alias `role:admin`, `role:kasir`, `role:user`) yang dicek di setiap request. Role salah menghasilkan 403.
- Buat halaman placeholder sederhana untuk `/admin` ("Panel Admin, segera hadir") dan `/kasir` ("Panel Kasir, segera hadir") supaya redirect setelah login bisa diuji. `/dashboard` untuk user juga placeholder dulu.

### 6. Seeder (data dev)

Semua akun memakai password `password` (khusus lokal).

- `admin@bigi.test` (admin), `kasir@bigi.test` (kasir), `user@bigi.test` (user, reguler), `member@bigi.test` (user, member aktif dengan tanggal mulai/akhir), satu akun kasir `kasir.nonaktif@bigi.test` dengan `status_akun = nonaktif`.
- 2 `lapangan` ("Lapangan 1", "Lapangan 2", harga placeholder, status tersedia).
- 6 `produk` contoh (minuman, makanan, shuttlecock) dengan stok.
- 5 `open_mabar`: 3 `disetujui` (tanggal ke depan, variasi gender dan batas usia, satu punya foto), 1 `menunggu`, 1 `ditolak`. Beberapa `peserta_mabar` dan beberapa `chat_mabar`.
- 2 `informasi` berstatus `terbit`.
- 1 `reservasi` milik `member@bigi.test` dengan 1 `detail_reservasi` dan 1 `pembayaran`.

### 7. Test

Tulis feature test (test runner bawaan starter kit) untuk:

- login benar mengarahkan ke panel sesuai role, login salah menampilkan pesan gagal,
- akun `nonaktif` ditolak,
- user mengakses `/admin` dan `/kasir` mendapat 403, kasir mengakses `/admin` mendapat 403, admin mengakses `/dashboard` mendapat 403,
- registrasi membuat akun dengan `role = user`.

## Kriteria selesai Fase 1A

- [ ] `php artisan migrate:fresh --seed` sukses, 19 tabel terbentuk
- [ ] Login dengan 3 role mengarah ke panel yang benar, role tertukar mendapat 403
- [ ] Akun nonaktif tidak bisa login
- [ ] Tidak ada fitur lupa password, verifikasi email, 2FA, hapus akun
- [ ] Semua test lolos, `git commit` dibuat

---

# FASE 1B — Layout publik: navbar, footer, login, registrasi

**Mode:** Planning. **Hanya kerjakan Fase 1B.** Fase 1A sudah selesai.

## Tujuan

Kerangka tampilan yang dipakai semua halaman: navbar, footer, halaman login dan registrasi, dengan menyesuaikan komponen di `docs/ui-reference/`.

## Langkah

### 1. Navbar (dari `navigation-menu.tsx`)

- Pindahkan komponen ke `resources/js/components/ui/navigation-menu.tsx`. Ganti fungsi `cn` lokal dengan `cn` dari `@/lib/utils`.
- Buat `components/site-navbar.tsx` yang memakai komponen itu:
  - Menu: **Beranda**, **Fasilitas** (anchor ke section di homepage), **Open Mabar** (dropdown: *Cari Jadwal*, *Buat Jadwal*, *Jadwal Saya*), tombol **Reservasi via WA**.
  - **Tamu:** tombol *Masuk* dan *Daftar*. Klik menu Open Mabar sebagai tamu mengarahkan ke login dan kembali ke halaman tujuan setelah berhasil.
  - **Sudah login:** menu akun (nama, *Dashboard*, *Pengaturan Akun*, *Keluar*). Untuk role admin/kasir, tampilkan tautan ke panel masing-masing.
  - Di bawah `md`: tampilkan tombol hamburger yang membuka `Sheet` shadcn berisi menu yang sama (komponen referensi tidak punya versi mobile).
- Tombol *Reservasi via WA* memakai fungsi `buildWaLink()` di `lib/content.ts` (dibuat pada Fase 1C; di fase ini cukup link ke `https://wa.me/{config.wa_admin_number}`).
- Tampilan: transparan di atas hero, menjadi solid dengan blur saat di-scroll.

### 2. Footer (dari `dithered-footer.tsx`)

- Salin ke `components/ui/dithered-footer.tsx` lalu ubah:
  - **Hapus** form newsletter dan semua kode `onSubscribe`, state email, dan status.
  - Tambah prop `wordmark` terpisah dari `brand`: `brand="Bigi Badminton"` untuk tautan kecil, `wordmark="BIGI"` untuk teks raksasa (nama panjang akan meluber di layar kecil).
  - Ganti kolom bawaan menjadi: **Navigasi** (Beranda, Fasilitas, Open Mabar, Masuk), **Open Mabar** (Cari Jadwal, Buat Jadwal, Jadwal Saya), **Kontak** (WhatsApp, alamat GOR, jam operasional dari `config/bigi.php`). Semua `href` harus nyata, tidak memakai fungsi `toLinks` bawaan.
  - Ganti ikon sosial menjadi WhatsApp dan Instagram (SVG inline). Kosongkan `legal` (tidak ada halaman privasi/syarat).
  - Copyright: `© {tahun} Bigi Badminton`. Prop `accent` diisi `var(--brand)` (jika perlu, teruskan nilai hex-nya).

### 3. Login dan registrasi (dari `sign-in-page.tsx`)

- Hapus `react-router-dom`. Pakai `Link` dan `router`/`useForm` dari Inertia. Tombol kembali mengarah ke `/`.
- **Hapus:** tombol Google, tombol GitHub, pemisah "or", checkbox "Remember me", tautan "Forgot password".
- Terjemahkan teks: "Selamat Datang Kembali", "Belum punya akun? Daftar", label *Email*, *Kata sandi*, tombol *Masuk*.
- Panel kanan memakai token tema (`bg-background`, `text-foreground`), bukan putih tetap. Gambar panel kiri diganti file lokal `public/images/login-bg.jpg` (placeholder foto lapangan badminton; tulis di `docs/ASUMSI.md` bahwa gambar perlu diganti).
- Tampilkan error validasi per field dan pesan umum "Email atau kata sandi salah". Sembunyikan panel gambar di layar kecil.
- Buat halaman **registrasi** dengan layout yang sama. Field: *Nama*, *Email*, *Nomor WhatsApp*, *Kata sandi*, *Konfirmasi kata sandi*, dengan tombol tampil/sembunyi kata sandi. Validasi kelengkapan di server. Jika valid, simpan dan arahkan ke login dengan notifikasi "Registrasi berhasil, silakan masuk".
- Buat `layouts/public-layout.tsx` (navbar + slot + footer). Login dan registrasi memakai layout penuh sendiri tanpa navbar/footer.

## Kriteria selesai Fase 1B

- [ ] Navbar tampil benar sebagai tamu dan sebagai user, dropdown Open Mabar berfungsi, menu mobile berfungsi
- [ ] Footer tampil dengan efek titik, teks `BIGI` tidak meluber di layar ponsel, tanpa form newsletter
- [ ] Login: gagal menampilkan pesan, sukses mengarah sesuai role. Registrasi: akun baru bisa dibuat lalu login
- [ ] Tidak ada sisa Google/GitHub/Remember me/Forgot password di kode
- [ ] Typecheck, build, dan test lolos, `git commit` dibuat

---

# FASE 1C — Homepage dan reservasi via WhatsApp

**Mode:** Planning. **Hanya kerjakan Fase 1C.**

## Tujuan

Halaman `/` (UC-02): profil, fasilitas 2 lapangan, papan skor, dan tombol **Reservasi via WA** yang membuka WhatsApp admin dengan pesan terformat.

## Langkah

### 1. Konten dan helper

Buat `resources/js/lib/content.ts` berisi teks profil, tagline, daftar fasilitas (placeholder realistis dalam Bahasa Indonesia, mudah diganti), dan fungsi `buildWaLink()`:

- Tautan: `https://wa.me/{nomor}?text={pesan ter-encode}`. Nomor dari `config('bigi.wa_admin_number')` yang dikirim lewat Inertia shared props.
- Isi pesan:

```
Halo admin Bigi Badminton, saya ingin reservasi lapangan.

Nama:
Tanggal main:
Jam mulai - selesai:
Lapangan (1/2):
Tipe pelanggan (Member/Non-member):

Terima kasih.
```

### 2. Controller dan data

`HomeController` mengirim ke halaman: daftar `lapangan` (nama, harga per jam, status) dan `informasi` berstatus `terbit` (maksimal 3, terbaru dulu).

### 3. Section homepage (`pages/home.tsx`, memakai `PublicLayout`)

1. **Hero**: pakai pola dari `tailwind-css-background-snippet.tsx` sebagai layer latar (`relative isolate`, layer gradien `absolute inset-0 -z-10`), bukan komponen `Hero` utuh. Isi: judul, tagline, dua tombol: *Reservasi via WA* (utama) dan *Lihat Open Mabar* (ke `/open-mabar`; tamu diarahkan ke login). Gradien memakai `--brand`.
2. **Profil dan fasilitas** (`id="fasilitas"`): teks profil dan daftar fasilitas.
3. **Lapangan**: satu kartu per lapangan dari database (nama, harga per jam, badge status `tersedia`/`perawatan`).
4. **Papan skor**: dua papan skor (Lapangan 1 dan 2) dengan tombol +1, -1, dan reset per sisi. Murni state di klien, tidak ada request ke server. Beri label kecil "Papan skor manual".
5. **Informasi terbaru**: kartu dari tabel `informasi` (gambar, judul, tanggal). Sembunyikan section jika kosong.
6. **Open Mabar**: banner ajakan dengan tombol *Masuk untuk melihat jadwal* (tamu) atau *Buka Open Mabar* (sudah login). Jangan tampilkan data jadwal ke tamu.
7. Footer dari Fase 1B.

Semua section responsif dan memakai animasi masuk yang halus, dengan menghormati `prefers-reduced-motion`.

## Kriteria selesai Fase 1C

- [ ] Homepage tampil benar di ponsel dan desktop
- [ ] Tombol *Reservasi via WA* (navbar dan hero) membuka WhatsApp ke nomor di `.env` dengan pesan terformat yang benar
- [ ] Data lapangan dan informasi berasal dari database (hasil seeder)
- [ ] Papan skor bekerja tanpa request ke server
- [ ] Tamu tidak melihat data Open Mabar di homepage
- [ ] Typecheck, build, dan test lolos, `git commit` dibuat

---

# FASE 1D — Open Mabar: cari, buat, ikut

**Mode:** Planning. **Hanya kerjakan Fase 1D.**

## Tujuan

UC-07: pengguna login dapat mencari dan memfilter jadwal, membuat jadwal baru (menunggu persetujuan Admin), merevisi jadwal yang ditolak, dan ikut/batal ikut.

Semua rute di bawah memakai middleware `auth` dan `role:user`.

## Rute dan controller

| Method | Rute | Fungsi |
|---|---|---|
| GET | `/open-mabar` | Daftar + filter |
| GET | `/open-mabar/create` | Form buat jadwal |
| POST | `/open-mabar` | Simpan (status `menunggu`) |
| GET | `/open-mabar/saya` | Jadwal milik saya beserta statusnya |
| GET | `/open-mabar/{mabar}` | Detail + daftar peserta |
| GET/PUT | `/open-mabar/{mabar}/edit` | Revisi jadwal |
| DELETE | `/open-mabar/{mabar}` | Batalkan (hapus) jadwal milik sendiri |
| POST/DELETE | `/open-mabar/{mabar}/ikut` | Ikut / batal ikut |

Gunakan `OpenMabarPolicy`: hanya pemilik yang boleh `update`/`delete`.

## Aturan dan perilaku

### Daftar dan filter (`cariJadwal()`)

- Tampilkan hanya jadwal `disetujui` dengan `tanggal >= hari ini`, urut tanggal terdekat.
- Filter lewat query string, diproses di server: **usia** (angka; cocok jika `batas_usia_min <= usia <= batas_usia_max`), **tanggal**, **jenis kelamin** (`gender`). Filter bisa dikosongkan.
- Kartu menampilkan: foto, judul, tanggal, jam, gender, rentang usia, `peserta terdaftar / kuota`, nama pembuat. Ada keadaan kosong ("Belum ada jadwal yang cocok") dan pagination.

### Buat jadwal (`buatJadwal()`)

- Field: judul, tanggal, jam mulai, jam selesai, gender, batas usia min, batas usia maks, kuota, deskripsi (termasuk catatan khusus), foto (gambar, maks 2 MB, opsional), lapangan (opsional).
- Validasi: tanggal tidak boleh lampau, jam selesai setelah jam mulai, usia maks >= usia min, kuota >= 1.
- Simpan dengan `status = menunggu`. Tampilkan notifikasi: "Jadwal berhasil dikirim dan menunggu persetujuan admin".

### Jadwal saya dan revisi

- Halaman *Jadwal Saya* menampilkan semua jadwal milik pengguna dengan badge status (`menunggu`, `disetujui`, `ditolak`).
- Jadwal berstatus `ditolak` atau `menunggu` boleh diedit. Setelah jadwal `ditolak` diedit dan disimpan, status kembali menjadi `menunggu` (sesuai Activity 2.7: dikembalikan ke User untuk direvisi).
- Pemilik boleh menghapus jadwal miliknya (CRUD User pada jadwal mabar). Peserta dan chat ikut terhapus.

### Detail dan ikut

- Detail dapat dibuka jika jadwal `disetujui`, atau jika pengguna adalah pemiliknya. Tampilkan daftar peserta (nama saja).
- Tombol *Ikut* membuat `peserta_mabar` (`status_peserta = terdaftar`). Tolak jika kuota penuh atau pengguna sudah terdaftar. Tombol *Batal Ikut* mengubah status menjadi `batal` (kuota terhitung ulang dari yang `terdaftar`).
- Pembuat jadwal tidak otomatis menjadi peserta.
- Tombol *Buka Ruang Obrolan* mengarah ke `/open-mabar/{id}/chat` (dibangun di Fase 1E, sementara tautan saja).

### Admin (di luar fase ini)

Persetujuan dan penolakan dibangun di Panel Admin. Di fase ini cukup pastikan `OpenMabar::approveMabar()` dan `rejectMabar()` berfungsi lewat test.

## Kriteria selesai Fase 1D

- [ ] Filter usia, tanggal, dan gender bekerja, kombinasi filter bekerja
- [ ] Jadwal baru tersimpan `menunggu` dan tidak muncul di daftar publik
- [ ] Jadwal `ditolak` bisa direvisi dan kembali `menunggu`
- [ ] Ikut/batal ikut menghormati kuota dan mencegah duplikasi
- [ ] Pengguna lain tidak bisa mengedit atau menghapus jadwal bukan miliknya (403)
- [ ] Test untuk validasi, policy, kuota, dan `approveMabar()`/`rejectMabar()` lolos, `git commit` dibuat

---

# FASE 1E — Forum chat real-time per jadwal mabar

**Mode:** Planning. **Hanya kerjakan Fase 1E.**

## Tujuan

UC-08: pengguna login memilih satu jadwal, membuka ruang obrolan, mengirim pesan, dan pesan tampil real-time untuk pengguna lain di ruang yang sama.

## Langkah

1. Pasang **Laravel Reverb** dan Laravel Echo sesuai dokumentasi versi yang terpasang. Catat di `docs/ASUMSI.md` cara menjalankannya: `php artisan reverb:start` di terminal terpisah, selain `npm run dev`.
2. Rute (middleware `auth`, `role:user`):
   - `GET /open-mabar/{mabar}/chat`: halaman ruang obrolan, memuat 50 pesan terakhir.
   - `POST /open-mabar/{mabar}/chat`: simpan pesan (`kirimPesan()`).
3. Event `PesanMabarTerkirim` (gunakan `ShouldBroadcastNow` agar tidak butuh queue worker) pada channel privat `mabar.{id_mabar}` (`broadcast()`). Payload: id, nama pengirim, id pengirim, pesan, waktu.
4. Otorisasi channel di `routes/channels.php`: pengguna dengan role `user` boleh bergabung jika jadwal berstatus `disetujui`. Role `admin` boleh **mendengarkan** (hak Read), tetapi hanya `user` yang boleh mengirim.
5. Validasi pesan: wajib diisi, maksimal 500 karakter. Simpan ke `chat_mabar` dengan `waktu` sekarang, lalu broadcast.
6. UI (`pages/open-mabar/chat.tsx`):
   - Header: judul jadwal, tanggal, jam, tombol kembali ke detail.
   - Daftar pesan: pesan sendiri di kanan, pesan orang lain di kiri dengan nama dan jam. Auto-scroll ke pesan terbaru.
   - Input di bawah, kirim dengan tombol atau `Enter` (`Shift+Enter` untuk baris baru).
   - Pesan dari pengguna lain muncul lewat Echo tanpa reload. Hindari pesan ganda untuk pengirim sendiri.
   - Keadaan kosong ("Belum ada pesan. Mulai obrolan!") dan indikator jika koneksi real-time terputus.
7. Pesan tetap tersimpan dan tampil saat halaman dimuat ulang, meskipun Reverb tidak berjalan.

## Kriteria selesai Fase 1E

- [ ] Dua browser dengan dua akun berbeda saling menerima pesan tanpa reload
- [ ] Pesan tersimpan di `chat_mabar` dan muncul setelah reload
- [ ] Jadwal yang belum `disetujui` tidak bisa dibuka ruang obrolannya (403/404)
- [ ] Admin tidak bisa mengirim pesan (hanya Read)
- [ ] Test untuk validasi dan otorisasi lolos, `git commit` dibuat

---

# FASE 1F — Dashboard User dan Pengaturan Akun

**Mode:** Planning. **Hanya kerjakan Fase 1F.**

## Tujuan

Halaman utama setelah login untuk role `user` (`/dashboard`) dan pengaturan akun (UC-10).

## Langkah

### 1. Dashboard User (`/dashboard`)

Memakai layout dengan navbar dari Fase 1B. Isi:

- Sapaan dengan nama pengguna dan, untuk member, kartu status keanggotaan (jenis pelanggan, `status_member`, `tanggal_akhir_member`), hanya baca.
- Ringkasan angka: jumlah jadwal mabar milik saya per status, jumlah mabar yang saya ikuti.
- **Reservasi saya** (hanya baca): daftar reservasi milik pengguna dengan tanggal main, jam, lapangan, status reservasi, dan status pembayaran (DP/Lunas). Gunakan eager loading. Keadaan kosong: "Belum ada reservasi. Reservasi dilakukan lewat WhatsApp admin" dengan tombol *Reservasi via WA*.
- **Mabar yang saya ikuti** (mendatang) dan tautan cepat ke *Cari Jadwal*, *Buat Jadwal*, *Jadwal Saya*.

### 2. Pengaturan Akun (`/pengaturan/akun`)

Alur sesuai Activity 2.9: buka menu, form terisi data saat ini, ubah, simpan, validasi, simpan ke database, tampilkan notifikasi.

- Form profil: `nama`, `email` (unik, abaikan milik sendiri), `no_whatsapp`.
- Form ganti kata sandi: kata sandi saat ini, kata sandi baru, konfirmasi.
- Input tidak valid: tampilkan pesan peringatan dan kembali ke form. Berhasil: notifikasi "Profil Berhasil Diperbarui".
- Dari halaman pengaturan bawaan starter kit, **hapus**: hapus akun, 2FA, dan halaman appearance. Hak User atas akunnya hanya **CRU** (tidak ada Delete).
- Pengguna hanya bisa mengubah akunnya sendiri.

### 3. Pemolesan lintas halaman

- Notifikasi (toast) yang konsisten untuk semua aksi.
- Halaman 403 dan 404 berbahasa Indonesia dengan tombol kembali ke panel masing-masing.
- Cek aksesibilitas dasar (label form, fokus keyboard, kontras) dan responsivitas ponsel di semua halaman Fase 1B sampai 1F.

## Kriteria selesai Fase 1F

- [ ] `/dashboard` menampilkan data milik pengguna yang login saja (uji dengan dua akun)
- [ ] Pengaturan akun menyimpan perubahan dan menolak input tidak valid dengan pesan jelas
- [ ] Tidak ada fitur hapus akun
- [ ] Alur uji manual dari awal lolos: daftar, login, buat jadwal, jadwal muncul `menunggu`, ikut jadwal seeder, kirim chat, ubah profil, keluar
- [ ] Semua test, typecheck, dan build lolos, `git commit` dibuat

---

## Setelah User Panel selesai

Prompt berikutnya: **Panel Admin** (UC-04, 05, 09, 16, 17, 18, persetujuan Open Mabar, kelola produk dan harga, laporan Excel) dan **Panel Kasir** (UC-06, 11 sampai 15, serta sambungan ke laporan). Keduanya memakai database dan middleware dari Fase 1A.
