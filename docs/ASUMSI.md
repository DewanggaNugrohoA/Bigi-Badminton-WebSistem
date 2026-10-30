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

## 12. Pemisahan Open Mabar dari Slot Reservasi Lapangan Otomatis
- Pengajuan dan persetujuan (ACC) Open Mabar tidak lagi otomatis mengunci atau memotong slot reservasi lapangan di sistem.
- Status slot `isTerisi` pada grid jadwal publik (Lihat Jadwal) dan ketersediaan slot reservasi murni mengacu pada reservasi lapangan resmi (`detail_reservasi`) yang dicatat oleh Admin serta status perawatan lapangan.
- Slot waktu lapangan pada menu Reservasi Lapangan (Admin) tetap berstatus `tersedia` (dengan indikator informatif rencana mabar yang dapat diklik), sehingga Admin memegang kendali penuh untuk mengelola dan menginput booking lapangan secara manual.

## 13. Edit / Reschedule Reservasi dan Pengembalian Kuota Sesi Member
- **Reschedule Jadwal Reservasi:**
  - Admin dapat mengubah tanggal main, jam mulai, jam selesai, atau lapangan untuk reservasi yang masih aktif (berstatus `terkonfirmasi`).
  - Sistem melakukan validasi bentrok slot lapangan dengan mengecualikan jadwal yang sedang di-reschedule agar tidak menolak perpindahan jadwal di hari yang sama.
  - Untuk pemesan member, reschedule tidak memotong sesi baru karena durasi/sesi yang digunakan berpindah ke jadwal baru. Setiap aktivitas reschedule dicatat pada `audit_log` dengan aksi `RESCHEDULE_RESERVASI`.
- **Pengembalian Kuota Sesi saat Batal / Hapus Reservasi:**
  - Jika reservasi member dibatalkan (`status_reservasi = 'batal'`) atau dihapus permanen oleh Admin, kuota sesi bermain member yang tadinya terpakai otomatis dikembalikan (refund) ke sisa sesi paket member aktif.
  - Contoh: Member memiliki 4 sesi, memesan 1 sesi bermain (sisa sesi menjadi 3). Ketika pemesanan tersebut dibatalkan atau dihapus, sisa sesi member otomatis kembali utuh menjadi 4.

## 14. Alokasi Jadwal Autofield Member & Fleksibilitas Sesi Bermain
- Pada fitur reservasi mingguan rutin member (Autofield), sistem otomatis membatasi jadwal pertemuan yang dibuat maksimal sebanyak sisa kuota sesi paket yang dimiliki member (`$sisaSesiPaket`).
- Contoh: Masa aktif 1 bulan member mencakup 5 kali hari Minggu (misal rentang 31 hari), namun paket member hanya memiliki 4 sesi. Sistem secara cerdas hanya menjadwalkan 4 pertemuan pertama yang valid (sesuai kuota 4 sesi paket) dan tidak lagi memasukkan pertemuan ke-5 sebagai bentrok kuota.
- **Prioritas Paket FIFO (First In First Out):** Jika member memiliki beberapa paket aktif (misal paket lama sudah habis 0 sesi dan baru saja membeli paket baru 8 sesi), sistem memprioritaskan paket yang masih memiliki sisa sesi > 0 (`getActivePaketMember`).
- **Pilihan Jumlah Sesi yang Dipesan:** Admin kini dapat memilih jumlah sesi yang ingin dipesan:
  - 1 Sesi (Sekali Main): Hanya memesan 1 pertemuan terdekat yang dipilih (sangat berguna jika member hanya ingin main satu sesi tanpa mengunci jadwal rutin berminggu-minggu).
  - 2 Sesi, 3 Sesi, 4 Sesi (Rutin 1 Bulan), atau Semua Sisa Kuota Paket.
- Pada tab Pemesanan Reguler, disediakan opsi cepat "Dari Member" untuk mengisi nama dan nomor WhatsApp otomatis dari member terdaftar.

