# REKOMENDASI PENGEMBANGAN DAN EVOLUSI ARSITEKTUR PLATFORM CEKARA (2026–2027)
**Cetak Biru Rekayasa Sistem, Tata Kelola Keamanan Siber, Skalabilitas Performa, dan Integrasi Ekosistem Nasional**

---

### Dokumen Metadata

| Atribut | Informasi |
|---|---|
| **Judul Dokumen** | Cetak Biru Rekomendasi Peningkatan Platform Cekara (Requirement R3) |
| **Versi Dokumen** | v1.0.0 (Comprehensive Strategic Edition) |
| **Tanggal Terbit** | 10 November 2026 |
| **Klasifikasi** | Dokumen Rekayasa Perangkat Lunak & Keamanan Siber (Internal & Stakeholder) |
| **Penulis** | Tim Rekayasa & Arsitektur Sistem Cekara (*Cekara Engineering Core*) |
| **Status Dokumen** | **FINAL / APPROVED FOR IMPLEMENTATION** |
| **Target Pembaca** | Engineering Leads, Software Architects, Security Officers (SecOps), Product Managers |

---

## 1. Ringkasan Eksekutif (Executive Summary)

### 1.1 Latar Belakang & Lanskap Ancaman Digital Indonesia
Di era percepatan transformasi digital nasional, kejahatan siber berbasis manipulasi psikologis (*social engineering*) telah berevolusi menjadi ancaman sistemik yang merugikan masyarakat Indonesia hingga triliunan rupiah setiap tahunnya. Berdasarkan data agregat insiden penipuan digital nasional, modus operandi kejahatan siber mengalami pergeseran signifikan:
1. **Sniffing Malware Berkedok APK:** Penyebaran paket aplikasi Android jahat yang menyamar sebagai undangan pernikahan digital, resi kurir pengiriman paket (*tracking fake*), surat tilang elektronik kepolisian (ETLE), hingga pemberitahuan pajak palsu yang bertujuan mencuri kredensial SMS OTP dan membobol rekening *mobile banking*.
2. **Phishing Perbankan & Fintech:** Duplikasi identitas visual perbankan resmi dengan memanfaatkan teknik *typosquatting*, pengalihan tautan singkat (*URL shortener*), serta *homoglyph spoofing* untuk menguras saldo dompet digital.
3. **Sindikat Penipuan Tugas & Loker Paruh Waktu (*Task Scam*):** Manipulasi bertahap melalui grup Telegram dan WhatsApp yang menjanjikan imbalan setelah menyukai video atau menyetor deposit modal awal.
4. **Kebocoran Identitas & Sindikat Pinjaman Ilegal:** Eksploitasi foto KTP dan swafoto korban untuk pengajuan pinjaman online ilegal atau pembukaan rekening penampung (*mule account*).
5. **Ancaman Deepfake & Kloning Suara (*AI Voice Vishing*):** Modus telepon darurat tiruan suara anggota keluarga yang meminta tebusan cepat atau biaya rumah sakit darurat.

Platform **Cekara** lahir sebagai garda depan perlindungan siber sipil (*Civilian Cyber-Defense Platform*) di Indonesia. Dengan memadukan kecerdasan buatan multi-modal, respons krisis terstruktur, dan jaringan pertahanan komunitas, Cekara mengusung misi mulia: **"Menjadi Guardian Terpercaya di Ruang Digital bagi Setiap Keluarga Indonesia."**

### 1.2 Urgensi Peningkatan Berkelanjutan
Meskipun Cekara saat ini telah memiliki fondasi rekayasa modern yang sangat solid—berbasis **Laravel 12 (PHP 8.4)**, **Inertia.js v3**, **React 19**, **Tailwind CSS v4**, dan **Laravel Reverb**—pertumbuhan ancaman penipuan yang kian terorganisir menuntut platform untuk tidak berpuas diri pada deteksi statis. 

Platform harus bertransformasi dari sekadar alat uji reaktif (*reactive scanner*) menjadi **ekosistem intelijen ancaman proaktif (*proactive threat intelligence ecosystem*)** yang mampu meredam serangan bot otomatis, memvalidasi bukti digital secara hukum, menyinkronkan data dengan regulator nasional, serta melayani jutaan masyarakat dengan latensi sub-detik tanpa membebani biaya komputasi kecerdasan buatan (*AI inference cost*).

### 1.3 Sasaran Strategis (Strategic Goals)
Dokumen ini menetapkan 4 pilar evolusi teknis untuk periode 2026–2027:
- **Pilar Fitur:** Menutup celah isolasi intelijen dengan mengintegrasikan basis data nasional (Kominfo, CekRekening.id, Google Safe Browsing), membangun moderasi terdesentralisasi komunitas berbasis reputasi Guardian, meluncurkan generator berkas bukti digital berstandar kepolisian (STPL Forensic PDF), menghadirkan ekstensi peramban Cekara Shield, serta mengantisipasi ancaman vishing suara AI.
- **Pilar Keamanan:** Menutup kerentanan pendaftaran bot melalui integrasi **Google reCAPTCHA v2 Checkbox**, menegakkan autentikasi dua faktor (2FA/TOTP) untuk akun sensitif, menerapkan pembersihan metadata EXIF citra dan pemindaian malware (ClamAV), menegakkan *tiered token-bucket rate limiting* berbasis Redis, menyusun jejak audit admin yang *tamper-proof*, serta memperketat kebijakan HTTP Content Security Policy (CSP).
- **Pilar Performa:** Memangkas 65%+ biaya API LLM dan menurunkan waktu respons pemindaian berulang ke < 20 ms menggunakan *Semantic & Hash-Based Caching*, mengalihkan inferensi citra resolusi tinggi ke antrean asinkron (*asynchronous queue worker*), serta menerapkan indeks pencarian teks penuh (*Full-Text Search*) pada radar komunitas.
- **Pilar Arsitektur:** Memodularisasi arsitektur menuju *Domain-Driven Design* (DDD), membuka *Open API Gateway* terotentikasi dan webhook untuk integrasi langsung perbankan/fintech, serta menanamkan observabilitas penuh (*Full-Stack APM & OpenTelemetry*).

---

## 2. Arsitektur & Fitur Platform Cekara Saat Ini

### 2.1 Ringkasan Topologi Sistem Eksisting
Arsitektur Cekara dibangun di atas arsitektur monolitik modern berperforma tinggi yang memisahkan lapisan penyajian (*frontend presentation*) dan lapisan logika bisnis (*backend application core*) melalui jembatan reaktif Inertia.js v3:

```
+-----------------------------------------------------------------------------------+
|                            LAPISAN KLIEN (FRONTEND)                               |
|   React 19 + TypeScript + Tailwind CSS v4 + Wayfinder Route Bindings + Lucide     |
|   Inertia.js v3 Client SPA (Zero-API Overhead) + Canvas Three.js / Vanta Graphics |
+------------------------------------------+----------------------------------------+
                                           | HTTP Requests & Page Hydration
                                           v
+-----------------------------------------------------------------------------------+
|                        LAPISAN APLIKASI (LARAVEL 12 / PHP 8.4)                    |
|  - Routing Engine & Middleware (Web, Auth, MustVerifyEmail, EnsureUserIsAdmin)    |
|  - Controllers: ChatController, EmergencyActionController, CommunityRadar, dsb.   |
|  - Domain Services: LlmManager, UrlPhishingScanner, EmergencyGuidanceService      |
+-------------------+----------------------+--------------------+-------------------+
                    |                      |                    |
                    v                      v                    v
         +--------------------+  +-------------------+  +-------------------+
         | PERSISTENSI DATA   |  | REAL-TIME REVERB  |  | ENGINE AI/LLM     |
         | SQLite / MySQL     |  | WebSocket Server  |  | Multi-Provider    |
         | Relasional DB      |  | Channel: radar    |  | Failover Manager  |
         | Eloquent Models    |  | Pusher Protocol   |  | Gemini / OpenAI   |
         +--------------------+  +-------------------+  +-------------------+
```

### 2.2 Evaluasi Komprehensif Pilar Eksisting

#### A. Pilar RECOGNIZE: Multi-Modal Scam Scanning & Phishing Detection
Pilar pemindaian ancaman beroperasi melalui controller `app/Http/Controllers/ChatController.php` dengan rute `/chat/analyze` dan `/api/chat/analyze`:
- **Masukan Multi-Modal:**
  1. *Plaintext:* Teks pesan SMS, WhatsApp, atau email mencurigakan (validasi panjang 3 hingga 10.000 karakter).
  2. *Ekstraksi URL Otomatis:* Algoritma regex memindai tautan di dalam pesan (`/https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:!?()]/i`).
  3. *Citra Tangkapan Layar (Vision):* Berkas citra (JPG, PNG, WebP hingga 5 MB) divalidasi MIME type dan dimensinya, disimpan ke `storage/app/public/scans/`, lalu dikonversi ke *base64 data URI* untuk disalurkan ke model Vision LLM.
