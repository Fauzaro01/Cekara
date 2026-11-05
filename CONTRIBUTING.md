# Panduan Kontribusi CEKARA 🛡️🇮🇩

Terima kasih atas ketertarikan Anda untuk berkontribusi pada **CEKARA**! Bersama-sama, kita membangun dan memperkuat pertahanan ruang digital untuk melindungi anak muda, keluarga, dan masyarakat Indonesia dari ancaman penipuan online (_scam & social engineering_).

Panduan ini bertujuan agar proses kontribusi berjalan lancar, terarah, dan selaras dengan standar kualitas kode serta pedoman desain proyek.

---

## 📌 Kode Etik & Filosofi Pengembangan

Dalam berkontribusi ke CEKARA, harap selalu mengindahkan prinsip-prinsip utama proyek:

1. **Empati & Bahasa Manusiawi**:
   Hindari jargon pemasaran berlebihan atau istilah teknis yang menakut-nakuti. Gunakan bahasa Indonesia sehari-hari yang santai, bersahabat, dan menenangkan (contoh: _"Tenang, kita periksa bareng"_).
2. **Kepatuhan Pedoman Desain Anti-Slop (`ATURAN-DESAIN.md`)**:
    - Desain mengusung gaya **datar murni (_flat design_)** yang taktil dan bersih.
    - Dilarang menggunakan gradasi warna ungu-biru mengambang, _glassmorphism_, atau efek neon menyala.
    - Gunakan palet resmi: Jingga es jeruk (`#FF9A3C`), Biru langit (`#8ECDF0`), Kuning mentega (`#FFE27A`), Cokelat tua (`#3B2A1E`), Terakota (`#D4573A`), dan Latar krem hangat (`#FFF8EC`).
    - Dilarang menggunakan emoji sistem sebagai ikon antarmuka; gunakan selalu ikon SVG garis seragam dari pustaka `lucide-react`.
3. **Integritas Data & Privasi**:
   CEKARA memprioritaskan privasi pengguna. Jangan pernah menyimpan data sensitif, nomor rekening, kontak pribadi, atau kunci API tanpa enkripsi yang semestinya.

---

## 🛠️ Alur Kerja Kontribusi (Workflow)

### 1. Fork & Clone Repositori

```bash
# Fork repositori ini melalui GitHub, lalu clone hasil fork Anda:
git clone https://github.com/USERNAME_ANDA/Cekara.git
cd Cekara

# Tambahkan remote upstream untuk sinkronisasi pembaruan terkini:
git remote add upstream https://github.com/Fauzaro01/Cekara.git
git fetch upstream
```

### 2. Persiapan Lingkungan Lokal (Local Setup)

Pastikan sistem Anda telah terpasang:

- **PHP >= 8.4**
- **Composer >= 2.x**
- **Node.js >= 20.x** & **npm**

Jalankan perintah instalasi awal:

```bash
# Salin konfigurasi environment
cp .env.example .env

# Instal paket dependensi backend & frontend
composer install
npm install

# Buat kunci enkripsi aplikasi & jalankan migrasi database
php artisan key:generate
php artisan migrate

# Jalankan seeder akun demo (opsional untuk pengujian tampilan)
php artisan db:seed --class=DemoShowcaseSeeder

# Kompilasi aset frontend
npm run build
```

### 3. Buat Branch Baru

Gunakan penamaan branch yang jelas dan deskriptif:

```bash
# Untuk perbaikan bug
git checkout -b fix/nama-perbaikan

# Untuk penambahan fitur
git checkout -b feat/nama-fitur

# Untuk dokumentasi
git checkout -b docs/nama-dokumen
```

---

## 🧪 Pengujian & Verifikasi Mutu Kode

Sebelum melakukan commit atau mengajukan Pull Request, pastikan seluruh pemeriksaan otomatis di bawah ini berhasil melewati verifikasi tanpa kesalahan (_zero warnings & zero errors_):

### 1. Frontend Linting & Formatting (Vite+)

Proyek ini mengaktifkan aturan ketat `denyWarnings: true` untuk memastikan kebersihan kode:

```bash
# Otomatis rapikan format dan perbaiki linting
npm run check:fix

# Periksa status linting & format
npm run check
```

### 2. Pemeriksaan Tipe TypeScript

```bash
npm run types:check
```

### 3. Pemeriksaan Gaya Kode PHP (Laravel Pint)

```bash
# Format otomatis dengan Laravel Pint
vendor/bin/pint --format agent

# Periksa kesesuaian tanpa mengubah berkas
vendor/bin/pint --test
```

### 4. Analisis Statis PHP (PHPStan)

```bash
vendor/bin/phpstan analyse
```

### 5. Pengujian Fungsional Otomatis (Pest Tests)

Pastikan seluruh 525+ pengujian skenario berjalan sukses:

```bash
php artisan test --compact
```

---

## 📝 Konvensi Pesan Commit

Kami mengadopsi standar **Conventional Commits**:

- `feat: <deskripsi>`: Penambahan fitur atau modul baru.
- `fix: <deskripsi>`: Perbaikan bug atau penanganan kesalahan.
- `docs: <deskripsi>`: Pembaruan atau penambahan dokumentasi.
- `style: <deskripsi>`: Perbaikan format kode, spasi, atau linting tanpa mengubah logika.
- `refactor: <deskripsi>`: Restrukturisasi kode tanpa mengubah fungsionalitas.
- `test: <deskripsi>`: Penambahan atau perbaikan rangkaian uji otomatis (_test cases_).
- `chore: <deskripsi>`: Pembaruan dependensi, konfigurasi build, atau skrip pembantu.

_Contoh_:

```bash
git commit -m "fix(ci): fix code formatting across resources and update phpstan config"
```

---

## 🚀 Mengajukan Pull Request (PR)

1. **Sinkronkan branch Anda** dengan branch `main` upstream:
    ```bash
    git fetch upstream
    git rebase upstream/main
    ```
2. **Push branch Anda** ke remote fork:
    ```bash
    git push origin fix/nama-branch
    ```
3. **Buka Pull Request** di repositori GitHub `Fauzaro01/Cekara`.
4. Berikan judul yang informatif serta deskripsi lengkap:
    - Apa latar belakang masalah atau kebutuhan perubahan ini?
    - Apa saja berkas dan komponen yang dimodifikasi?
    - Konfirmasi bahwa pengujian lokal (`npm run check`, `npm run types:check`, `vendor/bin/pint --test`, `php artisan test`) telah berstatus hijau.

Terima kasih atas kontribusi Anda dalam menjaga keamanan ruang digital generasi muda Indonesia! 🇮🇩✨