## 15. Penghapusan Kolom Subtotal Kasir di Database & Perhitungan Dinamis di Struk
- Kolom `subtotal` pada tabel `detail_transaksi_pos` telah dihapus dari database fisik melalui migrasi `2026_10_16_223000_drop_subtotal_from_detail_transaksi_pos_table.php`.
- Nilai subtotal barang pada transaksi POS tidak lagi disimpan di database.
- Tampilan subtotal pada cetak struk kasir (`Struk.tsx`) dan model `DetailTransaksiPos` dihitung secara dinamis langsung dari perkalian jumlah barang yang dibeli dan harga satuan (`jumlah * harga`).
- Keseluruhan subtotal transaksi pada struk juga dihitung dari penjumlahan dinamis seluruh item belanja (`reduce((acc, it) => acc + (it.jumlah * it.harga), 0)`).

## 16. Pembaruan Tema Warna: Gradasi Abu dan Biru Dongker
- Warna situs secara keseluruhan mengadopsi palet dan tekstur gradasi gambar referensi terbaru pengguna:
  - **Latar Belakang Situs**: Menggunakan berkas wallpaper definisi tinggi pengguna (`/images/bg-gradient-mesh.png`) dengan posisi _cover fixed_, memadukan abu-abu titanium/perak lembut (`#8A8E95` / `#78808E`) di pojok kiri atas mengalir secara diagonal melintasi biru baja (`#3F5475` / `#173465`) menuju biru dongker royal pekat (`#001D50`) di pojok kanan bawah.
  - **Warna Aksen & Brand (`--brand`, `--primary`)**: Biru safir / kobalt royal (`#2563EB` / `#3B82F6`) untuk tombol utama, tab aktif, dan ring focus yang kontras tinggi dan hidup.
  - **Kartu & Permukaan**: Menggunakan slate navy gelap _frosted_ (`#0A1936` / `#0C1C3A`) dengan border halus (`#19325C`), memberikan kedalaman visual mewah (luxury glassmorphism) dan kontras keterbacaan data maksimal.
  - **Penyelarasan Komponen**: Header panel admin, tabel jadwal, serta elemen SVG beranda telah diselaraskan dengan palet abu-abu perak dan biru dongker pekat ini.

## 17. Fitur Lupa Kata Sandi via WhatsApp OTP
- Berdasarkan permintaan eksplisit pengguna (didukung mockup/tangkapan layar halaman login):
  - Disediakan tautan "Lupa kata sandi?" di bawah input kata sandi (rata kanan) pada halaman login pengguna (`/login`).
  - Alur lupa kata sandi memanfaatkan verifikasi OTP WhatsApp:
    1. Pengguna memasukkan nomor WhatsApp terdaftar pada formulir `/lupa-password`.
    2. Sistem memvalidasi keberadaan nomor, memformat awalan 08/62, menghasilkan kode OTP 6 digit acak yang di-hash dengan HMAC-SHA256 ke dalam tabel `password_reset_otp`, serta mengirimkan kode ke WhatsApp pengguna.
    3. Pengguna diarahkan ke halaman `/lupa-password/verifikasi` untuk memasukkan kode OTP 6 digit dan kata sandi baru (beserta konfirmasi). Terdapat cooldown timer 60 detik untuk kirim ulang kode dan pembatasan percobaan salah maksimal 5 kali.
    4. Setelah sukses diverifikasi, kata sandi akun pengguna diperbarui, sesi OTP dihapus, dan pengguna diarahkan ke `/login` dengan notifikasi sukses.
  - Tabel pendukung: `password_reset_otp` (`id_reset`, `no_whatsapp`, `kode_otp`, `expires_at`, `timestamps`).

## 18. Penghapusan Menu & Rute Void/Retur Kasir
- Berdasarkan permintaan eksplisit pengguna:
  - Menu navigasi "Koreksi -> Void/Retur" pada sidebar Panel Kasir (`resources/js/layouts/kasir-layout.tsx`) telah dihapus.
  - Halaman antarmuka kasir untuk void/retur (`resources/js/Pages/Kasir/Void/Index.tsx`) telah dihapus.
  - Rute HTTP `/kasir/void` (`GET` dan `POST`) pada `routes/web.php` serta method pendukung di `KasirController` telah dihapus.
  - Model `ReturVoid` dan tabel database `retur_void` tetap dipertahankan untuk integritas data audit dan laporan keuangan internal.