- **Arsitektur Multi-Provider LLM (`app/Services/Llm/LlmManager.php`):**
  - Mengelola *dynamic failover* berantai: Memilih provider aktif di database (`LlmProvider`), jika terjadi kegagalan API eksternal (status 404, 429, 503, timeout) sistem otomatis beralih ke provider cadangan yang terkonfigurasi, dan jika seluruh jaringan eksternal terputus beralih ke `MockLlmDriver`.
  - Pada lingkungan pengujian (`testing`), `MockLlmDriver` otomatis diaktifkan untuk mencegah konsumsi kredit berbayar dan menjamin pengujian deterministik.
  - Driver terintegrasi: `GeminiDriver` (model `gemini-1.5-flash`, `gemini-2.5-flash`, `gemini-3.5-flash-lite` dengan *system prompt* anti-halusinasi keamanan siber Indonesia), `OpenAiDriver` (`gpt-4o-mini`), `CustomRouterDriver` (LiteLLM/OpenAI-compatible), dan `MockLlmDriver` (mesin heuristik offline berbasis kata kunci modus lokal).
- **Mesin Deteksi Phishing Heuristik (`app/Services/Security/UrlPhishingScanner.php`):**
  - Menguji domain terhadap daftar putih perbankan resmi (BCA, Mandiri, BRI, BNI, CIMB), fintech (DANA, OVO, GoPay, ShopeePay), dan domain pemerintah (`.go.id`).
  - Mendeteksi 10 layanan penyingkat URL (`bit.ly`, `s.id`, dll.), 20 TLD berisiko tinggi (`.xyz`, `.top`, `.tk`, dll.), peniruan merek (*brand impersonation*), *punycode/homoglyph* (`xn--`), direct IP hostname, dan tautan unduhan langsung berkas bahaya (`.apk`, `.exe`).
- **Investigasi Publik Berbagi-Pakai (`/scans/{public_id}`):**
  - Setiap hasil pemindaian disimpan di tabel `scans` dengan kolom UUID unik `public_id`, memungkinkan pengguna membagikan tautan investigasi lengkap ke kerabat atau media sosial.

#### B. Pilar ACT: Emergency Response Action Center
Pilar tanggap darurat (`EmergencyActionController`, `EmergencyGuidanceService`, `resources/js/pages/emergency/index.tsx`) bertindak sebagai protokol penanganan insiden darurat bagi korban kejahatan siber:
- **Playbook Penyelamatan Krisis Golden Time:**
  1. *Kasus 1: Terlanjur Menginstal Berkas APK Jahat* (Golden Time < 5 Menit: Putus koneksi seluler/WiFi via Airplane Mode, cabut izin Admin Perangkat / Aksesibilitas, copot instalasi aplikasi, blokir akun m-banking via call center, batalkan pengalihan panggilan GSM `##002#`, factory reset aman).
  2. *Kasus 2: Terlanjur Mentransfer Dana ke Rekening Penipu* (Golden Hour < 60 Menit: Hubungi bank pengirim untuk terbitkan tiket aduan siber & pembekuan rekening penampung, himpun bukti transaksi mutasi, laporkan ke portal resmi CekRekening.id & AduanKonten.id, buat STPL di SPKT Kepolisian terdekat).
  3. *Kasus 3: Data KTP & Identitas Pribadi Bocor* (Mitigasi < 24 Jam: Periksa riwayat pinjaman di iDebku SLIK OJK, laporkan penyalahgunaan ke Satgas PASTI OJK 157, buat Surat Keterangan Lapor Kehilangan/Penyalahgunaan Identitas di kantor polisi sebagai benteng hukum, terapkan watermark digital tebal pada dokumen identitas).
- **Checklist Interaktif Persisten:**
  - Pengguna terautentikasi dapat menandai setiap langkah checklist darurat yang telah diselesaikan. Progres tersimpan secara persisten di tabel `emergency_checklist_progress`.
- **AI Live Tab Inspector (Pemeriksa Tab Browser Langsung):**
  - Menggunakan Web Screen Capture API (`navigator.mediaDevices.getDisplayMedia`) untuk mengambil tangkapan layar tab situs yang sedang dibuka pengguna secara lokal, merendernya ke kanvas WebP terkompresi, dan mengirimkannya ke endpoint analisis Cekara tanpa membutuhkan software pihak ketiga.
- **Generator Peringatan Darurat WhatsApp:**
  - Menghasilkan format pesan peringatan instan siap kirim untuk audiens Keluarga, Komunitas/Warga, atau Publik, dilengkapi tombol tautan langsung `wa.me/?text=...`.

#### C. Pilar COMMUNITY: Community Radar & Real-Time Threat Discussion
Pilar komunitas (`CommunityRadarController`, `resources/js/pages/radar/index.tsx`) berfungsi sebagai sensor ancaman berbasis warga:
- **Feed Radar Ancaman Terverifikasi:**
  - Menampilkan daftar modus penipuan aktif berdasarkan kategori (`apk_malware`, `phishing_banking`, `fake_job`, `social_engineering`, `fake_giveaway`) dan platform (WhatsApp, Telegram, SMS, FB, dll.).
  - Tombol konfirmasi *"Saya Juga Mengalami Ini"* (`/radar/{pattern}/upvote`) yang memancarkan event WebSocket `CommunityAlertUpvoted`.
- **Ruang Diskusi Interaktif (Discussion Rooms):**
  - Pengguna terautentikasi dapat membuat ruang obrolan terisolasi untuk mendiskusikan modus tertentu, dibatasi kuota maksimal 3 ruang per hari per pengguna (`MAX_DAILY_ROOMS_PER_USER`) untuk mencegah spam.
- **Interaksi Percakapan Real-Time:**
  - Mendukung format Markdown, unggah lampiran gambar ke disk publik, serta penempelan gambar langsung dari clipboard (*paste from clipboard*).
  - Sistem reaksi emoji real-time dengan event broadcast `CommunityMessageReacted`.
  - Infrastruktur real-time ditenagai oleh **Laravel Reverb** (`channel: community.radar`) dengan mekanisme cadangan **HTTP delta-sync polling** (`/radar/sync`) jika koneksi WebSocket terganggu.
- **Kontribusi Modus Baru:**
  - Pengguna dapat mengirimkan kontribusi modus penipuan baru (`ScamPatternContribution`). Kontribusi admin langsung terbit terverifikasi, sementara kontribusi pengguna biasa berstatus `is_verified = false`.

#### D. Pilar LEARN & FAMILY: Edukasi Simulasi & Panduan Keluarga
Pilar pembelajaran (`SimulationController`, `FamilyGuardianController`, `GuardianStatusService`):
- **Simulasi Interaktif & Thinking Phase:**
  - Menghadirkan simulasi percakapan realistis di mana pengguna dihadapkan pada pilihan keputusan kritis. 
  - Umpan balik membedah manipulasi psikologis (*Urgency*, *Authority Bias*, *Sunk Cost Fallacy*), indikator bahaya (*Red Flags*), dan prinsip pencegahan.
- **Sistem Peringkat Guardian:**
  - Pengguna mengumpulkan pengalaman belajar melalui evaluasi skor rata-rata dan rasio kelulusan: *Pemula Digital* $\rightarrow$ *Kadet Pengawas* $\rightarrow$ *Guardian Waspada* $\rightarrow$ *Master Guardian* (skor rata-rata $\ge 85$ dan tuntas minimal 4 skenario).
- **Toolkit Keluarga & Kuis Kerentanan:**
  - Lembar panduan cetak Aturan Emas 3T: **TENANG**, **TELEPON LANGSUNG**, **TANYA GUARDIAN**.
  - Kuis kerentanan keluarga 5 pertanyaan untuk memetakan indeks risiko anggota keluarga.

#### E. Autentikasi, Akun & Panel Administrasi
- **Autentikasi Breeze & Verifikasi Email (`MustVerifyEmail`):**
  - Mewajibkan konfirmasi kepemilikan alamat email melalui *cryptographically signed URL*. Pengiriman notifikasi email menerapkan penanganan tangguh dengan fallback otomatis ke driver `log` lokal apabila gateway email pihak ketiga (Resend) mengalami gangguan jaringan.
- **Panel Manajemen LLM Provider (`/admin/llm-providers`):**
  - Diproteksi middleware `EnsureUserIsAdmin`. Kunci API (`api_key`) dienkripsi pada level database (`'api_key' => 'encrypted'`) dan dimaskir saat dikirimkan ke peramban. Pergantian provider aktif dieksekusi secara aman menggunakan transaksi database atomik.

---

## 3. Analisis Kesenjangan & Peluang Peningkatan (Gap Analysis)

Berdasarkan investigasi menyeluruh pada arsitektur kode dan skema basis data, berikut adalah matriks kesenjangan yang ditemukan:

