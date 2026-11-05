# ATURAN-DESAIN.md: Pedoman Anti-Slop & Desain Komponen CEKARA
*Wajib dibaca dan dipatuhi oleh AI dan pengembang sebelum membuat tampilan, kode komponen, atau teks.*

---

## 1. Tujuan File dan Cara Memakainya

File ini adalah acuan mutlak untuk seluruh desain antarmuka, komponen kode, dan penulisan teks (*copywriting*) pada aplikasi web **CEKARA**. 

Tujuan file ini adalah memastikan hasil pengerjaan terasa dibuat dengan niat, empati, dan sentuhan manusia asli—bukan hasil generasi instan "AI slop" yang generik, hambar, dan malas.

### Alur Kerja Wajib untuk AI:
1. **Baca dan pahami seluruh aturan di file ini** sebelum menulis sebaris kode antarmuka pun.
2. **Patuhi batasan warna, tipografi, dan gaya bahasa** secara ketat. Dilarang menambah warna atau huruf di luar yang sudah ditentukan.
3. **Uji hasil pekerjaanmu** dengan [Bagian 10: Daftar Periksa Sebelum Menyerahkan Hasil](#10-daftar-periksa-sebelum-menyerahkan-hasil). Jika ada satu poin saja yang gagal, perbaiki sebelum menyerahkan jawaban.

---

## 2. Daftar Pola "AI Slop" yang DILARANG

Tabel berikut mencantumkan kebiasaan buruk yang sering dihasilkan oleh AI secara otomatis. Semua pola di kolom kiri **dilarang keras** hadir di kode maupun desain CEKARA.

| Pola Terlarang | Kenapa Buruk | Gantinya di CEKARA |
|---|---|---|
| **Gradasi warna halus (*gradient* ungu-biru, latar gradasi mengambang), efek *glassmorphism*, efek *glow*, dan bayangan lembut berlebih.** | Terlihat murahan, klise template AI, mengaburkan kontras, dan membebani mata. | Tampilan **datar murni (*flat design*)**. Latar krem `#FFF8EC`, batas garis padat tipis, tanpa gradasi, tanpa kaca buram, tanpa bayangan neon. |
| **Warna ungu (*purple/indigo*), *teal/mint* khas fintech, atau warna neon menyala.** | Identitas generik template SaaS modern yang dingin dan berjarak dengan remaja Indonesia. | Pakai palet resmi: Jingga es jeruk `#FF9A3C`, Biru langit `#8ECDF0`, Kuning mentega `#FFE27A`, Cokelat tua `#3B2A1E`, dan Terakota `#D4573A`. |
| **Emoji dijadikan ikon atau hiasan antarmuka (misal: 🚨, ⚠️, 🔒, 💡, 🔥, ✨).** | Tampilan emoji berbeda-beda di tiap sistem operasi, merusak kerapian tata letak, dan terkesan tidak profesional. | Gunakan **SVG garis sederhana (*stroke*)** dengan ketebalan seragam (1.5 px atau 2 px) dan warna teks/aksen yang ditentukan. |
| **Kartu dengan garis tebal di sisi kiri (*colored left border card*).** | Pola usang template dashboard korporat yang kaku dan membosankan. | Kartu berbingkai keliling utuh dengan radius lengkung besar (16–24 px) atau perbedaan latar warna datar yang kontras. |
| **Tiga kartu fitur identik berderet kaku sebagai satu-satunya isi halaman; semua teks rata tengah; ukuran dan jarak seragam monoton.** | Tata letak malas yang tidak memiliki hierarki visual; membuat mata lelah karena tidak tahu mana fokus utama. | Struktur halaman asimetris bermakna: satu fokus utama (kotak pemeriksa), diikuti kartu simulasi dengan hierarki jelas. Teks panjang selalu **rata kiri**. |
| **Hero generik: judul raksasa puitis, subjudul panjang, dua tombol berdampingan, lalu ilustrasi 3D abstrak atau bentuk *blob*.** | Pola tipikal halaman promosi palsu yang tidak menyelesaikan masalah nyata pengguna. | Hero fungsional langsung ke inti: sapaan ramah santai satu kalimat, tab pemeriksa aktif, dan peringatan privasi jelas di tempat input. |
| **Ilustrasi 3D mengkilap atau foto stok orang kantoran berjas barat yang tidak relevan dengan pelajar Indonesia.** | Mengasingkan pengguna; tidak mencerminkan suasana nyata pelajar SMP, SMA/SMK, atau mahasiswa baru di Indonesia. | Ruang kosong bersih, penanda tempat berlabel, atau ilustrasi garis sederhana bertema keseharian sekolah/kantin. |
| **Teks pengisi (*lorem ipsum*), angka statistik fiktif ("99.9% Akurat"), testimoni karangan, logo "Dipercaya oleh", klaim "Digunakan ribuan orang".** | Menipu pengguna, tidak etis, merusak integritas produk prototipe, dan melanggar prinsip kejujuran. | Teks nyata kontekstual. Jika data belum tersedia, tuliskan *placeholder* berlabel jelas seperti `[ISI JUMLAH PENGGUNA]`. |
| **Frasa klise AI: "revolusioner", "powered by AI", "solusi terdepan", "tingkatkan produktivitasmu", "seamless", "unlock your potential".** | Bahasa pemasaran kosong tanpa substansi yang membuat pelajar merasa canggung dan malas membaca. | Bahasa manusia sehari-hari: *"Tenang, kita cek bareng"*, *"Yuk periksa tautannya"*, *"Kenali polanya sebelum klik"*. |
| **Garis pembatas acak, lencana (*badges*) dekoratif tanpa arti, dan bintang-bintang kecil hiasan.** | Menambah polusi visual dan mengaburkan informasi penting. | Setiap garis dan kotak harus punya fungsi penampung data yang konkret. Hiasan grafis hanya garis bergelombang pada judul, dipakai sangat hemat. |
| **Animasi berlebih: elemen memantul (*bounce*), berputar liar (*spin*), atau efek paralaks bertingkat.** | Mengganggu konsentrasi membaca, memperlambat performa ponsel murah, dan memicu pusing. | Transisi sederhana berdurasi cepat (maksimal 150–200 ms) hanya untuk interaksi tombol (*hover/active*) dan pergantian tab. |

---

## 3. Prinsip Tata Letak

1. **Satu Halaman, Satu Fokus Utama**: Jangan buat pengguna bingung memilih aksi. Di halaman utama, fokus utamanya adalah **alat pemeriksa pesan/tautan/gambar**. Simulasi dan riwayat adalah langkah lanjutan.
2. **Skala Jarak Berbasis 8 px**: Semua ukuran *margin*, *padding*, dan celah antar-elemen (*gap*) wajib menggunakan kelipatan 8:
   * `8px` (`0.5rem`) - jarak antar teks kecil dan ikon
   * `16px` (`1rem`) - bantalan dalam tombol, jarak antar form input
   * `24px` (`1.5rem`) - bantalan dalam kartu (*padding*)
   * `32px` (`2rem`) - jarak antar bagian kecil
   * `48px` (`3rem`) - jarak antar seksi utama di tampilan ponsel
   * `64px` (`4rem`) - jarak antar seksi utama di tampilan desktop
3. **Lebar Baca Teks Terkendali**: Batasi lebar baris paragraf maksimal **65 karakter** (sekitar `480px` sampai `640px` / `max-w-prose`) agar mata pelajar tidak lelah saat berpindah baris.
4. **Perataan Teks Alami**: Teks panjang, paragraf penjelasan, dan dialog selalu **rata kiri (*text-left*)**. Rata tengah (*text-center*) hanya diizinkan untuk judul pendek (maksimal 2 baris) atau teks label pendek di dalam tombol.
5. **Urutan Visual Mengikuti Alur Kognitif**:
   * **Kenali (*Recognize*)**: Area input dan deteksi tanda bahaya.
   * **Belajar (*Learn*)**: Penjelasan mengapa tanda itu berbahaya & latihan kasus.
   * **Bertindak (*Act*)**: Daftar periksa langkah penyelamatan diri.
6. **Desain Ponsel Dahulu (*Mobile-First*)**: Rancang dan uji terlebih dahulu pada lebar layar **360 px – 412 px** (perangkat umum pelajar), baru kemudian sesuaikan untuk layar tablet dan desktop.

---

## 4. Aturan Komponen

Semua komponen wajib memiliki tampilan spesifik untuk setiap status interaksi (*state*), terutama status **kosong (*empty*)**, **memuat (*loading*)**, dan **galat (*error*)**.

### 1. Tombol Utama (*Primary Button*)
* **Warna**: Latar jingga `#FF9A3C`, teks cokelat tua `#3B2A1E`, bobot teks 700 (Fredoka atau Nunito Bold).
* **Ukuran & Sudut**: Tinggi minimal 44 px (ideal 48 px), sudut membulat 20 px (`rounded-[20px]`). Bantalan: `px-6 py-3`.
* **Keadaan (States)**:
  * *Normal*: Latar `#FF9A3C`, teks `#3B2A1E`.
  * *Hover*: Latar `#F28A27` (jingga sedikit lebih pekat), kursor *pointer*.
  * *Fokus*: Garis luar (*outline*) tegas 2 px warna `#3B2A1E` dengan jarak celah (*offset*) 2 px.
  * *Nonaktif (Disabled)*: Latar `#EADECB`, teks `#6B5646`, kursor *not-allowed*, tanpa efek klik.
  * *Memuat (Loading)*: Teks berganti menjadi "Sedang memeriksa...", ikon roda garis sederhana berputar lembut, tombol tidak bisa diklik.

### 2. Tombol Sekunder (*Secondary Button*)
* **Warna**: Latar transparan atau `#FFF8EC`, garis batas 2 px warna `#FF9A3C` atau `#8ECDF0`, teks `#3B2A1E`.
* **Ukuran & Sudut**: Tinggi minimal 44 px, sudut membulat 20 px.
* **Keadaan**: *Hover* latar terisi warna garis batas dengan opasitas tipis.

### 3. Kotak Input Teks & Unggah (*Input Field & Dropzone*)
* **Warna**: Latar `#FFFFFF` atau krem sangat terang, border 2 px `#8ECDF0`, teks `#3B2A1E`, placeholder `#6B5646`.
* **Ukuran & Sudut**: Sudut membulat 16 px (`rounded-2xl`). Area textarea minimal tinggi 140 px.
* **Keadaan**:
  * *Fokus*: Border berubah menjadi jingga `#FF9A3C`, cincin fokus terlihat jelas.
  * *Galat (Error)*: Border berubah menjadi terakota `#D4573A`. Teks pesan galat tampil di bawah kotak dengan warna `#A8412A` (ukuran 14 px, jelas dan ada instruksi perbaikan).
  * *Kosong*: Tampilkan contoh placeholder kontekstual yang akrab (misal: *"Tempel pesan chat WhatsApp atau SMS tawaran kerja di sini..."*).

### 4. Tab Pemeriksa (Teks, Gambar, Tautan/Video)
* **Bentuk**: *Segmented control* berbentuk kapsul membulat penuh (`rounded-full`), bantalan kontainer `p-1.5`, latar wadah `#EFE3D0`.
* **Tab Aktif**: Latar jingga `#FF9A3C`, teks `#3B2A1E` tebal, sudut kapsul.
* **Tab Nonaktif**: Latar transparan, teks `#6B5646`, hover teks menjadi `#3B2A1E`.

### 5. Kartu Hasil Pemeriksaan (*Result Card*)
* **Warna & Sudut**: Latar `#FFFFFF`, garis batas 2 px warna sesuai status risiko, sudut 24 px (`rounded-3xl`), bantalan `p-6`.
* **Hierarki Isi**:
  1. Bagian atas: Lencana status hasil (Tinggi / Sedang / Belum terdeteksi) beserta ikon pendukung.
  2. Bagian tengah: Teks/tangkapan layar yang diperiksa, dengan frasa berisiko ditandai latar kuning mentega `#FFE27A`.
  3. Bagian bawah: Penjelasan ramah "Kenapa ini mencurigakan" dan tombol menuju pedoman bertindak.
* **Keadaan Memuat (*Loading State*)**: Kerangka kotak (*skeleton*) berwarna `#EFE3D0` tanpa animasi berkedip menyilaukan; teks status: *"Koro sedang membaca pesanmu..."*.
* **Keadaan Galat (*Error State*)**: Kartu border `#D4573A`, teks: *"Pemeriksaan belum selesai karena koneksi terputus. Tenang, kamu bisa coba tekan tombol di bawah lagi."* + tombol "Coba Periksa Lagi".

### 6. Lencana Status (*Status Badge*)
* Bentuk pil (`rounded-full`), tinggi minimal 32 px, bantalan horizontal `px-4`.
* **Tinggi**: Latar `#D4573A`, teks putih tebal, label: `"Hati-hati, ini mencurigakan"`.
* **Sedang**: Latar `#FFE27A`, teks `#3B2A1E` tebal, label: `"Yuk cek dulu"`.
* **Belum terdeteksi**: Latar `#8ECDF0`, teks `#3B2A1E` tebal, label: `"Belum ketemu tanda bahaya, tapi tetap cek ya"`.

### 7. Daftar Riwayat (*Recent History*)
* Berisi daftar kartu ringkas pemeriksaan sebelumnya (tanggal, jenis input, status hasil, tombol buka kembali, tombol hapus).
* **Keadaan Kosong (*Empty State*)**: Wajib dirancang sopan dan ramah:
  * Ilustrasi penanda tempat bertema kaca pembesar santai.
  * Judul: *"Belum ada riwayat pemeriksaan"*.
  * Deskripsi: *"Pesan atau link yang kamu cek nanti bakal tersimpan rapi di sini biar gampang dibaca lagi."*
  * Tombol aksi: *"Mulai Cek Sesuatu"*.

### 8. Kartu Simulasi Kasus (*Simulation Card*)
* Memuat skenario penipuan nyata (misal: chat modus tugas berbayar di Telegram).
* Sudut 20 px, opsi pilihan jawaban berupa tombol radio berbentuk kartu lebar yang berubah warna saat dipilih.
* Kotak umpan balik langsung (*feedback box*) tampil setelah memilih, menjelaskan manipulasi psikologis di balik skenario tersebut.

### 9. Kotak Pedoman Bertindak (*Action Guide Box*)
* Berupa *checklist* interaktif (langkah 1, langkah 2, langkah 3).
* Menggunakan ikon SVG sederhana (centang, kunci gembok, salin tautan pelaporan resmi OJK).

---

## 5. Ikon dan Ilustrasi

1. **Format Ikon**: Wajib SVG murni bergaris (*outline stroke*), ketebalan garis seragam (1.5 px atau 2 px), sudut garis membulat (*stroke-linecap="round" stroke-linejoin="round"*).
2. **Dilarang Menggunakan Emoji**: Jangan letakkan emoji di dalam tombol, judul, atau sebagai penanda status.
3. **Hiasan Garis Bergelombang (*Wavy Underline*)**: Gunakan hiasan SVG garis bergelombang buatan tangan di bawah kata kunci judul utama (warna `#FF9A3C` atau `#8ECDF0`). Maksimal 1 kali kemunculan dalam satu halaman.
4. **Maskot "Koro" si Kaca Pembesar**:
   * Karakter ramah bergaya kartun minimalis.
   * Hanya boleh muncul pada: (1) kartu hasil pemeriksaan, (2) halaman simulasi saat memberi umpan balik, dan (3) halaman kosong riwayat.
   * **Dilarang** membuat maskot bergaya menyeramkan, polisi galak, atau alien futuristik.
5. **Penanganan Aset Gambar**: Jika aset ilustrasi resmi belum tersedia, gunakan kontainer abu-krem `#EFE3D0` berbingkai putus-putus dengan teks penanda tempat jelas, misalnya: `[ILUSTRASI KORO SEDANG MEMIKIRKAN PESAN]`. Jangan mengarang foto stok acak dari internet!

---

## 6. Penulisan Teks (Copywriting)

Gaya bahasa adalah **teman sebaya yang peduli, santai, dan cerdas**. Hindari kalimat berbelit-belit dan istilah teknis yang tidak perlu.

### Aturan Utama Penulisan:
1. **Dilarang Menggunakan Kata Vonis Mutlak**: Jangan pernah gunakan kata "Pasti Penipuan", "100% Aman", "Terjamin Resmi", atau "Palsu Mutlak". Selalu gunakan terminologi probabilitas: *"Kemungkinan besar"*, *"Ada indikasi ganjil"*, *"Belum ditemukan tanda bahaya"*.
2. **Tombol Harus Spesifik**: Tombol wajib menggunakan kata kerja aksi yang jelas bagi pengguna.
   * *Gunakan*: `"Cek pesan sekarang"`, `"Mulai simulasi"`, `"Buka pedoman aman"`, `"Hapus dari riwayat"`.
   * *Hindari*: `"Kirim"`, `"Submit"`, `"Lanjut"`, `"OK"`, `"Next"`.
3. **Pesan Galat Informatif**: Pesan galat harus menjelaskan apa yang terjadi dan tindakan apa yang bisa dilakukan user.
   * *Contoh galat*: *"Tautan belum lengkap. Coba pastikan formatnya diawali https:// atau tempel ulang tautannya."*
4. **Data Belum Ada Wajib Placeholder**: Jangan pernah membuat angka statistik bohong. Tuliskan `[ISI JUMLAH PENGGUNA]` atau `[ISI KONTAK TIM]`.

### Tabel "Hindari vs Pakai"
| Hindari (Klise AI, Menggurui, Menakut-nakuti) | Pakai di CEKARA (Ramah, Rapi, Sejajar) |
|---|---|
| "PERINGATAN KERAS! Anda terdeteksi menjadi korban phising!" | "Tunggu dulu, ada yang janggal di pesan ini." |
| "Aplikasi kami didukung AI canggih paling mutakhir di Indonesia." | "CEKARA bantu kamu membaca tanda-tanda yang mencurigakan." |
| "Situs web ini 100% aman dan terverifikasi bebas virus." | "Belum ketemu tanda bahaya, tapi tetap cek sebelum percaya ya." |
| "Tingkatkan ketahanan digital Anda untuk masa depan cerah." | "Yuk latih instingmu biar nggak gampang terkecoh tawaran palsu." |
| "Input tidak valid! Format error pada form data." | "Format gambarnya belum pas. Coba unggah file berekstensi JPG atau PNG ya." |
| "Jawaban Anda salah total. Pelajari modul kembali." | "Hampir kena! Coba cek bagian nama pengirimnya, ada satu huruf yang disamarkan." |
| "Harap segera laporkan kejahatan siber ini ke pihak berwenang." | "Yuk amankan akunmu dulu, setelah itu kita pandu cara lapornya ke OJK." |
| "Jangan pernah membagikan kredensial login kepada pihak ketiga." | "Jaga rahasia: jangan pernah kasih kode OTP atau kata sandimu ke siapa pun." |

---

## 7. Aksesibilitas (Wajib Dipenuhi)

1. **Rasio Kontras Warna**:
   * Teks normal (< 18 px) wajib memenuhi kontras minimal **4,5:1** terhadap latarnya.
   * Teks besar (≥ 18 px tebal atau ≥ 24 px normal) minimal **3:1**.
   * *Perhatian khusus*: Di atas latar krem `#FFF8EC`, teks peringatan wajib menggunakan varian terakota gelap **`#A8412A`** (kontras 5,2:1), bukan `#D4573A` (kontras hanya ~3,5:1). Teks di atas tombol jingga `#FF9A3C` wajib cokelat tua **`#3B2A1E`** (kontras 6,1:1).
2. **Ukuran Teks Terkecil**: Teks informasi terkecil (keterangan/caption/meta) tidak boleh kurang dari **14 px**. Teks isi badan standar adalah **16 px**.
3. **Ukuran Target Sentuh (*Touch Target*)**: Seluruh elemen yang bisa diklik atau disentuh (tombol, link, radio button, icon button) wajib memiliki dimensi area sentuh minimal **44 × 44 px**.
4. **Gunakan Semantik HTML Asli**:
   * Gunakan tag `<button>` untuk aksi, bukan `<div onClick=...>`.
   * Gunakan tag `<a>` untuk navigasi halaman.
   * Setiap `<input>` dan `<textarea>` wajib memiliki `<label>` yang terhubung dengan atribut `htmlFor` / `id`.
5. **Indikator Fokus Keyboard**: Jangan hapus `outline` pada elemen yang sedang fokus. Berikan cincin fokus kontras tinggi (`focus-visible:ring-2 focus-visible:ring-[#3B2A1E]`).
6. **Aksesibilitas Ikon**: Ikon interaktif tanpa label teks harus memiliki atribut `aria-label` yang jelas (misal: `aria-label="Hapus riwayat"`).

---

## 8. Prinsip Kejujuran Produk dan Privasi

1. **Peringatan Privasi di Dekat Area Input**: Di bawah atau di atas kotak input teks pemeriksa, wajib selalu tampil teks pengingat:
   > *"Demi keamananmu, jangan tempel kode OTP, kata sandi, PIN, nomor kartu, atau nomor rekening bank di sini ya."*
2. **Transparansi Sistem**: Tampilkan catatan kaki di setiap hasil pemeriksaan:
   > *"Hasil ini merupakan perkiraan berdasarkan kecocokan pola umum. CEKARA bukan penentu hukum final."*
3. **Tanpa Pola Gelap (*Zero Dark Patterns*)**:
   * Tombol batalkan atau hapus riwayat tidak boleh disamarkan atau dibuat transparan agar sulit ditekan.
   * Kotak persetujuan penggunaan data opsional (untuk pengembangan dataset) **tidak boleh dicentang secara otomatis (*opt-in* wajib manual)**.

---

## 9. Proses Kerja untuk AI

Sebelum menulis kode atau teks untuk komponen CEKARA, AI wajib mengeksekusi tahapan berikut:

1. **Membaca**: Teliti dokumen `ATURAN-DESAIN.md` ini dari awal sampai akhir.
2. **Menyatakan Asumsi**: Di awal respons sebelum kode dibuat, tuliskan **tepat 1 baris** asumsi tugas (contoh: *"Asumsi: Merancang komponen tab pemeriksa teks & gambar untuk layar ponsel 375px."*).
3. **Membuat Versi Pertama**: Tulis kode/teks dengan mematuhi seluruh batasan warna, radius, dan tipografi.
4. **Verifikasi Mandiri**: Jalankan [Bagian 10: Daftar Periksa](#10-daftar-periksa-sebelum-menyerahkan-hasil) poin demi poin secara jujur.
5. **Perbaiki Ketidaksesuaian**: Bila ditemukan emoji, warna di luar palet, gradasi, atau teks yang memvonis, perbaiki seketika.
6. **Serahkan Hasil**: Berikan kode akhir yang bersih dan siap diintegrasikan.

*Catatan: Jika ada detail informasi yang kurang atau belum diputuskan, gunakan penanda tempat berlabel seperti `[ISI NAMA KASUS]` atau ajukan 1 pertanyaan spesifik. Jangan pernah mengarang data sendiri.*

---

## 10. Daftar Periksa Sebelum Menyerahkan Hasil

Centang seluruh pertanyaan berikut. Jika ada jawaban **"TIDAK"**, pekerjaanmu belum selesai!

- [ ] 1. Apakah latar belakang menggunakan `#FFF8EC` dan tidak ada gradasi sama sekali?
- [ ] 2. Apakah warna yang dipakai HANYA berasal dari 7 warna resmi + 1 varian `#A8412A`?
- [ ] 3. Apakah sama sekali tidak ada warna hijau untuk menandakan status aman?
- [ ] 4. Apakah tombol jingga `#FF9A3C` memakai teks cokelat tua `#3B2A1E`, bukan teks putih atau jingga di atas krem?
- [ ] 5. Apakah teks kecil berisiko di atas krem menggunakan terakota gelap `#A8412A` (bukan `#D4573A`) demi kontras 4,5:1?
- [ ] 6. Apakah jenis huruf HANYA Fredoka (judul) dan Nunito (isi)? Tidak ada font ketiga?
- [ ] 7. Apakah sudut lengkung kartu dan tombol berada di rentang 16 px hingga 24 px?
- [ ] 8. Apakah tinggi seluruh tombol dan target sentuh minimal 44 px?
- [ ] 9. Apakah bersih dari segala bentuk emoji (🚨, ⚠️, ✨, dsb.)?
- [ ] 10. Apakah ikon menggunakan SVG garis sederhana dengan ketebalan seragam?
- [ ] 11. Apakah sama sekali tidak ada efek *glassmorphism*, *neon glow*, atau bayangan berlebih?
- [ ] 12. Apakah tidak ada angka statistik palsu, testimoni karangan, atau logo "dipercaya oleh"?
- [ ] 13. Apakah bebas dari kata klise AI seperti "revolusioner", "seamless", "powered by AI"?
- [ ] 14. Apakah teks panjang menggunakan perataan kiri (*text-left*) dengan lebar maksimal ~65 karakter?
- [ ] 15. Apakah tombol menggunakan kata kerja spesifik (bukan "Kirim" atau "Submit")?
- [ ] 16. Apakah status hasil menggunakan 3 label resmi ("Hati-hati, ini mencurigakan", "Yuk cek dulu", "Belum ketemu tanda bahaya, tapi tetap cek ya")?
- [ ] 17. Apakah status risiko tidak hanya dibedakan lewat warna, melainkan selalu menyertakan label teks?
- [ ] 18. Apakah sudah dirancang keadaan komponen saat Kosong (*Empty*), Memuat (*Loading*), dan Galat (*Error*)?
- [ ] 19. Apakah ada peringatan privasi untuk tidak memasukkan OTP/kata sandi/PIN di dekat kotak input?
- [ ] 20. Apakah tata letak sudah diuji ramah untuk tampilan layar ponsel sempit (360 px)?

---

## 11. Contoh Baik dan Buruk

### Contoh 1: Hero Beranda Utama
* **Versi Slop (Buruk)**:  
  Latar gradasi ungu ke biru tua dengan bayangan neon mengambang. Judul rata tengah: *"Revolusi Deteksi Cybercrime Berbasis AI Terdepan"*. Subjudul: *"Tingkatkan imunitas digital Anda secara seamless dengan platform yang dipercaya 50.000+ pengguna"*. Terdapat 2 tombol: "Get Started" dan "Learn More", di samping ilustrasi 3D bola kristal menyala.  
  *Alasan Ditolak*: Gradasi terlarang, bahasa klise AI pemasaran, angka statistik palsu, ilustrasi tidak relevan, tidak menyelesaikan masalah pengguna.
* **Versi CEKARA (Sesuai Aturan)**:  
  Latar datar krem hangat `#FFF8EC`. Judul Fredoka rata kiri: *"Dapat pesan mencurigakan? Tenang, kita cek bareng."* dengan hiasan garis bergelombang jingga di bawah kata "cek bareng". Di bawahnya langsung terletak tab pemeriksa aktif (Teks / Gambar / Tautan) dan kotak input textarea dengan placeholder ramah serta peringatan menjaga kerahasiaan OTP di bawahnya.  
  *Alasan Diterima*: Fungsional, hangat, langsung ke tujuan, tidak menipu, bahasa santai setara teman sebaya.

---

### Contoh 2: Kartu Hasil Pemeriksaan
* **Versi Slop (Buruk)**:  
  Kartu gelap dengan border kiri merah menyala. Ikon emoji `🚨🚨🚨 PERINGATAN BAHAYA TINGKAT TINGGI!`. Teks: *"Sistem AI kami mengonfirmasi 98.7% bahwa pesan ini adalah tindak pidana penipuan ilegal. Segera lapor polisi!"*. Tombol merah: *"Laporkan Sekarang"*.  
  *Alasan Ditolak*: Memvonis sepihak, menyebarkan kepanikan, memakai emoji, ada angka statistik karangan, gaya bahasa aparat kaku.
* **Versi CEKARA (Sesuai Aturan)**:  
  Kartu putih berlatar bersih dengan sudut lengkung 24 px dan border 2 px warna terakota `#D4573A`. Lencana atas: pil terakota bertuliskan *"Hati-hati, ini mencurigakan"*. Teks isi: *"Di pesan ini, pengirim meminta kamu mentransfer uang jaminan sebelum mulai bekerja. Di dunia kerja nyata, perusahaan yang membayar karyawan, bukan karyawan yang membayar perusahaan."* Diikuti tombol sekunder: *"Lihat Pedoman Mengamankan Akun"*. Di bagian bawah ada teks keterangan kecil 14 px: *"Hasil ini merupakan perkiraan berdasarkan pola umum. Cek dulu sebelum percaya."*  
  *Alasan Diterima*: Edukatif, menjelaskan logika di balik kecurigaan tanpa memvonis korban, warna dan lencana sesuai aturan.

---

### Contoh 3: Keadaan Kosong (*Empty State*) pada Riwayat
* **Versi Slop (Buruk)**:  
  Layar kosong melompong hanya bertuliskan satu baris teks abu-abu pudar di tengah: *"No data available"*.  
  *Alasan Ditolak*: Malas, tidak manusiawi, tidak ada arahan langkah selanjutnya, bahasa Inggris asing.
* **Versi CEKARA (Sesuai Aturan)**:  
  Wadah kartu berlatar krem muda lembut `#EFE3D0` bergaris batas halus. Terdapat ilustrasi garis sederhana maskot Koro sedang tersenyum ramah. Judul Fredoka 20 px: *"Belum ada riwayat pemeriksaan"*. Deskripsi Nunito 16 px rata tengah: *"Semua pesan, link, atau gambar yang pernah kamu cek bakal tersimpan di sini biar gampang kamu buka lagi nanti."* Tombol aksi jingga: *"Coba Cek Pesan Pertama"*.  
  *Alasan Diterima*: Ramah, mengedukasi fungsi fitur riwayat, memberikan tombol aksi langsung ke fitur utama.

---

## 12. Cuplikan CSS Variables (`:root`)

Tautkan Google Fonts ini di bagian atas:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
```

Deklarasi variabel lengkap pada file CSS aplikasi:
```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;600;700&display=swap');

:root {
  /* Tipografi Resmi */
  --font-heading: 'Fredoka', system-ui, -apple-system, sans-serif;
  --font-body: 'Nunito', system-ui, -apple-system, sans-serif;

  /* Palet Warna "Es Jeruk dan Krem" (Tanpa Gradasi) */
  --color-bg: #FFF8EC;             /* Latar utama halaman */
  --color-primary: #FF9A3C;        /* Aksen utama / tombol / logo */
  --color-companion: #8ECDF0;      /* Pendamping / kartu / border netral */
  --color-highlight: #FFE27A;      /* Sorotan teks risiko / status sedang */
  --color-text: #3B2A1E;           /* Teks utama (cokelat tua) */
  --color-text-secondary: #6B5646; /* Teks sekunder (cokelat susu) */
  --color-warning-strong: #D4573A; /* Peringatan risiko tinggi (elemen besar/tebal) */

  /* Varian Turunan Aksesibilitas (Kontras WCAG AA 4,5:1 di atas krem) */
  --color-warning-text: #A8412A;   /* Khusus teks kecil risiko tinggi di atas #FFF8EC */

  /* Sudut Kelengkungan (Bentuk Ramah) */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-pill: 9999px;

  /* Skala Jarak Berbasis 8px */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;

  /* Ukuran Target Sentuh Minimal */
  --target-touch-min: 44px;
}
```