## 19. Fitur Notifikasi Suara WhatsApp & Pengajuan Open Mabar di Panel Admin
- Berdasarkan permintaan pengguna:
  - Setiap kali ada member yang mengajukan jadwal Open Mabar baru (status `menunggu`), Panel Admin otomatis membunyikan nada notifikasi khas WhatsApp (2-chime harmonik cerah) dan memunculkan toast interaktif dengan tombol langsung untuk meninjau pengajuan.
  - **Mekanisme Siaran Ganda (Hybrid Real-Time & Polling Fallback):**
    1. **Laravel Broadcast Event (`App\Events\MabarDiajukan`)**: Disiarkan secara real-time via saluran privat `admin.notifikasi` (khusus role `admin`) menggunakan Laravel Reverb.
    2. **Polling Fallback (`GET /admin/open-mabar/notifikasi`)**: Setiap 7 detik ketika tab browser aktif, layout admin memeriksa status pengajuan terbaru. Jika server Reverb belum aktif di lokal, sistem tetap otomatis mendeteksi dan membunyikan suara saat pengajuan baru masuk.
    3. **Deduplikasi**: ID mabar yang telah dibunyikan dicatat dalam memori client (`lastKnownIdRef`) sehingga tidak akan berbunyi ganda.
  - **Efek Suara WhatsApp & Browser Autoplay Policy:**
    - Modul `resources/js/lib/sound.ts` memadukan berkas audio `/sounds/wa-notification.wav` dan sintesis *Web Audio API* harmonik frekuensi tinggi (C6 -> G6) tanpa latensi jaringan.
    - Hak akses audio (Autoplay Policy) di-unlock otomatis saat klik/interaksi pertama admin di layar.
    - Pada header panel admin disediakan menu dropdown Bel Notifikasi lengkap dengan badge jumlah pengajuan *menunggu*, toggle suara (Aktif/Mati tersimpan di `localStorage`), dan tombol "Tes Bunyi Notifikasi (WA)".
    - Menu sidebar "Open Mabar" dilengkapi badge counter jumlah pengajuan yang berstatus *menunggu*.

## 20. Pemulihan Kolom Subtotal pada detail_transaksi_pos & Penguatan Cetak Struk
- Kolom `subtotal` (`decimal(12, 2)`) dipulihkan pada tabel `detail_transaksi_pos` melalui migrasi `2026_10_29_200001_add_subtotal_to_detail_transaksi_pos_table.php` untuk mencegah galat SQLSTATE 42S22 Unknown Column saat checkout POS dan memenuhi skema relasional asli.
- Nilai `subtotal` pada baris yang telah ada disinkronkan otomatis (`jumlah * harga`).
- Model `DetailTransaksiPos` mengembalikan `subtotal` dari kolom basis data atau kalkulasi dinamis sebagai fallback aman.
- Komponen cetak struk (`Struk.tsx`) diperkuat dengan penanganan fallback array kosong, fallback nama produk jika null, serta format waktu/tanggal yang tahan terhadap ragam variasi string ISO.

## 21. Fitur Manajemen Biaya Operasional Panel Admin
- Disediakan modul CRUD penuh Biaya Operasional pada `/admin/biaya-operasional` khusus untuk role `admin` (role `kasir` dan `user` ditolak 403).
- Kolom `jenis_pengeluaran` (`varchar(100)`) ditambahkan ke tabel `biaya_operasional` melalui migrasi `2026_10_29_200002_add_jenis_pengeluaran_to_biaya_operasional_table.php`.
- Model `BiayaOperasional` menyediakan alias mutator dan accessor untuk `nominal` (alias `jumlah`) dan `tanggal` (alias `tanggal_biaya`) agar kompatibel lintas penggunaan.
- Antarmuka menyediakan KPI ringkasan total pengeluaran per periode, filter tanggal tunggal (bidang 'Tanggal Selesai' dihapus agar lebih ringkas dan praktis), filter jenis pengeluaran, pencarian keterangan, modal form tambah/edit dengan preset pengeluaran (Listrik, WiFi, Gas, Perlengkapan, dll), dan dialog konfirmasi hapus.

## 22. Kalkulasi Laba Bersih pada Laporan Keuangan Eksekutif
- Laba bersih (netto) dihitung secara akurat sesuai proposal:
  `Laba Bersih = Total Pendapatan Kotor (Pendapatan Sewa Lapangan Valid + Pendapatan Penjualan POS Selesai) - Total Biaya Operasional`.
- Pembayaran sewa dari reservasi batal (`status_reservasi = 'batal'`) dan transaksi POS yang di-void (`status_transaksi = 'void'`) dikecualikan dari kalkulasi pendapatan riil.
- Nilai laba bersih, total pendapatan kotor, dan total biaya operasional ditampilkan secara visual pada 3 KPI Card ringkasan tab Keuangan serta rincian detail laporan dan berkas ekspor Excel.

