# Sikasep Design System — Master Specification
> **Sistem Kasir Suara Enterpreneur Purwakarta (Sikasep)**  
> Versi: 1.0.0 | Status: Active & Source of Truth  
> Lingkup: Web App (Mobile-First POS, Responsive 375px hingga Desktop)

---

## 1. Filosofi & Karakter Desain

Sikasep menggabungkan ketangkasan sistem kasir modern dengan kehangatan kearifan lokal Purwakarta tanpa jatuh ke jurang klise atau ornamen berlebihan (*no tacky gimmicks*).
* **Jiwa Produk**: Hangat, Membumi, Sat-Set (Cepat & Efisien), Tangguh.
* **Inspirasi Utama**: Kerajinan Gerabah & Keramik Plered Purwakarta, anyaman bambu Wanayasa, serta etos kerja wirausaha Sunda.
* **Prinsip Interaksi**: *Zero Ambiguity, Hybrid Agility* — Kasir tidak boleh ragu saat transaksi berlangsung; suara mempercepat, sentuhan menyempurnakan.

---

## 2. Palet Warna (Inspirasi Keramik Plered)

> **Aturan Mutlak**: Dilarang menggunakan gradasi ungu/biru futuristik atau warna neon sintetis. Semua warna berakar dari pigmen alam tanah liat, gerabah bakar, dan arang kayu.

### 2.1 Nilai Token Warna & Peran

| Token CSS | Hex Code | Nama Filosofis | Penggunaan & Kontras |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#9A3412` | **Plered Terracotta (Tua)** | Tombol aksi utama, aksen status aktif, badge sorotan. Kontras > 5:1 thd background. |
| `--color-primary-hover` | `#7C2D12` | **Bakar Matang** | Interaksi hover/pressed pada elemen primer. |
| `--color-secondary` | `#C2410C` | **Gerabah Merah** | Tombol aksi sekunder, ikon sorotan, pill tab aktif. |
| `--color-clay` | `#78350F` | **Tanah Liat Basah** | Elemen border struktural, divider kontras, aksen pendukung. |
| `--color-background` | `#FFFBEB` | **Krem Alami / Warm Sand** | Latar belakang kanvas aplikasi. Hangat di mata kasir saat pencahayaan terik. |
| `--color-surface` | `#FFFFFF` | **Kapur Putih Bersih** | Kartu menu, panel struk, modal pop-up, dropdown. |
| `--color-surface-muted` | `#FDF6E2` | **Krem Panggang** | Background draf pesanan, hover row tabel, kartu tertekan. |
| `--color-foreground` | `#1C1917` | **Arang Kayu (Charcoal)** | Teks utama, judul, total harga. Kontras rasio > 12:1 terhadap background krem. |
| `--color-foreground-muted`| `#57534E` | **Abu Batu** | Deskripsi item, placeholder input, label sekunder. Rasio > 4.8:1 thd krem. |
| `--color-border` | `#E7E0D3` | **Lempung Kering** | Garis batas kartu, garis pemisah struk, input border. |
| `--color-border-active` | `#9A3412` | **Fokus Terakota** | Ring fokus aksesibilitas (`outline` / `ring-2`). |
| `--color-success` | `#15803D` | **Daun Pisang** | Transaksi sukses, pesanan tersimpan, status lunas. |
| `--color-danger` | `#B91C1C` | **Bata Merah** | Hapus item, batalkan pesanan, peringatan stok habis. |
| `--color-warning` | `#B45309` | **Kunyit Matang** | Draf butuh review, peringatan koneksi audio terputus. |

