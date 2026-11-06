# Cekara — Guardian di Ruang Digital 🛡️🇮🇩

> **Platform Web Terintegrasi untuk Memberdayakan Anak Muda Indonesia Mengenali (_Recognize_), Belajar (_Learn_), dan Bertindak (_Act_) Melawan Penipuan Digital.**

[![Tests](<https://img.shields.io/badge/tests-525%2B%20passed%20(100%25)-emerald.svg>)](tests/)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4.svg?logo=php)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20.svg?logo=laravel)](https://laravel.com)
[![Inertia](https://img.shields.io/badge/Inertia-v3%20React%2019-9553E9.svg)](https://inertiajs.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4%20Sky%20Blue-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📌 Latar Belakang Masalah

Setiap hari, jutaan anak muda di Indonesia berhadapan dengan ancaman kejahatan siber yang kian canggih:

- Modus **Malware berkedok surat undangan pernikahan digital atau resi kurir paket (.APK)** yang menyadap SMS OTP m-banking.
- Penipuan **lowongan kerja freelance fiktif** (tugas like video TikTok / Telegram) yang memeras deposit modal.
- Akun tiruan (**impersonation / kloning akun**) yang menyamar sebagai teman akrab atau pejabat untuk meminjam uang darurat.
- Tautan **phishing perbankan** dan **pinjaman online ilegal** dengan bunga mencekik serta ancaman teror sebar data.

Dalam dunia nyata, membedakan interaksi resmi dan manipulasi rekayasa sosial sangatlah sulit. Bahkan setelah menyadari dirinya menjadi target, banyak orang tidak tahu langkah konkret apa yang harus diambil untuk melindungi rekening atau membantu keluarga mereka agar tidak terjerumus ke lubang yang sama.

**Cekara** hadir sebagai solusi komprehensif yang tidak hanya mendeteksi ancaman, tetapi juga **melatih ketajaman naluri (_instinct_)** dan **memandu tindakan darurat nyata** bagi anak muda untuk menjadi **Guardian** di ruang digital bagi dirinya sendiri, teman, dan keluarganya.

---

## 🏛️ Arsitektur Solusi & 3 Pilar Utama

```mermaid
flowchart TD
    User([Pengguna / Anak Muda]) --> Web[Platform Web Cekara]
    Web --> Auth{Autentikasi Breeze}
    Auth -->|Guest / Publik| PublicFeatures[Landing Page, Deteksi Cepat, Simulasi Publik]
    Auth -->|Authenticated| Dash[/dashboard: Ringkasan Guardian, Recent Tabs, Action History]

    subgraph Pilar_1 [Pilar 1: RECOGNIZE - Mengenali Ancaman Multi-Modal]
        In1[Plaintext Pesan Chat] --> Engine[Detektor Penipuan Cekara]
        In2[Upload Screenshot JPG/PNG] --> Vision[Gemini Vision / Multi-Modal LLM] --> Engine
        In3[Tautan URL Website] --> URLScanner[UrlPhishingScanner Heuristics] --> Engine
        Engine --> Output[Skor Risiko 0-100, Indikator Bahaya, Penjelasan Gamblang]
        Output -.->|Simpan Otomatis| Dash
    end

    subgraph Pilar_2 [Pilar 2: LEARN - Melatih Naluri & Skenario Nyata]
        Web --> SimArena[/simulasi: Skenario Interaktif Kasus Indonesia]
        SimArena --> Case[1. Skenario Percakapan Realistis WhatsApp/SMS]
        Case --> Thinking[2. Tahap Berpikir: Pilihan Respon Tindakan]
        Thinking --> Feedback[3. Umpan Balik: Bedah Trik Psikologis & Red Flags]
        Feedback --> Rank[Kalkulasi Pangkat: Pemula s/d Master Guardian]
        Feedback --> DatasetLoop[(Dataset Kontribusi Pola Baru)]
    end

    subgraph Pilar_3 [Pilar 3: ACT - Pedoman & Tanggap Darurat Nyata]
        Web --> ActionCenter[/tanggap-darurat: Pusat Tindakan Krisis]
        ActionCenter --> Playbook1[Protokol Terlanjur Pasang File .APK]
        ActionCenter --> Playbook2[Protokol Terlanjur Transfer Dana ke Penipu]
        ActionCenter --> Playbook3[Protokol Kebocoran Data KTP & Identitas]
        ActionCenter --> Checklist[Checklist Interaktif Tersimpan]
        ActionCenter --> WAAlert[WhatsApp Family Alert Generator]
        WAAlert --> SendWA[Kirim Peringatan Siaga ke Grup WA Keluarga]
    end

    subgraph Pilar_Ekspansi [Inovasi Ekosistem: Komunitas & Keluarga]
        DatasetLoop --> Radar[/radar: Radar Ancaman Komunitas Real-Time]
        Radar --> Upvote[Konfirmasi Kasus 'Saya Mengalami Ini']
        Web --> Family[/panduan-keluarga: Toolkit Orang Tua & Guru]
        Family --> CheatSheet[Lembar Panduan Cetak Aturan Emas 3T]
        Family --> FamilyQuiz[Kuis Tes Kerentanan Keluarga 5 Menit]
    end
```

---

## ✨ Fitur Unggulan

### 1. Deteksi Multi-Modal Berbasis AI & Aturan Terjelaskan (Recognize)

- **Analisis Teks**: Mendeteksi pola bujuk rayu, desakan waktu (_urgency_), dan tawaran tidak masuk akal.
- **Upload Screenshot Percakapan (`JPG / PNG` hingga 5MB)**: Menggunakan Vision LLM (Gemini Vision) dengan validasi berkas multi-lapis untuk menganalisis tangkapan layar chat WhatsApp, SMS, atau Instagram tanpa perlu menyalin teks manual.
- **Pemindai Tautan Phishing (`UrlPhishingScanner`)**: Memeriksa typosquatting nama bank (contoh: `.vip`, `.top`), IP host langsung, punycode/homoglyph, dan URL redirection mencurigakan.
- **Multi-Provider LLM Router**: Mendukung Google Gemini, OpenAI, Custom Router LLM API (OpenAI compatible), serta mesin _Heuristic Guardian_ offline yang dapat diatur melalui panel admin (`/admin/llm-providers`) dengan kunci API terenkripsi.

### 2. Simulasi Interaktif Rekayasa Sosial (Learn)

- **Skenario Kasus Nyata Indonesia**:
    1. _Surat Undangan Pernikahan Digital (.APK)_
    2. _Lowongan Kerja Freelance Like & Subscribe (Task Scam Telegram)_
    3. _Peringatan Akun M-Banking Dibekukan (SMS Phishing)_
    4. _Teman Dekat Pinjam Saldo Darurat via Kloning Akun Medsos_
    5. _Pencairan Pinjaman Online Cepat Minta Biaya Admin di Muka_
- **Alur 3 Langkah**: _Case_ (tampilan chat realistis) $\rightarrow$ _Thinking_ (pilihan keputusan pengguna) $\rightarrow$ _Feedback_ (bedah trik manipulasi psikologis penipu).
- **Guardian Rank Progression**: Peringkat keahlian digital mulai dari _Pemula Digital_, _Kadet Pengawas_, _Guardian Waspada_, hingga _Master Guardian_.

### 3. Pusat Tanggap Darurat & Generator Peringatan (Act)

- **Protokol Mitigasi Krisis (`/tanggap-darurat`)**:
    - Langkah detik pertama jika terlanjur transfer uang (kontak bank resmi, lapor `cekrekening.id`, `patrolisiber.id`).
    - Langkah jika terlanjur memasang berkas `.apk` (isolasi jaringan, safe mode, cabut hak akses admin perangkat, ganti password m-banking dari ponsel lain).
    - Antisipasi jika foto KTP bocor ke komplotan pinjol ilegal.
- **Checklist Interaktif Tersimpan**: Progres langkah penyelamatan dapat dicentang dan tersimpan di akun pengguna.
- **WhatsApp Alert Generator**: Menghasilkan draf pesan peringatan yang santun dan rapi dengan tombol 1-klik bagikan langsung ke WhatsApp (`https://wa.me/?text=...`).

### 4. Radar Ancaman Komunitas (`/radar`)

- Sistem peringatan dini (_early warning feed_) yang menyajikan modus penipuan baru yang dilaporkan warga.
- Tombol validasi **"Saya Mengalami Ini"** (_upvote count_) untuk memetakan seberapa masif modus tersebut menyebar di berbagai kota di Indonesia.

### 5. Toolkit Guardian untuk Orang Tua & Guru (`/panduan-keluarga`)

- **Lembar Panduan 3T (Tenang, Telepon, Tanya Anak)**: Format kartu visual yang mudah dipahami orang tua, ramah cetak (_print-friendly_), dan siap dibagikan ke WhatsApp keluarga.
- **Kuis Kerentanan Keluarga (5 Menit)**: Asesmen interaktif 5 skenario sehari-hari untuk mengukur seberapa rentan anggota keluarga menjadi korban penipuan online.

### 6. Dashboard Khusus Pengguna & Auth Gate (`/dashboard`)

- Status terpadu: Pangkat Guardian, skor akurasi, dan jumlah skenario yang diselesaikan.
- **Recent Tabs**: Riwayat pemindaian pesan & gambar tersimpan lengkap dengan modal rincian indikator bahaya dan opsi hapus riwayat.
- **Auth Gate**: Tamu bebas mencoba demo dan simulasi publik; riwayat scan permanen dan dashboard diproteksi login.

---

## 🛠️ Stack Teknologi

- **Backend**: Laravel 13, PHP 8.4, SQLite (development) / PostgreSQL / MySQL (production)
- **Frontend SPA**: Inertia.js v3, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (_CSS-first `@theme`_), font Inter, Dark Mode instan anti-FOUC
- **Routing & Types**: Laravel Wayfinder (auto-generated typed actions & routes)
- **AI Engine**: Multi-Provider LLM Driver (Google Gemini, OpenAI, Custom Router API) & Heuristic Guardian Rule Engine
- **Quality Assurance**: Pest PHP (525+ automated feature & unit tests), Laravel Pint code formatter

---

## 🚀 Panduan Menjalankan Proyek (Local Setup)

### Prasyarat

- PHP >= 8.4
- Composer >= 2.x
- Node.js >= 20.x & npm

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/username/Cekara.git
cd Cekara

# 2. Salin environment & instal dependensi
cp .env.example .env
composer install
npm install

# 3. Generate key & migrasi database
php artisan key:generate
php artisan migrate

# 4. Jalankan Demo Showcase Seeder (Sangat Disarankan untuk Demo)
php artisan db:seed --class=DemoShowcaseSeeder

# 5. Kompilasi aset frontend
npm run build

# 6. Jalankan server lokal
composer run dev
# Atau jalankan secara terpisah:
# Terminal 1: php artisan serve
# Terminal 2: npm run dev
```

Buka peramban di `http://localhost:8000`.

---

## 🔑 Akun Uji Coba & Demo (Demo Credentials)

Gunakan akun yang telah disiapkan melalui `DemoShowcaseSeeder`:

| Peran                      | Email                | Kata Sandi | Akses Utama                                                                       |
| -------------------------- | -------------------- | ---------- | --------------------------------------------------------------------------------- |
| **User (Master Guardian)** | `guardian@cekara.id` | `password` | `/dashboard`, Recent Tabs riwayat scan, status Master Guardian, checklist darurat |
| **Admin Pengelola**        | `admin@cekara.id`    | `password` | `/admin/llm-providers` (Konfigurasi Multi-Provider LLM & API Keys terenkripsi)    |

---

## 🧪 Pengujian & Verifikasi Mutu

Seluruh fungsionalitas dan skenario batas telah diuji secara menyeluruh:

```bash
# Menjalankan seluruh pengujian (525+ Pest Tests)
php artisan test --compact

# Pemeriksaan tipe statis TypeScript
npm run types:check

# Kompilasi aset produksi Vite
npm run build

# Pemeriksaan standar gaya kode Laravel Pint
vendor/bin/pint --format agent
```

---

## 🚢 Panduan Deployment Produksi

### Opsi A: Laravel Cloud

1. Hubungkan repositori GitHub ini ke dashboard [Laravel Cloud](https://cloud.laravel.com/).
2. Konfigurasikan variabel environment (`APP_KEY`, `DB_CONNECTION`, dsb.).
3. Deploy instan dengan zero-downtime deployment.

### Opsi B: Docker

Proyek ini dilengkapi dengan `Dockerfile` siap pakai:

```bash
docker build -t cekara-app .
docker run -d -p 8000:8000 --env-file .env cekara-app
```

---

## 🤝 Kontribusi & Lisensi

Proyek ini dikembangkan di bawah lisensi [MIT License](LICENSE). Mari bersama menjadi **Guardian di Ruang Digital** untuk melindungi masa depan anak muda dan keluarga Indonesia!
