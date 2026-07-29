# UAT — PRESENSI ANUGRAH

Rencana User Acceptance Test + stress-test kecurangan. Target: **Kamis–Jumat**
(isi tanggal: ____ – ____). Peserta: tim AII (≥3 orang untuk simulasi peran).

Legenda hasil: ✅ lolos · ⚠️ lolos dengan catatan · ❌ gagal (buat isu).

---

## 0. Persiapan
- [ ] `supabase/schema.sql` versi terbaru sudah dijalankan (izin_khusus, home_feed, dll).
- [ ] Deploy Vercel terbaru sudah live di `presensi-aii.vercel.app`.
- [ ] Minimal 3 akun uji: 1 admin, 2 karyawan. Catat email + ID (AII00x).
- [ ] 1 perangkat di dalam kantor (Wisma 46) & 1 di luar untuk uji geofence.
- [ ] Foto/PDF contoh untuk lampiran cuti.

## 1. Kriteria lolos (sign-off)
UAT dianggap lulus bila:
- Semua skenario **Bagian B** (fungsional) ✅.
- Semua vektor **Bagian A** yang seharusnya diblokir memang **diblokir** — atau
  keterbatasan yang diketahui sudah didokumentasikan & diterima secara sadar.
- Tidak ada kebocoran data lintas-karyawan (Bagian C).

---

## Bagian A — Stress test kecurangan (PRIORITAS)

> Tujuan: cari cara "menang" curang. Yang **gagal diblokir** belum tentu bug —
> beberapa memang keterbatasan desain (lihat §A.9). Tandai dan putuskan sadar.

### A.1 Absen di luar radius (geofence)
- [ ] Clock in dari luar kantor (rumah/kafe) → tombol **harus nonaktif**, badge "di luar radius". Expected: ❌ tak bisa absen.
- [ ] Clock in tepat di pinggir gedung / lobi (radius kini **30 m**) → cek apakah karyawan sah **ditolak** padahal di kantor. Bila sering ditolak → naikkan `radiusM`.
- [ ] Uji beberapa titik dalam gedung & lantai berbeda; catat `distance` & `accuracy` yang muncul.

### A.2 Spoofing lokasi GPS
- [ ] Fake GPS (app Android / override Geolocation di DevTools browser) ke titik kantor → **kemungkinan lolos** (geofence tak bisa bedakan GPS asli vs palsu).
- [ ] **Uji celah accuracy:** laporkan lokasi jauh TAPI `accuracy` sangat besar (mis. 5 km). Karena cek = `distance − accuracy ≤ radius`, ini **bisa lolos**. Catat sebagai temuan (lihat §A.9).

### A.3 Bypass lewat API langsung
- [ ] Dengan sesi login valid, panggil endpoint Supabase `attendance` langsung (tanpa app) untuk insert absen **tanpa foto & tanpa di lokasi**. Expected saat ini: **berhasil** (geofence/foto hanya cek klien; RLS izinkan insert milik sendiri). → temuan keamanan penting.

### A.4 Manipulasi jam / tanggal perangkat
- [ ] Ubah jam perangkat lalu clock in → `clock_in_at` **mengikuti jam perangkat** (bukan server). Cek apakah status telat/tepat waktu & jam kerja bisa dimanipulasi.
- [ ] Ubah tanggal perangkat → cek `work_date` (juga dari perangkat).

### A.5 Titip absen / buddy punching
- [ ] Karyawan A login akun B di HP-nya, di kantor, foto wajah A → absen tercatat untuk B. Expected: **lolos secara sistem**, tapi **foto selfie B = wajah A** → admin bisa deteksi via review foto. Uji alur deteksinya.
- [ ] Selfie pakai **foto cetak/di layar** orang lain (tak ada liveness detection) → kemungkinan lolos; catat.

### A.6 Bypass approval cuti
- [ ] Karyawan coba set statusnya sendiri jadi `approved` (via API) → **harus ditolak** (trigger `enforce_leave_transition`, admin-only).
- [ ] Ajukan cuti tahunan < 10 hari dari sekarang → **harus ditolak** ("advance"). Coba juga akali lewat API.
- [ ] Ajukan cuti bertumpang-tindih tanggalnya → **harus ditolak** (exclusion constraint).
- [ ] Cuti melebihi sisa kuota (cuti tahunan) → **harus ditolak** ("quota").