## 23. Fitur Audit Log Panel Admin & Centralized Logging
- Disediakan modul Audit Log pada `/admin/audit-log` khusus untuk role `admin`.
- Tabel `audit_log` diperluas melalui migrasi `2026_10_29_200003_add_columns_to_audit_log_table.php` dengan kolom `role`, `modul`, `data_lama` (JSON), `data_baru` (JSON), dan `ip_address`.
- Layanan terpusat `AuditLogService` dan model event `AuditLog::creating` secara otomatis mengisi role aktor, timestamp, alamat IP, dan penyeragaman objek/modul.
- Pencatatan log terhubung ke seluruh operasi penting: void transaksi, restock barang, stock opname, checkout kasir, login/logout (staf maupun pengguna umum), serta operasi CRUD biaya operasional.
- Tampilan antarmuka audit log menyajikan urutan kronologis terbaru di atas dengan badge role, badge aksi berwarna, informasi pengguna, keterangan, alamat IP, filter tanggal/aksi/role/pengguna/pencarian, pagination, dan dialog penampil detail payload data.

## 24. Perubahan A: Tarif Sewa Lapangan & Paket Member Bayar di Awal
- **Tarif Sewa Lapangan Reguler:**
  - Tarif baru:
    - 1 jam = Rp 60.000
    - 2 jam = Rp 100.000
    - Lebih dari 2 jam dihitung dengan formula kelipatan 2 jam + sisa ganjil: `floor(jam / 2) * 100.000 + (jam % 2) * 60.000`. Contoh: 3 jam = Rp 160.000, 4 jam = Rp 200.000, 5 jam = Rp 260.000.
  - Perhitungan tarif dikelola terpusat di satu sumber kebenaran: `ReservasiService::hitungTarifReservasi` (backend) dan `resources/js/lib/admin-format.ts` (frontend).
  - Kolom `harga_per_jam` pada tabel `lapangan` diperbarui menjadi 60.000 lewat migrasi `2026_10_30_100001_update_harga_per_jam_on_lapangan_table.php` dan `DatabaseSeeder`.
  - Data historis reservasi lama tidak diubah harganya.
- **Paket Member (Bayar Sekali di Awal):**
  - Tiga paket resmi Bigi Badminton:
    1. Member Bulanan 4 hari x 3 jam = Rp 450.000
    2. Member Bulanan 4 hari x 2 jam = Rp 350.000
    3. Member Pagi (Senin s.d Kamis, 08.00-12.00), 4 hari x 3 jam = Rp 300.000
    4. Opsi Paket Kustom (sesi, durasi, harga fleksibel).
  - Skema pembayaran member: Member membayar satu kali di awal untuk satu paket penuh. Pembayaran dicatat langsung ke tabel `pembayaran` (`id_paket` terisi, `id_reservasi = null`).
  - Kolom pendukung `jenis_paket`, `durasi_jam_per_sesi`, dan `harga_paket` ditambahkan ke tabel `paket_member`, serta `id_paket` pada tabel `pembayaran` melalui migrasi `2026_10_30_100002_add_paket_details_and_pembayaran_paket_id.php`.
  - Sesi autofield / jadwal sewa member yang dibuat hanya mengonsumsi kuota paket (`sisa_sesi`) tanpa membuat tagihan baru (`total_biaya = 0`, `subtotal = 0`) dan tanpa membuat pembayaran ganda.
  - Fitur pencatatan sesi member (penyesuaian kuota manual oleh Admin) tetap utuh dan hanya mengurangi kuota tanpa menimbulkan tagihan atau pencatatan pendapatan baru.
  - Validasi ketat backend untuk Paket Member Pagi:
    - Hanya berlaku untuk hari Senin s.d Kamis (index 1 s.d 4).
    - Jam mulai >= 08:00 dan jam selesai <= 12:00.
    - Durasi per sesi harus tepat 3 jam (180 menit).
- **Laporan Keuangan Eksekutif & Ekspor Excel:**
  - Pendapatan paket member dihitung satu kali sebesar harga paket pada tanggal pembayaran paket.
  - Sesi reservasi autofield member tidak dihitung ulang sebagai pendapatan sewa lapangan agar terhindar dari perhitungan ganda (*no double counting*).
  - Laba bersih tetap akurat: `(Pendapatan Sewa Valid + Pendapatan Paket Member + Pendapatan POS Selesai) - Biaya Operasional`.