### 2.2 Variabel CSS (`:root`)
```css
:root {
  --color-primary: #9A3412;
  --color-primary-hover: #7C2D12;
  --color-secondary: #C2410C;
  --color-clay: #78350F;
  --color-background: #FFFBEB;
  --color-surface: #FFFFFF;
  --color-surface-muted: #FDF6E2;
  --color-foreground: #1C1917;
  --color-foreground-muted: #57534E;
  --color-border: #E7E0D3;
  --color-border-active: #9A3412;
  --color-success: #15803D;
  --color-danger: #B91C1C;
  --color-warning: #B45309;

  /* Jarak & Ergonomi */
  --touch-target-min: 48px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 3. Tipografi & Tata Angka

Kombinasi tipografi dirancang untuk kehangatan humanis pada tajuk, keterbacaan tinggi pada katalog dan struk, serta kejelasan nilai nominal uang.

* **Judul & Tajuk (Display/Heading)**: `Plus Jakarta Sans` / `Outfit` / `Fraunces` (SemiBold – Bold, berat 600–700). Memberikan kesan bersahabat, tegas, dan modern.
* **Isi & Teks Antarmuka (Body/UI)**: `Plus Jakarta Sans` / `Inter` (Regular – Medium, berat 400–500). Mudah dibaca pada layar kecil 375px.
* **Harga & Nominal Uang (Financial Numbers)**: `tabular-nums` atau `font-mono` tebal. Seluruh angka harga harus rata tegak (*vertically aligned*) agar kasir bisa menjumlahkan dan memeriksa angka secara instan.

### 3.1 Skala Tipografi
| Tingkat | Ukuran | Berat | Line Height | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title / Banner** | 28px – 32px | 700 (Bold) | 1.2 | Header kasir & login |
| **Section Title** | 20px – 24px | 700 (Bold) | 1.3 | Judul katalog / ringkasan struk |
| **Card Title / Menu Name**| 16px – 18px | 600 (SemiBold) | 1.35 | Nama produk di quick grid |
| **Total Price (Display)** | 24px – 32px | 800 (ExtraBold) | 1.1 | Total bayar di bottom summary |
| **Item Price** | 15px – 16px | 700 (Bold) | 1.25 | Harga per item (tabular nums) |
| **Body Regular** | 14px – 15px | 400 (Regular) | 1.5 | Label form, deskripsi status |
| **Caption / Hint** | 12px – 13px | 500 (Medium) | 1.4 | Teks bantuan, sapaan kasir |

---

## 4. Motif & Pola Latar: Batik Rereng Kendi

* **Bentuk**: Stilasi garis minimalis kendi air Plered yang berderet diagonal halus (*rereng*).
* **Penempatan Terbatas**: Hanya digunakan sebagai aksen latar belakang pada:
  1. Header bilah atas (Top App Bar).
  2. Kartu Login / Autentikasi wirausaha.
  3. Header cetak struk digital / PDF.
* **Aturan Ketat Opasitas**: Opasitas maksimal **4% – 6%** pada tema terang agar tidak mengganggu kontras teks maupun tombol. **Dilarang** diletakkan di belakang daftar transaksi aktif atau quick grid menu.

```svg
<!-- Pola SVG Rereng Kendi Minimal (Seamless Pattern) -->
<pattern id="rereng-kendi-subtle" width="48" height="48" patternUnits="userSpaceOnUse">
  <path d="M24 6 C22 6 20 8 20 11 L18 18 C15 21 14 26 16 31 C18 36 24 38 24 38 C24 38 30 36 32 31 C34 26 33 21 30 18 L28 11 C28 8 26 6 24 6 Z" 
        fill="none" stroke="#9A3412" stroke-width="1.2" opacity="0.05" />
</pattern>
```

---

## 5. Ilustrasi & Ikonografi

* **DILARANG MENGGUNAKAN EMOJI SEBAGAI IKON**.
* Gunakan ikon garis SVG murni (*Monoline line-weight 1.75px – 2px*) yang selaras dengan Lucide Icons.
* **Ikon Khas Purwakarta**:
  * **Kendi Air**: Digunakan untuk identitas logo, status sistem, atau menu minuman tradisional.
  * **Anglo / Gerabah Api**: Simbol pemrosesan dapur, pesanan diproses, atau sajian panas (seperti Sate Maranggi).
  * **Iket Sunda (Siluet Garis)**: Simbol profil pengusaha / kasir aktif, sapaan "Sampurasun!".
* Semua tombol ikon wajib memiliki `aria-label` yang jelas untuk teknologi pembaca layar (screen reader).

---

## 6. Pola Interaksi: Alur Hybrid Suara + Sentuh

Sikasep menggunakan filosofi **"Suara Mempercepat, Sentuhan Menyempurnakan"**.

```
   [ Pelanggan Bicara / Memesan ]
                 │
                 ▼
      [ Kasir Tekan Tombol Mic ] 
                 │ (Ucapkan: "Sate maranggi dua, es kalapa hiji")
                 ▼
      [ Draf Pesanan Terbentuk ] ◄── [ Atau Tap Langsung Quick Grid ]
                 │
                 ▼
  ┌──────────────────────────────────────────────┐
  │  Mode Review Draf Transaksi (Bisa Diedit):  │
  │  • Koreksi jumlah (+ / -)                     │
  │  • Hapus item jika salah dengar              │
  │  • Fallback: Ketik pencarian / Pilih manual  │
  └──────────────────────────────────────────────┘
                 │
                 ▼
      [ Kasir Tap Konfirmasi Bayar ]
                 │
                 ▼
  [ Struk Final Tercetak / Tersimpan ke Database ]