### A.7 Akses data orang lain (RLS)
- [ ] Karyawan coba baca profil / absensi / cuti karyawan lain via API → **harus kosong/ditolak** (RLS `own` + `is_admin`).
- [ ] Karyawan coba buka foto di Storage milik orang lain (path ditebak) → **harus ditolak**.

### A.8 Izin khusus (fitur baru)
- [ ] Ajukan **Izin khusus** → muncul di dropdown, butuh approval, **tidak** memotong kuota cuti tahunan. Verifikasi saldo tak berubah setelah approve.

### A.9 Keterbatasan yang diketahui (untuk diputuskan)
Ini **bukan** bug baru; catat penerimaannya:
1. **Geofence & foto hanya divalidasi di klien** → bisa dilewati via API (A.3). Mitigasi kuat butuh validasi server-side (Edge Function/trigger) — di luar scope UAT.
2. **Jam/tanggal dari perangkat** (A.4) → pertimbangkan pakai `now()` server.
3. **Tidak ada liveness detection** pada selfie (A.5) → deteksi mengandalkan review foto oleh admin.
4. **Radius accuracy-aware** melebarkan celah spoofing (A.2). Pertimbangkan batasi kontribusi `accuracy` (mis. maks 100 m).

---

## Bagian B — Simulasi fungsional per peran (tim)

### B.1 Karyawan
- [ ] Login, lihat beranda: salam, kartu jam, shift benar.
- [ ] Carousel: kartu ultah / karyawan baru (3 hari) / sedang cuti tampil bila ada.
- [ ] Clock in di kantor (foto + lokasi) → tercatat, riwayat muncul, thumbnail benar.
- [ ] Clock out → total jam kerja benar (mulai 08:30, break 1 jam).
- [ ] Reminder muncul sesuai jadwal; mati saat hari libur/weekend.
- [ ] Hari libur: banner "hari libur", tak perlu absen; di layar Clock In muncul "hari ini libur".
- [ ] Ajukan tiap jenis cuti (tahunan, sakit, unpaid, dinas luar, **izin khusus**) + lampiran.
- [ ] Notifikasi lonceng: keputusan cuti masuk (hanya belum dibaca).
- [ ] Profil: email/atasan/tanggal bergabung/lokasi benar; ganti bahasa; ganti password.

### B.2 Admin
- [ ] Buka tampilan Admin; dasbor: hadir/telat/belum absen/izin + badge pending.
- [ ] Approve & reject cuti (+catatan) → status terkirim ke karyawan.
- [ ] Direktori + detail karyawan: edit shift/jabatan/**peran akses** (muncul modal peringatan)/tanggal lahir/tanggal bergabung/penyesuaian kuota/toggle statistik/reset password.
- [ ] Blok kehadiran bulan ini di detail karyawan benar.
- [ ] Buat akun karyawan baru (peran akses Karyawan/Admin) → akun jadi, ID auto (AII00x).
- [ ] Kelola shift & hari libur; **hapus hari libur → muncul modal konfirmasi**.
- [ ] Laporan: pilih bulan/tahun; kehadiran tim; ringkasan (tepat waktu %, telat, dll); kartu per-karyawan urut ID; klik kartu → buka detail karyawan.

### B.3 Aturan absen (telat)
- [ ] Clock in ≤ 09:00 → **tepat waktu**; > 09:00 → **telat** (dasbor, riwayat, laporan konsisten).
- [ ] Jam kerja tetap dihitung dari **08:30** (bukan 09:00).

---

## Bagian C — Integritas data & edge case
- [ ] Dobel clock-in di hari yang sama → tetap 1 baris (upsert).
- [ ] Cancel cuti approved sebelum mulai → kuota kembali.
- [ ] Founder AII001 dikecualikan dari statistik.
- [ ] Ganti bahasa ID/EN → semua label ikut (termasuk jenis cuti & error baru).
- [ ] Storage foto: ukuran wajar (~30–60 KB, sudah di-resize 720px).
- [ ] Refresh/putus jaringan saat absen → tak ada state korup; pesan error jelas.

---

## Log hasil
| # | Skenario | Peran | Hasil | Catatan / isu |
|---|----------|-------|-------|----------------|
|   |          |       |       |                |

**Ringkasan sign-off:** lolos / lolos bersyarat / gagal — tanggal ____, oleh ____.