| Dimensi | Kondisi Saat Ini (Current State) | Risiko & Celah Operasional | Dampak Bisnis / Keamanan | Peluang Solusi Strategis |
|---|---|---|---|---|
| **Fitur (F1)** | Daftar domain whitelist, TLD berisiko, dan URL shortener didefinisikan dalam array PHP statis di `UrlPhishingScanner.php`. | Tautan phishing baru atau domain situs penipuan lokal tidak terdeteksi sebelum tim melakukan deployment manual. | Tingkat deteksi menurun terhadap variasi serangan domain baru. | Sinkronisasi otomatis terjadwal (`threat:sync`) dengan TrustPositif Kominfo, CekRekening.id, dan Google Safe Browsing API. |
| **Fitur (F2)** | Verifikasi kontribusi radar bersifat terpusat biner: hanya admin (`is_admin`) yang laporannya otomatis terverifikasi; laporan warga tertahan di `is_verified = false`. | Laporan warga menumpuk dan terlambat dipublikasikan saat admin lambat memoderasi. | Radar ancaman terlambat menyebarkan peringatan penipuan viral. | Sistem konsensus desentralisasi: verifikasi peer-to-peer berbasis reputasi pengguna berperingkat *Master Guardian*. |
| **Fitur (F3)** | Korban penipuan di pusat tanggap darurat harus mengumpulkan tangkapan layar, kronologi, dan nomor rekening secara manual untuk melapor ke polisi/bank. | Bukti digital rawan ditolak SPKT Kepolisian karena format tidak rapi dan tidak memiliki jaminan integritas hash forensik. | Korban kesulitan menuntut hak dan proses hukum terhambat. | Fitur 1-klik generator Dokumen Berkas Forensik Digital (PDF STPL) dengan segel hash SHA-256 dan stempel waktu kriptografis. |
| **Fitur (F4)** | Pengguna harus membuka situs Cekara dan membagikan layar tab peramban secara sadar melalui AI Live Tab Inspector. | Gesekan adopsi (*high friction*) bagi pengguna awam saat berselancar di web atau membuka WhatsApp Web. | Perlindungan bersifat pasif, bukan *on-the-fly*. | Ekstensi peramban ringan (*Cekara Shield*) berbasis Manifest V3 dengan inspeksi tautan pasif dan tombol klik-kanan WhatsApp Web. |
| **Fitur (F5)** | Deteksi multi-modal terbatas pada teks dan gambar tangkapan layar. | Tidak mampu mengantisipasi penipuan panggilan telepon/pesan suara deepfake kloning suara kerabat (*vishing*). | Korban rentan tertipu panggilan darurat palsu. | Analisis vishing audio: transkripsi Whisper AI + deteksi anomali spektrogram sintesis suara AI. |
| **Keamanan (S1)** | Formulir registrasi pengguna belum memiliki mekanisme mitigasi bot (diselesaikan pada R1-R2). | Botnet dapat melakukan *credential stuffing*, pendaftaran massal, dan *resource exhaustion*. | Database membengkak dan server kehabisan kuota email. | Implementasi Google reCAPTCHA v2 Checkbox di frontend dan backend dengan validasi token ketat. |
| **Keamanan (S2)** | Akses akun administrator ke panel kredensial LLM hanya diproteksi kata sandi tunggal. | Kompromi kata sandi admin (lewat phishing atau malware keylogger) mengekspos kunci API berbayar. | Kerugian finansial penyalahgunaan kuota AI bernilai jutaan rupiah. | Penegakan wajib Autentikasi Dua Faktor (2FA / TOTP) untuk akun administrator dan Master Guardian. |
| **Keamanan (S3)** | Pembatasan laju (*rate limiting*) pada endpoint analisis hanya menggunakan limiter dasar `throttle:60,1`. | Pengguna anonim (tamu) dapat menghabiskan kuota inferensi LLM yang mahal dalam waktu singkat. | Biaya tagihan API membengkak dan potensi DoS pada server. | Kebijakan *Tiered Rate Limiting* berbasis Redis: Tamu (10/jam), Pengguna Terdaftar (60/jam), Bypass untuk playbook darurat. |
| **Keamanan (S4)** | Berkas citra disimpan langsung ke disk publik setelah pemeriksaan ekstensi dan ukuran berkas. | Metadata EXIF (koordinat GPS rumah, model gawai) terekspos ke publik; risiko malware tersembunyi (*polyglot files*). | Kebocoran privasi fisik korban dan risiko injeksi malware ke sistem. | *EXIF stripping pipeline* otomatis dan sandboxing berkas dengan antivirus daemon (ClamAV). |
| **Keamanan (S5)** | Perubahan konfigurasi provider AI dan aktivasi model di `/admin/llm-providers` tidak meninggalkan riwayat catatan audit. | Ketiadaan jejak digital jika terjadi pergantian kunci API secara tidak sah oleh staf internal. | Kegagalan audit kepatuhan dan forensik internal. | Penyusunan tabel append-only `admin_audit_logs` untuk mencatat identitas admin, timestamp, IP, dan payload aksi. |
| **Keamanan (S6)** | Belum ada Content Security Policy (CSP) dan HTTP security headers yang ketat di tingkat middleware. | Rentan terhadap serangan Cross-Site Scripting (XSS), Clickjacking, atau penyuntikan skrip eksternal liar. | Kompromi sesi browser pengguna dan pencurian data pribadi. | Penambahan middleware keamanan HTTP: CSP kaku, HSTS 1 tahun, X-Frame-Options: DENY, X-Content-Type-Options: nosniff. |
| **Performa (P1)** | Permintaan pemindaian teks yang identik (misal pesan APK viral) selalu memicu panggilan API LLM baru secara penuh. | Panggilan ganda yang tidak efisien, latensi lambat (2-5 detik), dan pemborosan biaya token API berulang. | Biaya operasional tinggi dan respons lambat pada jam sibuk. | *Semantic & Hash-Based Caching* multi-tier berbasis Redis (`sha256(normalized_text)`). |
| **Performa (P2)** | Pemindaian citra resolusi tinggi berjalan sinkron dalam satu siklus HTTP request. | Risiko request timeout (HTTP 504) jika model Vision LLM merespons lebih dari 20 detik pada jam beban puncak. | Pengalaman pengguna buruk dan hilangnya kepercayaan pengguna. | Pola pemrosesan asinkron antrean (*Asynchronous Queue Worker*) dengan notifikasi instan via WebSocket Reverb. |
| **Performa (P3)** | Pencarian laporan dan pesan pada Community Radar menggunakan query SQL standar `LIKE '%search%'`. | Query lambat (*full table scan*) saat volume laporan mencapai ratusan ribu baris. | Beban CPU basis data tinggi dan UI terasa lambat. | Penerapan indeks *Full-Text Search* (FTS) atau integrasi mesin pencari Laravel Scout (Meilisearch). |
| **Performa (P4)** | Modul grafis Three.js dan Vanta.js dibundel dalam bundle JavaScript utama aplikasi. | Ukuran unduhan awal (*First Contentful Paint*) berat bagi pengguna dengan koneksi internet seluler lambat. | Pentalan pengguna (*bounce rate*) tinggi di wilayah dengan jaringan 3G/4G terbatas. | *Dynamic code-splitting* (React `lazy()`) untuk komponen 3D dan konversi otomatis citra ke WebP/AVIF. |
| **Arsitektur (A1)** | Sebagian logika bisnis (validasi, pemrosesan citra, orkestrasi model) masih menyatu di lapisan Controller. | Pelanggaran *Single Responsibility Principle* yang menyulitkan pengujian unit dan pemeliharaan jangka panjang. | Siklus pengembangan melambat dan regresi bug meningkat. | Refaktorisasi modular mengadopsi *Domain-Driven Design* (DDD) dengan pemisahan Domain, Services, Actions, dan DTOs. |
| **Arsitektur (A2)** | Belum tersedia antarmuka integrasi terprogram (Open API / Webhook) untuk ekosistem luar. | Lembaga perbankan, fintech, dan e-commerce tidak dapat menyematkan detektor penipuan Cekara ke sistem mereka. | Cekara terisolasi dari ekosistem perbankan nasional. | Penyediaan Open API Gateway terotentikasi (Laravel Sanctum) dan sistem webhook notifikasi pembekuan rekening. |
| **Arsitektur (A3)** | Pemantauan sistem hanya mengandalkan file log monolog standar Laravel. | Ketiadaan metrik performa real-time, kesulitan melacak lonjakan latensi LLM atau kegagalan worker antrean. | Deteksi insiden lambat (*Mean Time to Detect* tinggi). | Penerapan observabilitas penuh: OpenTelemetry tracing, Sentry APM error tracker, dan Laravel Horizon / Pulse. |

---

## 4. Pilar Rekomendasi 1: Peningkatan Fitur (Feature Enhancements)

```
+--------------------------------------------------------------------------------------------------+
|                              PILAR REKOMENDASI 1: PENINGKATAN FITUR                              |
+--------------------------------+---------------------------------+-------------------------------+
| F1. Threat Intel Auto-Sync     | F2. P2P Community Moderation    | F3. 1-Click Forensic Dossier  |
| - Kominfo TrustPositif Sync    | - Guardian Reputation Consensus | - Standar Bukti ISO/IEC 27037 |
| - CekRekening.id Scraper/API   | - Web of Trust Tiering          | - Segel Kriptografis SHA-256  |
| - Google Safe Browsing API v4  | - Anti-Sybil Validation Rules   | - Draf STPL SPKT & Surat Bank |
+--------------------------------+---------------------------------+-------------------------------+
| F4. Cekara Shield Extension    | F5. Voice Vishing Detector      | F6. Institutional Education   |
| - Manifest V3 Browser Plugin   | - Whisper Audio Transcription   | - Cekara untuk Kampus/Sekolah |
| - Passive Background Checking  | - Spectral Anomaly Analysis     | - Mass Phishing Cyber Drills  |
| - In-Chat WhatsApp Web Scanner | - Emergency Social Eng Scanner  | - Institutional Resilience BI |
+--------------------------------+---------------------------------+-------------------------------+
```