## 25. Perubahan B: Footer, Kontak Resmi, dan Google Maps Embed
- **Tata Letak Footer (`resources/js/components/site-footer.tsx`):**
  - Susunan desktop (`lg:grid-cols-12`): Brand (3 kolom) | Navigasi (2 kolom) | Open Mabar (2 kolom) | Kontak (2 kolom) | Peta Google Maps (3 kolom).
  - Kolom Kontak digeser ke sebelah kiri tepat berdampingan dengan kolom Open Mabar.
  - Kolom paling kanan memuat iframe embed Google Maps koordinat `-3.815252, 102.293190` dengan sudut membulat, garis tepi, atribut `loading="lazy"`, serta tombol tautan "Buka di Google Maps".
  - Responsif:
    - Mobile: Satu kolom vertikal rapi, peta berada di paling bawah dengan lebar 100%.
    - Tablet: Brand selebar layar, Navigasi dan Open Mabar bersanding di baris kedua, Kontak dan Peta bersanding di baris ketiga.
- **Informasi Kontak Resmi (`config/bigi.php` dan `resources/js/lib/content.ts`):**
  - Nomor WhatsApp Reservasi: `085664943141` dan `082374236585` (keduanya ditampilkan dengan tautan `wa.me`).
  - Akun Instagram: `@bigi_badminton` (`https://instagram.com/bigi_badminton`).
  - Alamat: "Lihat lokasi di peta" yang langsung membuka Google Maps di tab baru.
  - Jam Operasional: `08:00 - 23:00 WIB`.
  - Struk Kasir POS (`resources/js/Pages/Kasir/Struk.tsx`): Header alamat diperbarui menjadi "Bigi Badminton, Bengkulu".

## 26. Impor Data Riil Pemakaian Lapangan (28 Sep – 1 Nov 2026)
- Disediakan artisan command `php artisan bigi:import-jadwal-real {--fresh}` yang membaca data dari `database/data/jadwal_real_bigi.json`.
- Seluruh 180 sesi pemakaian riil lapangan 1 dan lapangan 2 dari 28 September s.d. 1 November 2026 dimasukkan ke dalam database lokal:
  - 103 sesi member terhubung ke 21 akun member aktif dan paket sesi masing-masing (`total_biaya = 0`).
  - 77 pemesanan reguler dengan variasi status: Lunas penuh, DP (uang muka 30k, 40k, 50k, 60k), Gratis/Free (Okta dan Akbar Rp 0), Transfer 100k, dan event turnamen kampus HIMASIF (7 jam @ Rp 360k per lapangan).
  - 9 jadwal berstatus dibatalkan (❌) dilepaskan slotnya, termasuk kasus khusus PB FA (2 Okt) yang batal tetapi uang Rp 100.000 sudah diterima untuk ganti hari lain yang secara otomatis masuk ke kategori "DP Reservasi Batal" di laporan keuangan.
- Pemasukan data ini murni melalui backend/artisan tanpa mengubah antarmuka (UI). Tanggal pembayaran (`tanggal_pembayaran`) disinkronkan ke tanggal transaksi asli agar laporan keuangan September dan Oktober 2026 menghasilkan angka omzet riil dan akurat.