```

### 6.1 Komponen Kunci Layar Kasir
1. **Quick Grid Menu Terlaris (Atas/Tengah)**:
   * Menampilkan 6–12 item paling sering dipesan (misal: Sate Maranggi Daging, Campur Lemak, Es Kelapa, Nasi Timbel, Simping).
   * Tap kartu untuk langsung menambah +1 kuantitas ke keranjang.
2. **Tombol Suara Permanen (Floating Thumb Bar)**:
   * Terletak di area bawah layar (*Bottom Thumb Zone*), ukuran diameter minimal 64px, mudah dijangkau satu tangan.
   * Visual feedback saat mendengar: Denyut gelombang lembut terakota (*pulsing ring*).
3. **Panel Keranjang / Draf Pesanan**:
   * Setiap item hasil suara masuk dengan status *Draf Belum Terkonfirmasi*.
   * Dilengkapi kontrol kuantitas cepat `[ - ] [ Qty ] [ + ]` dan tombol hapus instan.
4. **Fallback Ketik / Pilih Manual**:
   * Jika mikrofon menangkap dialek campur yang ambigu (contoh: *"sate maranggi sapuluh tusuk ulah lada teuing"*), sistem menampilkan tebakan terbaik disertai tombol koreksi: *"Cari menu lain..."*
5. **Konfirmasi Final Non-Otomatis**:
   * Dilarang melakukan *silent auto-commit*. Transaksi hanya dinyatakan sah dan terbit struk setelah kasir menekan tombol primer bertuliskan: **"Konfirmasi Transaksi • Rp [Total]"**.

---

## 7. Panduan Copywriting & Bahasa

* **Bahasa Dasar**: Bahasa Indonesia formal-santun yang lugas dan ringkas.
* **Sapaan Sunda (Digunakan Secara Tepat & Proporsional)**:
  * Pembuka / Header Dashboard: *"Sampurasun, Juragan!"* atau *"Wilujeng sumping!"*
  * Tombol Aksi / Silakan: *"Mangga periksa pesanan"*
  * Selesai / Struk Berhasil: *"Hatur nuhun! Transaksi parantos kacatet."*
  * Pembatalan / Peringatan: *"Leres bade dibatalkeun?"*
* **Hindari**: Penggunaan bahasa Sunda kasar atau jargon yang membuat pengguna luar Jawa Barat bingung. Istilah fungsional keuangan tetap menggunakan standar umum (*Total*, *Kembalian*, *Metode Pembayaran*, *Tunai*, *QRIS*).

---

## 8. Standar Aksesibilitas & Responsivitas (WCAG AA)

* **Rasio Kontras**: Minimal **4.5:1** untuk teks standar (14–16px) dan minimal **3.0:1** untuk teks berukuran besar (≥18px tebal).
* **Area Sentuh (Touch Target)**: Minimal **48 × 48px** dengan jarak antar-tombol minimal 8px untuk mencegah salah pencet di layar smartphone berminyak/basah.
* **Rentang Resolusi**:
  * **Mobile (375px – 430px)**: Tata letak kolom tunggal, bilah suara mengambang di bawah jempol, keranjang berupa bottom drawer / sheet.
  * **Tablet (768px – 1024px)**: Tata letak 2 kolom (Katalog menu di kiri, keranjang & struk draf di kanan).
  * **Desktop (1024px+)**: Tampilan POS lengkap dengan shortcut keyboard numerik.
* **Indikator Status Audio**: Menyediakan indikator visual (teks berkedip/status ring) bagi kasir di lingkungan bising agar tidak bergantung hanya pada suara speaker.
