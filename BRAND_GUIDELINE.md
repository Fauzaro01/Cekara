# Panduan Identitas Visual & Desain: CEKARA

_Brand & Design Guideline — "Cek dulu sebelum percaya"_

---

## 1. Ringkasan Brand

**CEKARA** (singkatan dari _Cek dulu sebelum percaya_) adalah aplikasi web edukatif yang membantu pelajar SMP, SMA/SMK, hingga mahasiswa baru untuk mengenali pesan, tautan, tawaran, atau profil online yang mencurigakan. Alih-alih bertindak seperti polisi atau guru yang kaku, CEKARA hadir layaknya teman sebaya yang suportif dan peduli di kantin sekolah saat istirahat siang. Melalui pendekatan yang hangat dan tidak menghakimi, CEKARA membimbing pengguna memahami alasan di balik suatu risiko dan memandu mereka mengambil keputusan digital yang aman dengan kepala dingin.

---

## 2. Prinsip Desain

- **Tidak Memvonis, Melainkan Memberdayakan (_Empower, Don't Judge_)**  
  CEKARA tidak pernah melabeli sebuah temuan sebagai "pasti penipuan" atau sebaliknya "100% aman". Sistem menyajikan kemungkinan, membeberkan indikator kejanggalan, dan melatih nalar kritis pengguna agar mandiri mengenali pola bahaya di masa depan.
- **Hangat & Bersahabat (_School Canteen Vibe_)**  
  Visual mengutamakan palet hangat yang menenangkan, sudut-sudut membulat lembut, dan tipografi ramah. Jauhkan kesan kaku birokrasi, estetika peretasan (_cyberpunk_ gelap/neon), atau visual darurat yang memicu kepanikan.
- **Aksesibel & Jelas Tanpa Bergantung Warna Saja**  
  Tingkat risiko tidak boleh hanya dibedakan lewat warna. Label teks deskriptif, ikon pendukung, dan rasio kontras minimal 4,5:1 (WCAG AA) wajib diterapkan di seluruh antarmuka.
- **Tindakan Nyata (_Action-Oriented & Supportive_)**  
  Setiap analisis selalu diakhiri dengan panduan tindakan langkah demi langkah (_Act_) yang konkret dan mudah dipraktikkan oleh remaja.

---

## 3. Palet Warna dan Aturan Pakainya

Palet utama mengusung tema **"Es Jeruk dan Krem"** yang menyegarkan, bersahabat, dan membumi.

### Tabel Warna Utama

| Peran               | Hex       | Penggunaan                                                                                   |
| ------------------- | --------- | -------------------------------------------------------------------------------------------- |
| **Latar**           | `#FFF8EC` | Latar belakang halaman utama dan kontainer sekunder (krem hangat).                           |
| **Aksen utama**     | `#FF9A3C` | Latar tombol aksi utama, logo, penanda aktif, dan ilustrasi aksen (jingga es jeruk).         |
| **Pendamping**      | `#8ECDF0` | Kartu informasi, hiasan visual, penanda status netral/belum terdeteksi (biru langit lembut). |
| **Sorotan**         | `#FFE27A` | Menyorot kata kunci atau potongan teks berisiko, status risiko sedang (kuning mentega).      |
| **Teks**            | `#3B2A1E` | Teks utama, judul, dan isi badan teks (cokelat tua bersahaja, bukan hitam pekat).            |
| **Teks sekunder**   | `#6B5646` | Teks keterangan, label pembantu, _placeholder_, dan garis tepi halus (cokelat susu).         |
| **Peringatan kuat** | `#D4573A` | Level risiko tinggi, lencana bahaya, ikon peringatan tebal (terakota).                       |

### Varian Turunan (Aksesibilitas Kontras)

| Peran                     | Hex       | Alasan & Penggunaan                                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Peringatan teks kecil** | `#A8412A` | Versi terakota yang digelapkan khusus untuk teks berukuran kecil (< 18 px) atau teks berbobot reguler di atas latar krem `#FFF8EC`. Warna terakota asli `#D4573A` memiliki kontras ~3,5:1 di atas krem (kurang dari standar WCAG AA 4,5:1), sedangkan `#A8412A` menghasilkan rasio kontras 5,2:1 sehingga tetap tajam dan mudah dibaca oleh pelajar. |

### Aturan Pakai Warna

1. **Aturan Tombol Jingga (`#FF9A3C`)**: Selalu gunakan teks berwarna cokelat tua `#3B2A1E` di atas latar tombol jingga. Jangan gunakan warna jingga sebagai warna huruf di atas latar krem karena kontrasnya tidak memadai.
2. **Aturan Terakota (`#D4573A`)**: Hanya digunakan untuk elemen grafis berbidang luas, lencana (_badge_ tebal), atau border. Jika ada teks kecil peringatan, wajib memakai varian `#A8412A`.
3. **Desain Datar (_Strictly Flat_)**: Dilarang menggunakan gradasi warna (_gradient_), efek cahaya (_glow/neon_), atau bayangan pekat gelap. Tampilan harus bersih, cerah, dan datar.
4. **Pantangan Warna Hijau**: **Jangan gunakan warna hijau** untuk status apa pun di aplikasi CEKARA. Hijau menciptakan ilusi rasa aman mutlak (_false sense of security_), padahal teknik penipuan digital selalu berkembang.
5. **Wajib Label Teks Bersama Warna**: Perbedaan indikator risiko wajib disertai teks lengkap dan ikon pengenal, tidak boleh hanya berupa lingkaran atau balok warna.

---

## 4. Warna dan Label Status Hasil

Hasil pemindaian dan evaluasi kasus dikelompokkan ke dalam tiga status dengan label edukatif yang tidak memvonis:

| Level                | Warna Representasi              | Hex Teks & Kontras                          | Label Resmi                                        | Catatan Filosofi                                                                                                                                                          |
| -------------------- | ------------------------------- | ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tinggi**           | Terakota `#D4573A` (Latar chip) | Teks putih atau `#A8412A` (pada latar krem) | **"Hati-hati, ini mencurigakan"**                  | Menandakan adanya indikator bahaya kuat (misal: meminta OTP, instalasi APK mencurigakan, transfer uang jaminan). Mengajak berhenti sejenak tanpa memvonis pengguna bodoh. |
| **Sedang**           | Kuning mentega `#FFE27A`        | Teks cokelat tua `#3B2A1E`                  | **"Yuk cek dulu"**                                 | Menandakan ada tanda janggal minor (domain baru, bahasa buru-buru/mendesak). Memotivasi pengguna untuk memverifikasi ke saluran resmi.                                    |
| **Belum terdeteksi** | Biru langit `#8ECDF0`           | Teks cokelat tua `#3B2A1E`                  | **"Belum ketemu tanda bahaya, tapi tetap cek ya"** | Menggantikan label "Aman". Menegaskan bahwa meski sistem belum menemukan kejanggalan, kewaspadaan pribadi tetap harus menyala.                                            |

---

## 5. Tipografi

Pasangan huruf resmi CEKARA memadukan karakter santai, ramah, dan keterbacaan tinggi yang tersedia gratis di Google Fonts:

- **Huruf Judul**: **Fredoka** (Bobot 600 Semi-Bold & 700 Bold).
- **Huruf Badan Teks**: **Nunito** (Bobot 400 Regular, 600 Semi-Bold, & 700 Bold).
- **Fallback Sistem**: `system-ui, -apple-system, sans-serif`.

> **Alasan Pemilihan Pasangan Huruf:**  
> Kombinasi Fredoka dan Nunito menghadirkan kesatuan visual melalui lengkungan huruf (_rounded terminals_) yang hangat, kasual, dan menyerupai gaya stiker remaja. Fredoka memberi daya pikat ceria pada judul tanpa terlihat kekanak-kanakan, sementara struktur anatomis Nunito yang bersih menjamin kenyamanan mata pelajar saat membaca uraian panjang di layar ponsel pintar.

### Skala Tipografi

| Tingkat                  | Ukuran            | Tinggi Baris (_Line Height_) | Bobot (_Weight_)  | Penggunaan                                         |
| ------------------------ | ----------------- | ---------------------------- | ----------------- | -------------------------------------------------- |
| **H1 (Display)**         | 32 px (2 rem)     | 40 px (1.25)                 | Fredoka 700       | Judul halaman utama, judul skenario simulasi       |
| **H2 (Section)**         | 24 px (1.5 rem)   | 32 px (1.33)                 | Fredoka 600 / 700 | Judul kartu hasil, kategori pedoman tindakan       |
| **H3 (Sub-section)**     | 20 px (1.25 rem)  | 28 px (1.4)                  | Fredoka 600       | Sub-bagian dalam kartu, judul dialog/modal         |
| **Badan Teks (Body)**    | 16 px (1 rem)     | 24 px (1.5)                  | Nunito 400        | Teks paragraf utama, dialog chat, penjelasan kasus |
| **Badan Teks Tebal**     | 16 px (1 rem)     | 24 px (1.5)                  | Nunito 600 / 700  | Penekanan frasa penting di dalam paragraf          |
| **Keterangan (Caption)** | 14 px (0.875 rem) | 20 px (1.42)                 | Nunito 400 / 600  | Metadata riwayat, teks bantuan input, catatan kaki |

### Aturan Pakai Tipografi

1. **Penekanan Frasa**: Gunakan bobot semi-tebal (`font-weight: 600` atau `700`), **bukan HURUF KAPITAL SEMUA (ALL CAPS)**. Huruf kapital memberi kesan membentak atau menakut-nakuti.
2. **Keterbacaan Utama**: Hindari penggunaan jenis huruf tulisan tangan (_handwriting / script fonts_) untuk badan teks atau penjelasan panjang.
3. **Disiplin Huruf**: Jangan menambah jenis huruf ketiga agar hierarki visual tetap rapi dan ringan dimuat.

---

## 6. Bentuk dan Komponen

### Karakteristik Bentuk

- **Sudut Membulat Ramah**: Gunakan radius lengkung besar antara **16 px (`rounded-2xl`) hingga 24 px (`rounded-3xl`)** pada tombol, kartu, dan kotak dialog.
- **Target Sentuh Nyaman**: Seluruh tombol interaktif memiliki tinggi minimal **44 px** agar mudah ditekan di layar sentuh ponsel.
- **Sentuhan Buatan Tangan (_Handmade Accent_)**: Aksen garis bawah bergelombang (_wavy underline_) berwarna jingga `#FF9A3C` atau biru `#8ECDF0` dapat disematkan di bawah kata kunci judul utama. Gunakan secara hemat (maksimal 1-2 per halaman) agar tetap terasa istimewa.

### Gaya Komponen Utama

- **Tombol Utama (_Primary Button_)**:  
  Latar jingga `#FF9A3C`, teks cokelat tua `#3B2A1E` (bobot 700), sudut membulat 20 px, tinggi 44–48 px. Keadaan hover memberikan pergeseran kecerahan halus tanpa efek bayangan gelap.
- **Tombol Sekunder (_Secondary Button_)**:  
  Latar transparan atau putih krem, garis batas (_border_) 2 px berwarna `#FF9A3C` atau `#8ECDF0`, teks cokelat tua `#3B2A1E`, sudut membulat 20 px.
- **Kartu Hasil (_Result Card_)**:  
  Wadah berwarna krem bersih berbingkai halus `#8ECDF0` atau `#FFE27A`, sudut lengkung 24 px, berisi lencana status di bagian atas, potongan pesan yang dianalisis, rincian kejanggalan, serta tombol aksi ke pedoman.
- **Lencana Status (_Status Badge / Pill_)**:  
  Komponen pil membulat penuh (_rounded-full_) dengan bantalan dalam yang lega (_padding_ `py-1.5 px-4`), teks tebal, dan menyertakan ikon sederhana di sebelah kiri teks label.
- **Kotak Input (_Input Box & Dropzone_)**:  
  Latar putih krem lembut, sudut lengkung 16 px, garis tepi 2 px berwarna `#8ECDF0` saat kondisi netral, dan berganti menjadi `#FF9A3C` saat fokus (_focus ring_).
- **Tab Pemeriksa (_Segmented Tabs: Teks, Gambar, Tautan/Video_)**:  
  Deretan tab berbentuk kapsul membulat. Tab yang sedang aktif memiliki latar jingga `#FF9A3C` dengan teks `#3B2A1E` tebal, sedangkan tab non-aktif berlatar transparan dengan teks cokelat susu `#6B5646`.

### Maskot Pendamping: "Koro" si Kaca Pembesar

- **Bentuk**: Kaca pembesar bergaya kartun minimalis dengan dua mata ramah dan senyum hangat.
- **Peran**: Menemani pengguna di halaman hasil pemeriksaan dan simulasi keputusan.
- **Ekspresi**:
    - _Mikir santai_: Muncul saat menganalisis konten.
    - _Mengajak waspada_: Memegang dagu sambil menunjuk bagian janggal.
    - _Tos / Senyum jempol_: Mengapresiasi pengguna saat berhasil mengenali pola mencurigakan di sesi simulasi.

---

## 7. Gaya Bahasa (_Tone of Voice_)

CEKARA bertutur seperti teman sebaya satu sekolah yang cerdas, tidak sok tahu, dan setia kawan. Bahasa yang digunakan luwes, santai, jelas, dan menghindari jargon hukum/keamanan siber yang memusingkan.

### 5 Contoh Microcopy Resmi

1. _"Tenang, kita cek bareng."_ (Penyambut di beranda dan tab input)
2. _"Kerja beneran biasanya yang membayar kamu, bukan kamu yang membayar."_ (Catatan edukasi untuk modus penipuan tugas berbayar)
3. _"Tawaran ini kelihatan buru-buru banget, ada apa ya kira-kira?"_ (Sorotan pada pola manipulasi psikologis tergesa-gesa)
4. _"Pilihan bagus! Kamu jeli melihat tautan aneh yang diselipkan."_ (Umpan balik positif di sesi simulasi kasus)
5. _"Belum nemu keanehan sih, tapi kalau firasatmu ragu, jangan diteruskan dulu ya."_ (Penjelasan status belum terdeteksi)

### Tabel Komparasi: Hindari vs Pakai

| Hindari (Kaku, Menggurui, Menakut-nakuti)           | Pakai (Hangat, Edukatif, Memberdayakan)                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Peringatan! Anda terindikasi penipuan berbahaya."  | "Tunggu dulu, ada yang janggal di sini."                                             |
| "Situs ini terbukti aman 100%."                     | "Belum ketemu tanda bahaya, tapi tetap cek ya."                                      |
| "Jangan bodoh mengklik link sembarangan."           | "Tautan dengan akhiran acak begini berisiko, lebih aman diabaikan."                  |
| "Jawaban Anda salah. Pola tersebut adalah phising." | "Hampir tepat! Coba perhatikan lagi nama domainnya, ada satu huruf yang disamarkan." |
| "Segera hubungi pihak kepolisian sekarang juga!"    | "Yuk amankan akunmu dulu, setelah itu kita pelajari cara lapornya bareng-bareng."    |
| "Sistem mendeteksi anomali pada payload pesan."     | "Pesan ini memakai nomor asing dan minta kode rahasiamu, itu tanda bahaya."          |

---

## 8. Daftar "Boleh" dan "Jangan"

### Boleh Dilakukan (Do's)

- Memakai sudut membulat yang ramah dan konsisten (16–24 px).
- Menjaga tampilan selalu datar (_flat_), bersih, dan bernuansa hangat.
- Selalu menyertakan teks penjelas bersama penanda warna risiko.
- Memberikan ruang sentuh minimal 44 px untuk kenyamanan navigasi ponsel.
- Menampilkan garis bawah bergelombang secara hemat sebagai aksen unik.
- Menggunakan padanan kata bahasa Indonesia yang akrab bagi kalangan pelajar.

### Jangan Dilakukan (Don'ts)

- **Jangan gunakan warna hijau** untuk memberi label "aman".
- **Jangan gunakan gradasi (_gradients_), efek pendar neon (_glow_), atau bayangan gelap pekat**.
- **Jangan jadikan warna jingga `#FF9A3C` sebagai warna teks di atas latar krem**.
- **Jangan pakai warna terakota `#D4573A` untuk teks berukuran kecil** (wajib pakai varian `#A8412A`).
- **Jangan menulis kalimat penekanan dengan huruf kapital semua (ALL CAPS)**.
- **Jangan menambah jenis huruf ketiga** di luar Fredoka dan Nunito.
- **Jangan menggunakan kata-kata yang memojokkan korban penipuan**.

---

## 9. Cuplikan CSS Variables (`:root`)

Sisipkan tautan font Google berikut di bagian `<head>` berkas HTML atau impor langsung di berkas CSS utama:

```html
<!-- Google Fonts: Fredoka & Nunito -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
    href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700&display=swap"
    rel="stylesheet"
/>
```

Deklarasi variabel CSS lengkap:

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700&display=swap');

:root {
    /* Tipografi */
    --font-heading: 'Fredoka', system-ui, -apple-system, sans-serif;
    --font-body: 'Nunito', system-ui, -apple-system, sans-serif;

    /* Skala Huruf & Tinggi Baris */
    --text-h1: 2rem; /* 32px */
    --leading-h1: 2.5rem; /* 40px */
    --text-h2: 1.5rem; /* 24px */
    --leading-h2: 2rem; /* 32px */
    --text-h3: 1.25rem; /* 20px */
    --leading-h3: 1.75rem; /* 28px */
    --text-body: 1rem; /* 16px */
    --leading-body: 1.5rem; /* 24px */
    --text-caption: 0.875rem; /* 14px */
    --leading-caption: 1.25rem; /* 20px */

    /* Palet Warna: Es Jeruk dan Krem */
    --color-bg: #fff8ec; /* Latar halaman (krem hangat) */
    --color-primary: #ff9a3c; /* Aksen utama / tombol (jingga es jeruk) */
    --color-companion: #8ecdf0; /* Pendamping / kartu / status netral (biru langit) */
    --color-highlight: #ffe27a; /* Sorotan / risiko sedang (kuning mentega) */
    --color-text: #3b2a1e; /* Teks utama (cokelat tua) */
    --color-text-secondary: #6b5646; /* Teks sekunder (cokelat susu) */
    --color-warning-strong: #d4573a; /* Peringatan kuat elemen besar (terakota) */

    /* Varian Turunan Aksesibilitas Kontras */
    --color-warning-text: #a8412a; /* Terakota pekat (kontras 5.2:1 untuk teks kecil di atas krem) */

    /* Geometri & Komponen */
    --radius-sm: 12px;
    --radius-md: 16px;
    --radius-lg: 20px;
    --radius-xl: 24px;
    --radius-pill: 9999px;
    --touch-target-min: 44px;
}
```