### 4.1 F1: Sinkronisasi Intelijen Ancaman Nasional (Threat Intelligence Sync)
Alih-alih mengandalkan daftar statis di `UrlPhishingScanner.php`, platform Cekara direkomendasikan mengimplementasikan pipeline penyerapan data intelijen (*threat intelligence ingestion pipeline*) yang berjalan secara otomatis:
- **Sumber Data Terintegrasi:**
  1. *Kominfo TrustPositif:* Mengunduh daftar domain berbahaya dan terblokir secara berkala.
  2. *CekRekening.id:* Basis data rekening bank dan nomor telepon yang dilaporkan terlibat penipuan.
  3. *Google Safe Browsing API v4 & PhishTank:* Memeriksa reputasi domain terhadap basis data ancaman global.
- **Spesifikasi Teknis Skema Basis Data:**
  ```sql
  CREATE TABLE threat_indicators (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      indicator_type ENUM('domain', 'ip', 'phone_number', 'bank_account', 'apk_hash') NOT NULL,
      indicator_value VARCHAR(255) NOT NULL,
      threat_category ENUM('phishing', 'malware', 'banking_fraud', 'illegal_lender', 'task_scam') NOT NULL,
      risk_score TINYINT UNSIGNED DEFAULT 95,
      source ENUM('kominfo_trustpositif', 'cekrekening', 'google_safebrowsing', 'community_consensus') NOT NULL,
      metadata JSON NULL,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_indicator (indicator_type, indicator_value),
      INDEX idx_lookup (indicator_value, is_active)
  );
  ```
- **Arsitektur Performa:**
  Seluruh indikator aktif diekspor ke dalam struktur data **Redis Bloom Filter** atau **Redis Set** (`threats:bloom`). Pengecekan terhadap ratusan ribu indikator ancaman dapat dieksekusi dengan kompleksitas $O(1)$ dan latensi $< 1$ milidetik sebelum mengeksekusi analisis LLM yang lebih mahal.
- **Scheduled Command:**
  Menjadwalkan perintah `php artisan threat:sync` yang dieksekusi setiap malam pukul 02:00 WIB via Laravel Scheduler.

### 4.2 F2: Konsensus Verifikasi Laporan Komunitas Berbasis Reputasi Guardian
Mekanisme validasi laporan komunitas yang saat ini hanya mengandalkan admin dapat dialihkan ke sistem verifikasi terdesentralisasi (*peer-to-peer reputation consensus*):
- **Struktur Hak Suara Berdasarkan Pangkat Guardian:**
  - *Pemula Digital / Kadet Pengawas:* Pengguna pelapor (hak kirim kontribusi, bobot verifikasi = 0).
  - *Guardian Waspada:* Hak verifikasi awal (bobot suara = 1).
  - *Master Guardian:* Hak kurasi utama (bobot suara = 3).
- **Formula Konsensus Otomatis:**
  Suatu laporan modus penipuan warga (`ScamPatternContribution`) otomatis dipromosikan menjadi status terverifikasi (`is_verified = true`) dan diterbitkan ke feed utama Radar jika:
  $$\text{Skor Konsensus} = \sum_{i=1}^{n} (\text{Bobot Suara}_i \times \text{Validasi}_i) \ge 6$$
  *(Contoh: 2 Master Guardian setuju, atau 1 Master Guardian + 3 Guardian Waspada setuju).*
- **Perlindungan Anti-Sybil & Anti-Kolusi:**
  - Batas maksimal 5 aksi verifikasi per hari per akun Guardian.
  - Pembatasan alamat IP: Verifikasi dari subnet IP yang sama dengan pembuat laporan otomatis dianulir.
  - Insentif Reputasi: Guardian yang berpartisipasi dalam kurasi akurat memperoleh lencana eksklusif *"Community Defender of the Month"*.

### 4.3 F3: Generator Berkas Bukti Digital STPL Kepolisian (1-Click Forensic Dossier PDF)
Saat menjadi korban penipuan, masyarakat sering kebingungan menyusun laporan yang dapat diterima oleh Sentra Pelayanan Kepolisian Terpadu (SPKT) Polri atau bagian *Fraud Desk* perbankan.
- **Standar Integritas Bukti Digital (ISO/IEC 27037):**
  Platform Cekara akan mengotomatisasi penyusunan berkas PDF resmi berbobot hukum yang memuat:
  1. *Lembar Muka Laporan Resmi:* Berisi identitas pelapor, tanggal/waktu insiden, estimasi kerugian nominal, serta nomor referensi registrasi Cekara.
  2. *Kronologi Kejadian Terstruktur:* Rangkuman bertanggal dari awal kontak penipu hingga terjadinya transaksi/pemasangan APK.
  3. *Tabel Identitas Terlapor:* Nomor rekening bank penampung, nama pemilik rekening, nama bank, nomor WhatsApp/Telegram terlapor, tautan phishing, dan ID grup sindikat.
  4. *Lampiran Bukti Teranotasi:* Tangkapan layar percakapan dan bukti mutasi transfer yang telah ditandai indikator bendera merah (*Red Flag Badges*).
  5. *Segel Kriptografis:* Setiap gambar dan dokumen dilampirkan dengan nilai hash **SHA-256** dan *timestamp* waktu pengunggahan, untuk memastikan keaslian bukti digital tidak mengalami rekayasa (anti-tampering).
  6. *Draf Surat Permohonan Pemblokiran Bank & STPL Kepolisian:* Surat pengantar resmi yang siap ditandatangani pelapor di hadapan petugas penyidik SPKT.
- **Implementasi Teknis:** Ditenagai oleh engine PDF modern (`spatie/laravel-pdf` berbasis Chromium headless atau `barryvdh/laravel-dompdf`), dokumen dilengkapi kode QR verifikasi publik untuk validasi keaslian berkas oleh penyidik kepolisian.

### 4.4 F4: Ekstensi Peramban Cekara Shield (Chrome & Firefox Extension)
Untuk menghilangkan hambatan pengguna harus secara manual membuka aplikasi web dan membagikan layar tab:
- **Teknologi:** Dibangun menggunakan standar **WebExtensions Manifest V3**.
- **Kapabilitas Utama:**
  - *Passive Threat Shield:* Memeriksa setiap nama domain yang dikunjungi peramban pengguna secara offline terhadap Redis Bloom Filter lokal yang disinkronkan setiap 6 jam. Menampilkan spanduk peringatan merah instan (*Interstitial Warning Screen*) sebelum halaman berbahaya termuat.
  - *WhatsApp Web Integration:* Menyematkan lencana keamanan (*Shield Badge*) tepat di samping pesan teks yang memuat tautan mencurigakan atau lampiran berkas `.apk` pada antarmuka WhatsApp Web.
  - *One-Click Context Menu:* Klik kanan pada teks atau gambar di web manapun $\rightarrow$ Pilih *"Analisis Ancaman dengan Cekara"* $\rightarrow$ Menampilkan sidebar analisis instan tanpa meninggalkan halaman aktif.

### 4.5 F5: Deteksi Scam Suara & Deepfake Telepon (Audio Vishing Analyzer)
Menghadapi tren penipuan kloning suara berbasis kecerdasan buatan (*voice cloning*):
- **Alur Kerja Pemrosesan:**
  1. Pengguna mengunggah rekaman panggilan telepon mencurigakan atau pesan suara WhatsApp (.ogg, .mp3, .wav, maks 10 MB).
  2. Lapisan 1: Mesin **OpenAI Whisper / Fast-Whisper** mengekstrak transkripsi teks percakapan.
  3. Lapisan 2: Teks transkrip dianalisis oleh `LlmManager` untuk mendeteksi indikator manipulasi psikologis vishing (pencatutan nama kerabat, desakan waktu, penahanan oleh oknum aparat, larangan menghubungi keluarga lain).
  4. Lapisan 3: Analisis fitur akustik spektrogram mendeteksi anomali artefak frekuensi tinggi khas model *neural text-to-speech* (mel-spectrogram consistency check).
  5. Hasil akhir menggabungkan skor bahaya manipulasi verbal dan probabilitas suara sintetis AI.

### 4.6 F6: Platform Edukasi Institusional ("Cekara Kampus & Korporasi")
Memperluas jangkauan pilar LEARN dari tingkat keluarga ke tingkat organisasi:
- Memungkinkan administrator kampus, universitas, atau institusi pemerintah mendaftarkan grup anggota.
- Menjalankan simulasi penipuan berkala (*simulated phishing drill*) via email dan WhatsApp untuk mengukur indeks kesiapan siber (*Cyber Resilience Index*) civitas akademika tanpa membahayakan data sensitif.

---

## 5. Pilar Rekomendasi 2: Penguatan Keamanan & Kepatuhan (Security & Compliance)

