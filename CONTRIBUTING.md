# Panduan Kontribusi Cekara

Dokumen ini berisi panduan teknis untuk berkontribusi ke repositori Cekara.

## Prasyarat

- PHP 8.4 atau lebih baru
- Composer 2.x
- Node.js 20.x ke atas dan npm

## Setup Lokal

1. Fork dan clone repositori:

    ```bash
    git clone https://github.com/USERNAME/Cekara.git
    cd Cekara
    git remote add upstream https://github.com/Fauzaro01/Cekara.git
    ```

2. Pasang dependensi dan siapkan environment:

    ```bash
    cp .env.example .env
    composer install
    npm install
    php artisan key:generate
    php artisan migrate
    ```

3. Jalankan server development:
    ```bash
    composer run dev
    ```

## Standar Kode dan Desain

- Antarmuka mengacu pada aturan di `ATURAN-DESAIN.md` (desain flat, palet warna yang sudah ditentukan, dan ikon SVG garis tanpa emoji sistem sebagai ikon).
- Bahasa pengantar aplikasi menggunakan bahasa Indonesia yang santai dan lugas.

## Pengecekan Mutu (Wajib Sebelum Buat PR)

CI akan menjalankan pengecekan ketat. Pastikan seluruh perintah berikut lolos secara lokal sebelum push:

1. Format dan linting frontend:

    ```bash
    npm run check:fix
    npm run check
    ```

2. Pemeriksaan tipe TypeScript:

    ```bash
    npm run types:check
    ```

3. Standar gaya kode PHP (Pint):

    ```bash
    vendor/bin/pint --test
    ```

4. Analisis statis PHP (PHPStan):

    ```bash
    vendor/bin/phpstan analyse
    ```

5. Test otomatis (Pest):
    ```bash
    php artisan test --compact
    ```

## Alur Pull Request

1. Buat branch baru dari `main` (misal: `fix/nama-masalah` atau `feat/nama-fitur`).
2. Tulis pesan commit yang jelas (gunakan format conventional commit seperti `fix:`, `feat:`, `docs:`).
3. Pastikan branch sudah sinkron dengan `upstream/main`.
4. Buka Pull Request ke branch `main` repositori upstream dan jelaskan perubahan yang dibuat secara ringkas.