## 27. Rincian Detail Sesi Pemakaian Lapangan & Pembayaran di Laporan Keuangan
- Berdasarkan permintaan pengguna agar output laporan menampilkan detail riil seluruh tanggal dari 1 s.d. 31 Oktober secara berurutan dan tidak hanya sepotong tanggal di akhir bulan:
  1. **Rekapitulasi Pemakaian & Pendapatan Lapangan per Hari (`sewaHarian`)**:
     - Mengagregasikan seluruh tanggal dalam periode secara kronologis (dari tanggal 1 s.d. 31 Oktober).
     - Menampilkan rekapitulasi komprehensif per hari: Tanggal & Hari, Total Sesi Bermain (rincian Lapangan 1 & 2 serta Member & Reguler), Total Jam Bermain, Jumlah Transaksi Bayar, DP, Pelunasan, Tunai, Transfer, Total Uang Masuk, serta Status Hari (Aktif / Kosong).
     - Paginasi mandiri (`page_sewa_harian`) dengan ukuran 35 per halaman sehingga seluruh 31 hari dalam satu bulan langsung tampil utuh dalam satu halaman tanpa terpotong ke halaman lain.
  2. **Rincian Seluruh Sesi Pemakaian Lapangan & Pemain (`sesiPemakaianLapangan`)**:
     - Menampilkan seluruh sesi bermain pemain di lapangan secara berurutan mulai dari tanggal 1 Oktober (mencakup 162 sesi riil).
     - Menyatukan data bermain pemain Member (yang menggunakan paket kuota) dan Reguler (Lunas, DP, Gratis/Free, Transfer).
     - Kolom: Tanggal Main, Lapangan (1 / 2), Jam Main & Durasi, Nama Pemain / Tim (dengan badge Member & kontak WA), Kategori (Member / Reguler), Status Sewa & Bayar, Metode Bayar, serta Catatan asli ("Bayar 100k", "Free", "Acara 7 jam", dll).
     - Paginasi mandiri (`page_sesi`) ukuran 50 sesi per halaman.
  3. **Rincian Riwayat Pembayaran Pemain & Member (`riwayatPembayaranSewa`)**:
     - Menampilkan seluruh transaksi uang masuk secara kronologis dari awal periode dengan paginasi mandiri 50 transaksi per halaman.
  4. **Penyelarasan Modal Paket Member (`TambahPaketModal.tsx`)**:
     - Teks panduan header yang dicoret merah (*"Pembayaran dilakukan sekali di awal."*) dan placeholder catatan dihapus sesuai arahan visual pengguna, sementara textarea *Catatan Paket (Opsional)* tetap dipertahankan.






## 28. Penyederhanaan Laporan Keuangan ke Arus Kas Pendapatan & Pengeluaran Harian
- Berdasarkan arahan pengguna bahwa laporan keuangan tidak perlu mencantumkan nama pemain dan format kotak-kotak DP/Lunas dihilangkan agar tampilan sederhana namun tetap rapi:
  1. **Fokus Murni Arus Kas / Ledger Keuangan Harian**:
     - Tabel nama pemain dan riwayat pembayaran pemain dilepas dari tab Keuangan (data pemain tetap dapat diakses di tab Pemain dan menu Reservasi).
     - Tab Keuangan berfokus pada **Rekapitulasi Arus Kas Harian (Pendapatan & Pengeluaran)** dengan kolom: Tanggal & Hari, Pendapatan Sewa, Pendapatan POS, Total Pendapatan, Pengeluaran Operasional, dan Laba Bersih / Selisih Harian.
     - Seluruh tanggal dalam periode (misal 1 s.d. 31 Oktober) tampil berurutan; hari dengan atau tanpa aktivitas terlihat jelas dengan perolehan uang masuk dan keluar.
     - Disediakan baris ringkasan total keseluruhan periode di bagian bawah tabel.
  2. **Tampilan Sederhana & Rapi**:
     - Kotak-kotak terpisah untuk DP dan Lunas serta kartu grid metode pembayaran sewa lapangan dihapus.
     - Ringkasan Keuangan atas disederhanakan dengan baris ringkas: Pendapatan Sewa, Pendapatan POS, Total Pendapatan Kotor, Pengeluaran Operasional, Laba Bersih, Koreksi Kas, dan Piutang Sewa.


## 29. Pembersihan Data Riil Pemakaian Lapangan & Member
- Disediakan artisan command `php artisan bigi:hapus-data-real {--force}` untuk membersihkan seluruh data riil pemakaian lapangan, reservasi sewa, transaksi pembayaran sewa, paket member, dan akun-akun member impor.
- Data yang telah dibersihkan bersih dari database:
  - 180 sesi pemakaian lapangan (`detail_reservasi`)
  - 180 reservasi lapangan (`reservasi`)
  - 93 riwayat transaksi pembayaran sewa & paket (`pembayaran`)
  - 21 paket member (`paket_member`)
  - 21 akun member impor (ID 5 s/d 25 pada tabel `users`)
- Seluruh 4 akun awal (`dewa nugroho`, `Admin Bigi`, `Kasir Bigi`, `Dewangga Nugroho`) tetap utuh.
- Command `bigi:import-jadwal-real` tetap tersedia dan dapat dijalankan kembali kapan saja jika data riil ingin diimpor ulang.