```
+--------------------------------------------------------------------------------------------------+
|                            PILAR REKOMENDASI 2: KEAMANAN & KEPATUHAN                             |
+--------------------------------+---------------------------------+-------------------------------+
| S1. Multi-Layer Bot Defense    | S2. Mandatory Admin 2FA (TOTP)  | S3. Tiered Token Bucket Redis |
| - Google reCAPTCHA v2 Checkbox | - RFC 6238 Time-Based OTP       | - Anonymous: 10 req/hr        |
| - Cloudflare Turnstile Ready   | - Enforced for All Admin Roles  | - Authenticated: 60 req/hr    |
| - Honeypot Field Fallback      | - Encrypted Recovery Codes      | - Emergency Flow Bypass       |
+--------------------------------+---------------------------------+-------------------------------+
| S4. Image Sanitization & ClamAV| S5. Immutable Admin Audit Logs  | S6. Hardened HTTP Security CSP|
| - Complete EXIF Metadata Strip | - Tamper-Proof Audit Database   | - Strict Content Security Pol |
| - ClamAV Antivirus Daemon Scan | - Track All LLM Config Changes  | - HSTS 31536000 + Subdomains  |
| - Isolated Storage Sandboxing  | - IP, User-Agent, & State Diffs | - Frame & MIME Sniffing Block |
+--------------------------------+---------------------------------+-------------------------------+
```

### 5.1 S1: Implementasi Perlindungan Bot Multi-Lapis (Google reCAPTCHA v2 & Defense-in-Depth)
Sesuai pemenuhan **Requirement R1 dan R2**:
- **Lapisan 1: Google reCAPTCHA v2 Checkbox ("I'm not a robot"):**
  - Mengintegrasikan widget reCAPTCHA v2 interaktif pada formulir registrasi (`resources/js/pages/auth/register.tsx`).
  - Menyediakan penanganan tangguh pada backend (`RegisteredUserController` & `RecaptchaRule`) melalui pemanggilan aman ke `https://www.google.com/recaptcha/api/siteverify` dengan timeout 5 detik dan penanganan pengecualian.
  - Menyediakan fallback kunci pengujian resmi Google (`6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` dan `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`) agar lingkungan pengujian otomatis (`testing`) dan pengembangan lokal tetap berjalan lancar tanpa terputus.
- **Lapisan 2: Honeypot Hidden Fields:**
  - Menambahkan input tersembunyi `website_hp` pada form registrasi yang tidak terlihat oleh pengguna manusia. Bot otomatis yang mengisi field ini akan langsung ditolak secara diam-diam tanpa membebani kuota API reCAPTCHA.

### 5.2 S2: Autentikasi Dua Faktor Wajib (2FA / TOTP) untuk Administrator
Mengingat panel admin (`/admin/llm-providers`) mengelola kunci API komersial berbayar (Gemini, OpenAI) yang sangat bernilai tinggi:
- **Kebijakan:** Menegakkan autentikasi dua faktor berbasis waktu (TOTP RFC 6238, kompatibel dengan Google Authenticator, Microsoft Authenticator, dan 1Password) bagi seluruh pengguna dengan status `is_admin = true`.
- **Alur Implementasi:**
  1. Admin memindai kode QR rahasia saat inisialisasi akun (`pragmarx/google2fa-laravel`).
  2. Kunci rahasia disimpan dalam bentuk terenkripsi (`'google2fa_secret' => 'encrypted'`).
  3. Disediakan 8 kode pemulihan sekali pakai (*one-time recovery codes*) yang di-hash dengan `bcrypt` untuk skenario darurat gawai hilang.
  4. Middleware `EnsureTwoFactorAuthenticated` mencegat seluruh akses ke rute `/admin/*` hingga kode 6-digit diverifikasi.

### 5.3 S3: Kebijakan Pembatasan Laju Bertingkat (Tiered Rate Limiting via Redis)
Untuk menghentikan penyalahgunaan kuota inferensi LLM dan menjaga ketersediaan layanan (*Denial of Service mitigation*):
- **Kebijakan Tingkatan (Tiering Strategy):**
  - **Tamu Anonim (Guest IP):** Maksimal 10 pemindaian per jam. Kuota ditautkan ke *client fingerprint* dan alamat IP.
  - **Pengguna Terdaftar Belum Terverifikasi:** Maksimal 20 pemindaian per jam.
  - **Pengguna Terverifikasi Email (`MustVerifyEmail`):** Maksimal 60 pemindaian per jam.
  - **Akun Master Guardian / Admin:** Maksimal 300 pemindaian per jam.
  - **Jalur Darurat (Emergency Bypass):** Rute tanggap darurat (`/tanggap-darurat`) memiliki kuota khusus tersendiri yang tidak memotong kuota pemindaian rutin untuk memastikan korban krisis tidak terhalang limiter.
- **Arsitektur:** Menggunakan algoritma *Token Bucket* bawaan Redis yang dikonfigurasi melalui `RateLimiter::for('scan-tier', ...)` di `app/Providers/AppServiceProvider.php`.

### 5.4 S4: Sanitasi Berkas Citra & Sandboxing Anti-Malware (EXIF Stripping & ClamAV)
Mencegah kebocoran privasi pengguna dan mencegah masuknya berkas jahat (*polyglot exploits*):
- **Pembersihan Metadata EXIF:**
  Setiap gambar bukti yang diunggah ke rute pemindaian atau pesan komunitas wajib melalui *image sanitation pipeline*:
  ```php
  // Menghapus seluruh tag EXIF (GPS, Serial Number gawai, Timestamp kamera)
  $image = Image::read($uploadedFile->getPathname());
  $image->strip(); // Menghapus seluruh metadata profil kamera & geolokasi
  $cleanImageStream = $image->toWebp(85); // Mengonversi ke format WebP terstandarisasi
  ```
- **Pemindaian Antivirus Terintegrasi (ClamAV):**
  Sebelum berkas disimpan ke penyimpanan jangka panjang, berkas dipindai secara lokal melalui daemon ClamAV (`clamdscan` via socket `/var/run/clamav/clamd.ctl`). Jika terdeteksi signature malware atau berkas executable yang disamarkan (*MIME spoofing*), sistem membatalkan unggahan dan mencatat insiden keamanan ke security log.

### 5.5 S5: Jejak Audit Administrator yang Tak Dapat Dimanipulasi (Immutable Audit Logging)
Setiap modifikasi konfigurasi di tingkat admin wajib dicatat secara transparan:
- **Skema Tabel `admin_audit_logs`:**
  ```sql
  CREATE TABLE admin_audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id BIGINT UNSIGNED NOT NULL,
      action VARCHAR(100) NOT NULL, -- e.g., 'llm_provider.create', 'llm_provider.activate', 'user.ban'
      target_type VARCHAR(100) NULL,
      target_id BIGINT UNSIGNED NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent VARCHAR(500) NOT NULL,
      old_values JSON NULL,
      new_values JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_audit_timeline (admin_id, created_at)
  );
  ```
- **Prinsip Immutability:** Tabel ini bersifat *insert-only*. Akses basis data level aplikasi tidak diberikan izin `UPDATE` atau `DELETE` pada tabel `admin_audit_logs` untuk mencegah manipulasi jejak digital jika akun admin disusupi.

### 5.6 S6: Pengetatan Header Keamanan HTTP & Content Security Policy (CSP)
Menambahkan middleware global `SecurityHeadersMiddleware` untuk melindungi peramban pengguna:
- **Spesifikasi Header Produksi:**
  ```http
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}' https://www.google.com/recaptcha/ https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://www.google.com; connect-src 'self' wss://cekara.id https://www.google.com/recaptcha/ https://api.openai.com https://generativelanguage.googleapis.com; frame-src https://www.google.com/recaptcha/; object-src 'none'; base-uri 'self';
  ```

---

## 6. Pilar Rekomendasi 3: Optimasi Performa & Skalabilitas (Performance & Scalability)

```
+--------------------------------------------------------------------------------------------------+
|                           PILAR REKOMENDASI 3: PERFORMA & SKALABILITAS                           |
+--------------------------------+---------------------------------+-------------------------------+
| P1. Semantic & Hash LLM Cache  | P2. Async Vision Queue Workers  | P3. FTS & Geo Radar Indexing  |
| - Exact Hash Cache: SHA-256    | - Decoupled HTTP 202 Accepted   | - PostgreSQL tsvector / FTS5  |
| - Vector Similarity Match >0.95| - Redis Dedicated Priority Queue| - Spatial Bounding-Box Radius |
| - Cost Reduction Up to 65%     | - Laravel Horizon Worker Cluster| - Cursor-Based Pagination     |
+--------------------------------+---------------------------------+-------------------------------+
| P4. Frontend 3D Asset Splitting| P5. Database Read/Write Split   | P6. Edge CDN Static Caching   |
| - React.lazy() Canvas Loading  | - Replica Connection for Reads  | - Brotli/Gzip Compression     |
| - Automatic AVIF/WebP Pipeline | - Master Connection for Writes  | - Aggressive Asset Hashing    |
| - Memory Leak Disposal Guard   | - Zero Lock Contention on Scans | - Cache-Control Immuntability |
+--------------------------------+---------------------------------+-------------------------------+
```

