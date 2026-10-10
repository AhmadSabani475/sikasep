# Statement of Intent: Sikasep Remake
> **Inisiatif:** Remake Sistem Kasir Digital (POS) Berbasis Suara untuk Wirausaha Purwakarta  
> **Status:** Confirmed by User  
> **Tanggal:** 2026-10-10  
> **Referensi Design System:** [`design-system/sikasep/MASTER.md`](file:///d:/idcamp/design-system/sikasep/MASTER.md)

---

## 1. Outcome
Me-remake aplikasi kasir digital ("suaratoko") menjadi **Sikasep** (*Sistem Kasir Suara Enterpreneur Purwakarta*), platform POS kasir *Hybrid Suara + Sentuh* berbasis web/PWA yang mengusung identitas visual orisinal Purwakarta (Keramik Plered).

## 2. Target Pengguna (User)
* **Primer:** Kasir & wirausaha kuliner / UMKM Purwakarta (kedai Sate Maranggi Wanayasa/Plered, perajin & toko oleh-oleh Simping Purwakarta, warung makan, kafe lokal).
* **Konteks Pemakaian:** Layar sentuh smartphone (375px–430px) di tangan kasir saat melayani antrean pelanggan yang padat, suara bising, dan butuh kecepatan tanpa ribet mengetik.

## 3. Alasan Perubahan (Why Now)
* Tampilan lama menggunakan tema gelap generik (teal/cyan) yang dingin dan tidak memiliki identitas lokal.
* Alur suara lama masih kaku dan rentan salah dengar jika tidak memiliki mekanisme peninjauan (*review draf*) yang fleksibel.
* Diperlukan antarmuka yang ramah di mata kasir di siang hari (warm krem, kontras tinggi), ergonomis untuk jempol, serta mencerminkan kebanggaan lokal wirausaha Purwakarta.

## 4. Kriteria Keberhasilan (Success)
1. **Kecepatan Transaksi:** Kasir dapat mencatat pesanan campuran (misal: "Sate maranggi sapi 2 porsi, es kelapa muda 1") via mic atau sentuhan quick grid dalam < 5 detik.
2. **Koreksi Fleksibel:** Transaksi suara masuk sebagai *draf* keranjang yang bisa ditambah/dikurangi/dihapus per item secara visual sebelum difinalisasi.
3. **Keamanan Data (Zero Accidental Commits):** Struk hanya tersimpan ke database setelah kasir melakukan tap konfirmasi final.
4. **Kualitas Visual & Aksesibilitas:** Kontras teks arang di atas krem minimal 4.5:1 (tercapai > 10:1), ukuran tombol sentuh minimal 48px, dan tidak ada elemen norak/emoji.

## 5. Batasan Desain & Sistem (Constraints)
* **Warna:** Terinspirasi Keramik Plered — Terakota (`#9A3412`), Krem Hangat (`#FFFBEB`), Tanah Liat (`#78350F`), Arang (`#1C1917`). Tidak boleh ada gradasi ungu/biru neon.
* **Ornamen:** Motif batik Rereng Kendi hanya berupa tekstur SVG halus (opasitas 4–6%) di header/login; dilarang menghalangi area baca kasir.
* **Ikonografi:** Ikon garis monoline SVG bertema kendi, anglo, dan iket Sunda; **dilarang menggunakan emoji sebagai ikon antarmuka**.
* **Kehandalan Pengenalan Suara:** Jangan asumsikan AI/Speech API 100% akurat pada campuran bahasa Indonesia dan Sunda; sediakan fallback ketik dan katalog sentuh manual.

## 6. Di Luar Cakupan (Out of Scope)
* Fitur akuntansi akrual multi-perusahaan/holding enterprise.
* Ketergantungan mutlak pada input suara tanpa tombol fisik/layar sentuh.