### 6.1 P1: Multi-Tier Semantic & Hash-Based Caching untuk Analisis Pemindaian
Fenomena kejahatan siber di Indonesia kerap bersifat massal: suatu pesan modus penipuan baru (contoh: *"Undangan Pernikahan Paket APK"* atau *"Surat Tilang ETLE"*) dikirimkan ke ribuan korban dalam hitungan jam.
- **Arsitektur Caching Dua Lapis:**
  1. **Lapis 1: Exact Hash Caching (Latensi < 10 ms):**
     - Sebelum memanggil model LLM, sistem menghitung hash kanonikal dari teks pesan yang telah dinormalisasi (lowercase, hapus spasi ganda, stripping nomor telepon target acak):
       $$\text{Cache Key} = \text{"scan:hash:"} + \text{sha256}(\text{normalized\_text})$$
     - Jika ditemukan di Redis (TTL 14 hari), sistem langsung mengembalikan hasil analisis tanpa memanggil provider AI eksternal. Hal ini memangkas biaya API token hingga 65% dan menghemat ribuan dollar per bulan saat terjadi gelombang spam viral.
  2. **Lapis 2: Semantic Vector Caching (Latensi < 50 ms):**
     - Jika Lapis 1 tidak cocok, sistem memeriksa kemiripan vektor (*cosine similarity*) terhadap basis data vektor teks penipuan yang telah terklasifikasi. Jika nilai kemiripan $\ge 0.95$, hasil inferensi sebelumnya digunakan kembali.
- **Strategi Invalidasi:** Cache otomatis dibersihkan jika admin memperbarui aturan heuristik atau prompt sistem LLM.

### 6.2 P2: Antrean Pemrosesan Asinkron untuk Citra Resolusi Tinggi (Laravel Horizon)
Pemindaian gambar beresolusi tinggi (tangkapan layar penuh smartphone 1080p/4K) yang dieksekusi secara sinkron dapat memakan waktu 15–30 detik pada model vision pihak ketiga, berisiko memicu HTTP 504 Gateway Timeout.
- **Arsitektur Asinkron Non-Blocking:**
  1. Pengguna mengunggah gambar ke `/chat/analyze`.
  2. Server memvalidasi berkas, menyimpan citra ke storage sementara, mencatat entri `scans` berstatus `pending`, lalu merespons dengan **HTTP 202 Accepted** dalam waktu $< 250$ ms bersama `scan_id`.
  3. Job `ProcessScanVisionJob` didorong ke antrean prioritas tinggi Redis (`queue: scans-vision`).
  4. Worker antrean mengeksekusi kompresi, OCR, dan inferensi LLM Vision.
  5. Setelah selesai, status pemindaian diperbarui menjadi `completed` dan hasilnya dipancarkan secara instan ke peramban pengguna melalui saluran privat WebSocket Reverb (`private-scan.{public_id}`).
  6. Frontend Inertia/React secara otomatis memperbarui antarmuka tanpa perlu memuat ulang (*seamless zero-reload update*).
- **Manajemen Worker:** Dikelola dan dipantau melalui **Laravel Horizon** dengan auto-scaling worker cluster (min 3, max 20 worker pada jam beban puncak).

### 6.3 P3: Indeks Full-Text Search (FTS) & Paginasi Kursor pada Radar Komunitas
Seiring bertambahnya volume laporan modus penipuan dan pesan obrolan di pilar COMMUNITY:
- **Pencarian Teks Penuh (Full-Text Search):**
  Menggantikan query lambat `LIKE '%term%'` dengan indeks FTS terdedikasi:
  ```sql
  -- PostgreSQL tsvector Implementation
  ALTER TABLE scam_pattern_contributions ADD COLUMN search_vector tsvector;
  CREATE INDEX idx_scam_search ON scam_pattern_contributions USING GIN(search_vector);
  ```
  Atau mengintegrasikan **Laravel Scout** dengan mesin pencari ringan berlatensi sub-milidetik seperti **Meilisearch**.
- **Paginasi Berbasis Kursor (Cursor-Based Pagination):**
  Menggantikan `offset`/`limit` tradisional dengan kursor ID terurut (`cursorPaginate(20)`). Menghilangkan penurunan performa basis data saat pengguna menelusuri riwayat pesan lama pada ruang diskusi komunitas yang memiliki jutaan baris data.

### 6.4 P4: Optimasi Aset Frontend & Lazy Loading Aset 3D
Untuk memastikan situs Cekara dapat diakses secara cepat oleh masyarakat di daerah dengan kualitas jaringan internet terbatas:
- **Code-Splitting Dinamis:**
  Memisahkan modul grafis berat (Three.js 0.187, Vanta.js, GSAP) dari bundel utama menggunakan pemuatan malas React:
  ```tsx
  const VantaBackground = React.lazy(() => import('@/components/vanta-background'));
  // Komponen dimuat hanya saat viewport peramban pengguna siap
  ```
- **Pembersihan Memori WebGL:** Menambahkan handler *component unmount* yang secara eksplisit memanggil `.dispose()` pada geometri, material, dan tekstur Three.js untuk mencegah kebocoran memori (*memory leak*) pada peramban perangkat seluler spesifikasi rendah.
- **Kompresi Aset Gambar:** Mengonversi seluruh aset grafis antarmuka ke format **AVIF / WebP** terkompresi dengan target ukuran berkas $< 80$ KB per aset.

---

## 7. Pilar Rekomendasi 4: Evolusi Arsitektur & Ekosistem (Architectural Evolution)

```
+--------------------------------------------------------------------------------------------------+
|                            PILAR REKOMENDASI 4: EVOLUSI ARSITEKTUR                               |
+--------------------------------+---------------------------------+-------------------------------+
| A1. Modular Domain-Driven (DDD)| A2. Open API & Bank Webhooks    | A3. Full-Stack Observability  |
| - App\Domain\ScamDetection     | - Laravel Sanctum API Gateway   | - OpenTelemetry AI Tracing    |
| - App\Domain\Emergency         | - Bidirectional Banking Hooks   | - Sentry APM Error Monitoring |
| - App\Domain\Community         | - BI-FAST Early Fraud Broadcast | - Prometheus Metrics Dashboard|
| - App\Domain\Education         | - Public Developer SDKs         | - RFC Standard Health Probes  |
+--------------------------------+---------------------------------+-------------------------------+
```

### 7.1 A1: Transisi ke Modular Domain-Driven Design (DDD)
Untuk menjaga agar basis kode tetap mudah dipelihara (*maintainable*) dan mudah diuji (*testable*) seiring berkembangnya tim rekayasa, direkomendasikan merestrukturisasi direktori aplikasi dari struktur datar berbasis framework menjadi arsitektur berbasis domain:

```
app/
├── Domain/
│   ├── ScamDetection/
│   │   ├── Actions/            # e.g., AnalyzeMessageAction, IngestScreenAction
│   │   ├── Contracts/          # LlmDriverInterface, ThreatScannerInterface
│   │   ├── DataTransferObjects/# ScanRequestDTO, ScanResultDTO
│   │   ├── Models/             # Scan, LlmProvider, ThreatIndicator
│   │   ├── Pipelines/          # ExactCachePipe, UrlHeuristicPipe, VisionPipe, LlmPipe
│   │   └── Services/           # LlmManager, UrlPhishingScanner, ThreatCacheManager
│   ├── Emergency/
│   │   ├── Actions/            # GenerateDossierPdfAction, ToggleChecklistAction
│   │   ├── Models/             # EmergencyChecklistProgress
│   │   └── Services/           # EmergencyGuidanceService, WhatsAppAlertBuilder
│   ├── Community/
│   │   ├── Actions/            # CreateRoomAction, VerifyContributionAction
│   │   ├── Events/             # CommunityRoomCreated, CommunityMessageSent
│   │   └── Models/             # CommunityRoom, CommunityMessage, ScamContribution
│   ├── Education/
│   │   ├── Actions/            # EvaluateSimulationAttemptAction
│   │   └── Services/           # GuardianRankingService, ScenarioEngine
│   └── Identity/
│       ├── Actions/            # RegisterUserWithRecaptchaAction
│       └── Models/             # User, AdminAuditLog
```
- **Manfaat:** Setiap domain mengisolasi logika bisnisnya masing-masing. Perubahan pada alur deteksi LLM tidak akan berisiko merusak modul tanggap darurat atau radar komunitas.

### 7.2 A2: Open API Gateway & Webhook Terintegrasi Ekosistem Perbankan
Cekara memiliki potensi besar untuk menjadi pusat pertukaran data kejahatan siber (*Cybercrime Threat Clearinghouse*) di Indonesia:
- **API Gateway untuk Ekosistem Mitra (Laravel Sanctum):**
  Membuka endpoint terotentikasi bagi mitra industri (perbankan, dompet digital, e-commerce, perusahaan telekomunikasi) untuk mengintegrasikan mesin deteksi Cekara ke dalam aplikasi mereka:
  - `POST /api/v1/verify/url`: Memeriksa legalitas suatu domain web.
  - `POST /api/v1/verify/bank-account`: Mengecek rekam jejak nomor rekening bank terhadap laporan fraud Cekara.
  - `POST /api/v1/verify/apk-signature`: Memvalidasi checksum berkas instalasi APK Android.
- **Webhook Dua Arah Konsorsium Perbankan & Penegak Hukum:**
  Saat suatu rekening penampung dilaporkan dan diverifikasi oleh konsensus Guardian dengan level risiko **CRITICAL / HIGH RISK**, sistem Cekara secara otomatis mengirimkan webhook aman ke sistem *Anti-Fraud Fraud Detection System (FDS)* bank terkait untuk memicu *temporary freeze* (pembekuan sementara 1x24 jam) guna menyelamatkan dana korban.

### 7.3 A3: Observabilitas Sistem Penuh (Full-Stack Observability & APM)
- **OpenTelemetry & Distributed Tracing:** Memantau siklus hidup setiap pemindaian, mengukur latensi parsial (waktu resolusi DNS, waktu inferensi LLM, waktu kompresi citra) guna mengidentifikasi *bottleneck* secara presisi.
- **Sentry APM:** Melacak galat fatal JavaScript di frontend React serta exception PHP di backend secara real-time beserta data rekam jejak (*breadcrumbs*).
- **Prometheus & Grafana:** Mengekspos metrik operasional sistem (`/metrics`):
  - Jumlah pemindaian per menit (*throughput*).
  - Rasio keberhasilan vs kegagalan LLM provider (*failover rate*).
  - Panjang antrean antrean Redis dan utilitas memori.
- **RFC Standard Health Probes:** Rute `/health/live` (pemeriksaan kelangsungan hidup server web) dan `/health/ready` (pemeriksaan kesiapan koneksi basis data, redis, dan reverb) untuk integrasi orkestrasi kontainer Kubernetes / Docker.

---

## 8. Roadmap Pengembangan Terstruktur (Structured Roadmap)

Roadmap implementasi dibagi ke dalam 3 fase strategis yang berkesinambungan:

```
+---------------------------------------------------------------------------------------------------+
|                                 ROADMAP STRATEGIS CEKARA 2026-2027                                |
+---------------------------------------------------------------------------------------------------+
| FASE 1: Fondasi Keamanan & Efisiensi Operasional (Bulan 1 - 3)                                    |
| [X] R1 & R2: Integrasi Google reCAPTCHA v2 Checkbox & Fallback Testing Keys                       |
| [ ] P1: Implementasi Redis Semantic & Hash-Based Caching untuk Pemindaian LLM                    |
| [ ] S2: Penegakan Autentikasi Dua Faktor (2FA / TOTP) untuk Administrator                         |
| [ ] S3: Penerapan Tiered Rate Limiting Berbasis Redis (Tamu vs Pengguna Terverifikasi)             |
| [ ] S4 & S6: Sanitasi Berkas Unggahan (EXIF Stripping) & Pengetatan HTTP Headers (CSP)           |
| [ ] S5: Skema Immutable Audit Logging (admin_audit_logs)                                         |
+---------------------------------------------------------------------------------------------------+
| FASE 2: Skalabilitas Komputasi & Otomasi Intelijen (Bulan 4 - 6)                                  |
| [ ] P2: Asynchronous Vision Queue Worker (Laravel Horizon & Reverb Instant Updates)                |
| [ ] F1: Scheduled Threat Intelligence Sync (Kominfo TrustPositif, CekRekening, Safe Browsing)     |
| [ ] F2: Konsensus Verifikasi Laporan Komunitas Berbasis Reputasi Guardian                         |
| [ ] F3: Generator Dokumen Bukti Digital & Draf STPL Kepolisian (PDF Ber-hash SHA-256)            |
| [ ] P3: Migrasi Full-Text Search (FTS) & Paginasi Kursor pada Community Radar                     |
| [ ] P4: Frontend Code-Splitting Aset 3D & Optimasi Citra AVIF/WebP                                |
+---------------------------------------------------------------------------------------------------+
| FASE 3: Ekosistem Terbuka & Ketahanan Enterprise (Bulan 7 - 12)                                   |
| [ ] F4: Peluncuran Ekstensi Peramban Cekara Shield (Chrome & Firefox Manifest V3)                |
| [ ] F5: Mesin Deteksi Scam Suara & Deepfake Telepon (Audio Vishing Analyzer via Whisper)         |
| [ ] F6: Modul Pelatihan Institusional ("Cekara untuk Sekolah & Kampus")                           |
| [ ] A1: Refaktorisasi Arsitektur Modular Domain-Driven Design (DDD)                               |
| [ ] A2: Open API Gateway Mitra Perbankan & Webhook Terintegrasi BI-FAST                          |
| [ ] A3: Observabilitas Sistem Penuh (OpenTelemetry, Prometheus, Sentry APM)                       |
+---------------------------------------------------------------------------------------------------+
```

### Rincian Tonggak Capaian (Milestone Deliverables)

#### Fase 1: Fondasi Keamanan & Quick Wins (Bulan 1 – 3)
Fokus fase ini adalah menutup seluruh celah keamanan permukaan, mencegah eksploitasi pendaftaran bot, menghemat anggaran token AI, dan melindungi hak akses sensitif.
- **Bulan 1:**
  - Penerapan tuntas Google reCAPTCHA v2 Checkbox pada form registrasi dan integrasi validasi backend (Requirement R1–R2).
  - Implementasi *Exact Hash Caching* Redis pada endpoint `/chat/analyze`.
  - Penambahan middleware keamanan HTTP (CSP, HSTS, X-Frame-Options).
- **Bulan 2:**
  - Penegakan TOTP 2FA untuk seluruh akun admin di panel `/admin/llm-providers`.
  - Pipeline pembersihan metadata EXIF citra otomatis menggunakan Imagine/Intervention Image.
  - Implementasi tabel `admin_audit_logs`.
- **Bulan 3:**
  - Penataan *Tiered Rate Limiting* (Guest: 10/jam, Auth: 60/jam, Emergency: bypass).
  - Evaluasi performa dan audit keamanan tahap pertama.

#### Fase 2: Skalabilitas & Otomasi Intelijen (Bulan 4 – 6)
Fokus fase ini adalah meningkatkan efisiensi komputasi citra, mempercepat deteksi ancaman melalui integrasi data pemerintah, dan memberikan alat hukum bagi korban penipuan.
- **Bulan 4:**
  - Refaktorisasi pemindaian citra menjadi *Asynchronous Queue Worker* dengan Laravel Horizon dan siaran status via Laravel Reverb.
  - Pembangunan scheduled command `threat:sync` untuk penyerapan data Kominfo TrustPositif dan CekRekening.id.
- **Bulan 5:**
  - Peluncuran sistem konsensus verifikasi komunitas berbasis reputasi pangkat Guardian.
  - Pembangunan fitur 1-Klik Generator Berkas Forensik Digital (PDF STPL Kepolisian) ber-hash SHA-256.
- **Bulan 6:**
  - Penerapan *Full-Text Search* (FTS) dan kursor paginasi pada Community Radar.
  - Code-splitting modular aset Three.js di frontend.

#### Fase 3: Ekosistem Terbuka & Ketahanan Enterprise (Bulan 7 – 12)
Fokus fase ini adalah ekspansi ekosistem Cekara ke peramban pengguna, perangkat audio, serta integrasi resmi dengan perbankan nasional.
- **Bulan 7 – 8:**
  - Pengembangan dan rilis Ekstensi Peramban Cekara Shield di Chrome Web Store dan Firefox Add-ons.
  - Riset dan pembangunan purwarupa detektor *Audio Vishing* berbasis Whisper AI.
- **Bulan 9 – 10:**
  - Rilis modul institusional "Cekara untuk Kampus dan Korporasi".
  - Refaktorisasi struktur kode menuju Modular Domain-Driven Design (DDD).
- **Bulan 11 – 12:**
  - Peluncuran Open API Gateway untuk perbankan dan webhook otomatisasi pembekuan rekening.
  - Integrasi distributed tracing OpenTelemetry dan dashboard Prometheus/Grafana.

---

## 9. Matriks Prioritas: Dampak vs Kompleksitas (Impact vs Effort Matrix)

Untuk memandu tim rekayasa dalam mengeksekusi inisiatif secara terukur, seluruh 16 rekomendasi dipetakan ke dalam matriks kuadran evaluasi:

```
          TINGGI ^
                 |  [KUADRAN I: QUICK WINS]         | [KUADRAN II: MAJOR STRATEGIC]
                 |                                  |
                 |  * S1: reCAPTCHA v2 (R1-R2)      |  * F1: Threat Intel Sync
                 |  * P1: Redis LLM Hash Cache      |  * P2: Async Vision Queue
          D      |  * S2: Mandatory Admin 2FA       |  * F3: Forensic Dossier PDF
          A      |  * S3: Tiered Rate Limiter       |  * F4: Cekara Shield Extension
          M      |  * S4: EXIF Stripping Pipeline   |  * A2: Bank API & Webhook
          P      |  * S6: Hardened HTTP CSP         |
          A      |----------------------------------+----------------------------------
          K      |  [KUADRAN III: INCREMENTAL]      | [KUADRAN IV: FUTURE EVALUATION]
                 |                                  |
                 |  * S5: Admin Audit Logging       |  * F5: Audio Vishing AI
                 |  * P3: Radar Full-Text Search    |  * A1: Modular DDD Transition
                 |  * P4: Frontend 3D Splitting     |  * F6: Institutional Platform
                 |  * F2: P2P Guardian Consensus    |  * A3: OpenTelemetry Full APM
                 |                                  |
          RENDAH +------------------------------------------------------------------>
                 RENDAH                             KOMPLEKSITAS (EFFORT)      TINGGI
```

### Tabel Evaluasi & Prioritas Rekayasa

| No | Kode | Inisiatif Rekomendasi | Dimensi | Estimasi Dampak (1–5) | Estimasi Kompleksitas (1–5) | Skor Prioritas | Kuadran Strategis | Target Rilis |
|---|---|---|---|:---:|:---:|:---:|---|:---:|
| 1 | **S1** | Perlindungan Bot Registrasi (reCAPTCHA v2) | Keamanan | 5 | 1 | **9.0** | Kuadran I (Quick Win) | M1 / Fase 1 |
| 2 | **P1** | Redis Semantic & Hash-Based LLM Caching | Performa | 5 | 2 | **8.5** | Kuadran I (Quick Win) | Fase 1 |
| 3 | **S2** | Mandatory 2FA TOTP untuk Administrator | Keamanan | 4 | 2 | **8.0** | Kuadran I (Quick Win) | Fase 1 |
| 4 | **S3** | Tiered Rate Limiting Token Bucket (Redis) | Keamanan | 4 | 2 | **8.0** | Kuadran I (Quick Win) | Fase 1 |
| 5 | **S4** | Sanitasi Berkas Citra & EXIF Stripping | Keamanan | 4 | 2 | **8.0** | Kuadran I (Quick Win) | Fase 1 |
| 6 | **S6** | Pengetatan Header Keamanan HTTP & CSP | Keamanan | 4 | 1 | **8.5** | Kuadran I (Quick Win) | Fase 1 |
| 7 | **F3** | Generator Berkas Bukti Forensik STPL PDF | Fitur | 5 | 3 | **7.5** | Kuadran II (Major Project) | Fase 2 |
| 8 | **F1** | Scheduled Threat Intelligence Sync | Fitur | 5 | 3 | **7.5** | Kuadran II (Major Project) | Fase 2 |
| 9 | **P2** | Asynchronous Vision Queue Worker | Performa | 5 | 3 | **7.5** | Kuadran II (Major Project) | Fase 2 |
| 10| **F4** | Ekstensi Peramban Cekara Shield | Fitur | 4 | 4 | **6.0** | Kuadran II (Major Project) | Fase 3 |
| 11| **A2** | Open API Gateway & Webhook Perbankan | Arsitektur| 5 | 4 | **6.5** | Kuadran II (Major Project) | Fase 3 |
| 12| **S5** | Immutable Admin Audit Logging | Keamanan | 3 | 2 | **7.0** | Kuadran III (Incremental)| Fase 1 |
| 13| **P3** | Full-Text Search pada Radar Komunitas | Performa | 3 | 2 | **7.0** | Kuadran III (Incremental)| Fase 2 |
| 14| **P4** | Frontend 3D Splitting & WebP Optimization| Performa | 3 | 2 | **7.0** | Kuadran III (Incremental)| Fase 2 |
| 15| **F2** | Konsensus Verifikasi Laporan Guardian | Fitur | 3 | 3 | **6.0** | Kuadran III (Incremental)| Fase 2 |
| 16| **F5** | Audio Vishing & Deepfake Detector | Fitur | 4 | 5 | **5.0** | Kuadran IV (Future Eval) | Fase 3 |
| 17| **A1** | Transisi Modular Domain-Driven Design | Arsitektur| 4 | 4 | **5.5** | Kuadran IV (Future Eval) | Fase 3 |
| 18| **A3** | Observabilitas Penuh (OpenTelemetry/APM) | Arsitektur| 3 | 3 | **6.0** | Kuadran IV (Future Eval) | Fase 3 |

*Catatan Formula Skor Prioritas:*  
$$\text{Skor Prioritas} = (\text{Dampak} \times 2) - \text{Kompleksitas} + 5$$  
Inisiatif dengan skor $\ge 8.0$ diwajibkan untuk diselesaikan pada kuartal pertama pelaksanaan roadmap.

---

## 10. Panduan Teknis & Arsitektur Implementasi Cepat (Quick Wins Blueprint)

Sebagai pedoman langsung bagi tim pengembang, berikut adalah cetak biru implementasi untuk tiga inisiatif prioritas utama Fase 1:

### 10.1 Blueprint 1: Redis Hash-Based Scan Caching (`app/Domain/ScamDetection/Services/ThreatCacheManager.php`)
```php
namespace App\Services\Security;

use Illuminate\Support\Facades\Cache;

class ThreatCacheManager
{
    private const TTL_SECONDS = 1209600; // 14 Hari

    /**
     * Menghasilkan cache key unik berbasis hash kanonikal teks.
     */
    public static function generateHashKey(string $text): string
    {
        // Normalisasi: buang spasi berlebih, ubah ke huruf kecil, buang karakter kontrol
        $clean = trim(preg_replace('/\s+/', ' ', mb_strtolower($text)));
        return 'scan:hash:' . hash('sha256', $clean);
    }

    /**
     * Memeriksa apakah analisis untuk teks ini sudah tersedia di cache.
     */
    public static function getCachedAnalysis(string $text): ?array
    {
        $key = self::generateHashKey($text);
        return Cache::get($key);
    }

    /**
     * Menyimpan hasil analisis LLM ke dalam cache.
     */
    public static function storeAnalysis(string $text, array $analysisData): void
    {
        $key = self::generateHashKey($text);
        Cache::put($key, $analysisData, self::TTL_SECONDS);
    }
}
```

### 10.2 Blueprint 2: Image EXIF Stripping Pipeline (`app/Services/Security/ImageSanitizer.php`)
```php
namespace App\Services\Security;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageSanitizer
{
    /**
     * Membersihkan metadata EXIF dan mengonversi citra ke WebP aman.
     */
    public static function sanitizeAndStore(UploadedFile $file, string $directory = 'scans'): string
    {
        // Validasi mime type asli secara biner (magic bytes)
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes, true)) {
            throw new \InvalidArgumentException('Tipe berkas citra tidak diizinkan.');
        }

        $imageContent = file_get_contents($file->getRealPath());
        $sourceImage = @imagecreatefromstring($imageContent);
        
        if ($sourceImage === false) {
            throw new \RuntimeException('Gagal memproses berkas citra: berkas korup atau tidak valid.');
        }

        // Simpan sebagai WebP murni tanpa membawa metadata EXIF lama
        $filename = Str::uuid()->toString() . '.webp';
        $destinationPath = storage_path('app/public/' . $directory . '/' . $filename);

        // Buat direktori jika belum ada
        if (!is_dir(dirname($destinationPath))) {
            mkdir(dirname($destinationPath), 0755, true);
        }

        // Tulis ulang kanvas ke WebP dengan kualitas 85%
        imagewebp($sourceImage, $destinationPath, 85);
        imagedestroy($sourceImage);

        return $directory . '/' . $filename;
    }
}
```

### 10.3 Blueprint 3: Security Headers Middleware (`app/Http/Middleware/SecurityHeadersMiddleware.php`)
```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
```

---

## 11. Penutup & Kesimpulan Strategis

Platform **Cekara** telah membuktikan keunggulannya sebagai pionir sistem pertahanan siber masyarakat (*Civilian Cyber Guardian*) di Indonesia. Kombinasi unik antara pengenalan ancaman multi-modal berbasis AI, playbook tanggap darurat krisis yang realistis, serta keterlibatan komunitas melalui radar ancaman real-time merupakan diferensiasi fundamental yang tidak dimiliki oleh solusi komersial manapun di tanah air.

Melalui cetak biru rekomendasi yang terangkum dalam dokumen ini:
1. **Keamanan Permukaan:** Diperkokoh secara instan melalui implementasi **Google reCAPTCHA v2 Checkbox (Requirement R1–R2)**, penegakan **2FA TOTP**, serta sanitasi berkas unggahan.
2. **Efisiensi & Skalabilitas:** Ditingkatkan secara dramatis melalui **Redis Semantic Caching** yang memangkas biaya operasional LLM dan **Asynchronous Vision Workers** yang menghilangkan risiko request timeout.
3. **Kekuatan Fitur:** Ditingkatkan secara revolusioner melalui **Sinkronisasi Intelijen Ancaman Nasional**, **Berkas Forensik STPL 1-Klik**, serta **Ekstensi Peramban Cekara Shield**.
4. **Keberlanjutan Arsitektur:** Dijamin melalui evolusi menuju **Domain-Driven Design (DDD)** dan **Open API Gateway** yang menghubungkan Cekara dengan perbankan nasional.

Dengan komitmen pelaksanaan roadmap Fase 1 hingga Fase 3 secara disiplin, terukur, dan berpegang teguh pada integritas rekayasa perangkat lunak berstandar internasional, Cekara siap mengawal jutaan keluarga Indonesia menuju ruang digital yang aman, cerdas, berdaya, dan terlindungi.

---
*Dokumen ini diterbitkan oleh Tim Rekayasa Cekara pada tanggal 10 November 2026 sebagai pemenuhan resmi Requirement R3.*
