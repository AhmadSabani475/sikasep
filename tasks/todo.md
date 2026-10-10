# Task List: Sikasep Remake Implementation
> **Inisiatif:** Sikasep — Sistem Kasir Suara Enterpreneur Purwakarta  
> **Status Pelacakan:** Active  
> **Catatan:** Sesuai arahan, Task Ikonografi Purwakarta diposisikan setelah Task Panel Draf Pesanan. Kunci Gemini hanya berjalan di server-side (`src/app/api/extract/route.ts`) dengan pembatasan pemakaian (rate limit).

---

## Task 1: Fondasi Token Desain Keramik Plered & Motif Rereng Kendi (COMPLETED)
**Description:** Mengganti styling dark teal lama di `globals.css` dengan token warna Keramik Plered (krem `#FFFBEB`, terakota `#9A3412`, tanah liat `#78350F`, arang `#1C1917`). Menambahkan komponen pola SVG `RerengKendiPattern` dan helper tipografi `tabular-nums`.

**Acceptance criteria:**
- [x] Token CSS terakota, krem, tanah liat, dan arang terdefinisi di `:root` dan Tailwind theme.
- [x] Background default web berubah menjadi krem hangat `#FFFBEB` dengan teks arang `#1C1917`.
- [x] Komponen pola SVG `RerengKendiPattern` dibuat dengan opasitas subtil (4–6%).
- [x] Kontras teks terhadap background terverifikasi ≥ 4.5:1 (tercapai rasio tinggi > 10:1).
- [x] Terdapat unit test verifikasi token & kontras yang lulus via `node --test`.

**Verification:**
- [x] Tests pass: `npm test`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Palet warna krem terakota hangat konsisten.

**Dependencies:** None  
**Files touched:**
- `src/app/globals.css`
- `src/components/RerengKendiPattern.tsx`
- `tests/tokens.test.mjs`

---

## Task 2: Navigasi & Shell Aplikasi (Sidebar, BottomNav, Header) (COMPLETED)
**Description:** Memperbarui layout shell utama kasir (Sidebar untuk desktop dan BottomNav untuk smartphone 375px) menggunakan identitas Sikasep, sapaan Sunda (*Sampurasun*), dan jangkauan sentuh jempol yang ergonomis.

**Acceptance criteria:**
- [x] Sidebar dan BottomNav menggunakan warna terakota dan krem dengan highlight aktif yang jelas.
- [x] Ukuran tombol navigasi pada BottomNav memenuhi target sentuh minimum 48×48px.
- [x] Header menyertakan sapaan hangat dan identitas wirausaha Purwakarta.
- [x] Menghapus seluruh emoji dan gradasi ungu/pink neon.

**Verification:**
- [x] Tests pass: `npm test`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Shell navigasi responsif 375px hingga desktop.

**Dependencies:** Task 1  
**Files touched:**
- `src/components/Sidebar.tsx`
- `src/components/BottomNav.tsx`
- `src/app/dashboard/layout.tsx`
- `tests/navigation.test.mjs`

---

## Task 3: Quick Menu Grid (Katalog Cepat Item Terlaris) (COMPLETED)
**Description:** Membangun antarmuka katalog menu cepat untuk kasir yang memuat produk terlaris khas Purwakarta (Sate Maranggi Sapi, Campur Lemak, Es Kelapa Muda, Simping, Colenak, dll.) dengan kartu sentuh besar untuk menambah pesanan instan.

**Acceptance criteria:**
- [x] Menampilkan grid menu terlaris responsif (2 kolom di mobile, 3-4 kolom di desktop).
- [x] Setiap kartu menampilkan nama item, harga dengan format mata uang `tabular-nums`.
- [x] Sekali sentuh menambah kuantitas item ke draf keranjang secara *instant/optimistic*.
- [x] Filter pencarian dan kategori (Makanan, Minuman, Oleh-oleh) tanpa emoji.
- [x] Terintegrasi ke halaman kasir utama `src/app/dashboard/page.tsx`.

**Verification:**
- [x] Tests pass: `npm test`
- [x] Build succeeds: `npm run build`
- [x] Manual check: Sentuhan pada kartu menu instan menambah pesanan ke draf transaksi.

**Dependencies:** Task 1, Task 2  
**Files touched:**
- `src/components/QuickMenuGrid.tsx`
- `src/app/dashboard/page.tsx`
- `src/types/index.ts`
- `tests/quick-menu.test.mjs`

---

## Task 4: Mic Thumb Bar & Integrasi Suara Toleran Dialek (Server-Only Gemini + Rate Limit)
**Description:** Membuat bilah suara mengambang di area bawah layar (*Bottom Thumb Zone*) dengan tombol mic terakota 64px, animasi gelombang saat mendengar, transkrip real-time, dan fallback tombol pencarian manual. Kunci Google Gemini API **eksklusif di server** (`/api/extract`) dan dilindungi mekanisme pembatasan frekuensi (*rate limiting* / throttle).

**Acceptance criteria:**
- [ ] API key Google Gemini tersimpan murni di environment server (`GEMINI_API_KEY` / `process.env`) tanpa `NEXT_PUBLIC_`.
- [ ] Route handler `/api/extract` dilengkapi pelindung batas pemakaian (rate limit / max calls per window per IP/user).
- [ ] Tombol mic diletakkan pada posisi mudah dijangkau satu jempol di mobile (`fixed bottom-20 md:bottom-6`).
- [ ] Menampilkan indikator visual denyut saat aktif merekam suara.
- [ ] Terdapat input fallback pencarian cepat jika kasir memilih mengetik nama menu.

**Dependencies:** Task 3  
**Files likely touched:**
- `src/components/MicThumbBar.tsx`
- `src/app/api/extract/route.ts`

---

## Task 5: Panel Draf Pesanan & Editor Kuantitas
**Description:** Membangun panel draf pesanan (*Draft Order Drawer/Card*) di mana kasir dapat melihat draf pesanan, mengoreksi salah dengar, mengubah jumlah item (`+` / `-`), dan menghapus item sebelum pembayaran.

**Acceptance criteria:**
- [ ] Setiap baris item menampilkan nama, kuantitas, harga satuan, dan subtotal.
- [ ] Tombol kontrol kuantitas berukuran minimal 40×40px dengan feedback sentuh yang jelas.
- [ ] Tampilan total belanja menggunakan teks besar `tabular-nums font-bold`.
- [ ] Tidak ada data yang tersimpan otomatis ke database sebelum konfirmasi eksplisit.

**Dependencies:** Task 3, Task 4  
**Files likely touched:**
- `src/components/DraftOrderDrawer.tsx`
- `src/app/dashboard/page.tsx`

---

## Task 6: Ikonografi Khas Purwakarta (SVG Murni Kendi, Anglo, Iket Sunda — Tanpa Emoji)
**Description:** Membuat kumpulan komponen ikon SVG monoline berkarakter lokal Purwakarta: Kendi air (logo/minuman), Anglo (dapur/makanan panas), dan Iket Sunda (profil/sapaan wirausaha) untuk menggantikan emoji pada seluruh komponen yang sudah terbangun.

**Acceptance criteria:**
- [ ] Berkas `src/components/icons/PurwakartaIcons.tsx` menyediakan ikon: `KendiIcon`, `AngloIcon`, `IketIcon`, `FoodTrayIcon`, `ReceiptIcon`.
- [ ] Seluruh ikon menggunakan stroke monoline 1.75px–2px, berskala responsif, dan menyertakan `aria-hidden` atau label yang aksesibel.
- [ ] Mengganti seluruh sisa emoji di Quick Menu Grid, Drawer, dan Navigasi dengan ikon SVG.

**Dependencies:** Task 5  
**Files likely touched:**
- `src/components/icons/PurwakartaIcons.tsx`
- `src/components/QuickMenuGrid.tsx`
- `src/components/Sidebar.tsx`

---

## Task 7: Modal Konfirmasi Pembayaran & Struk Thermal Plered
**Description:** Membangun dialog pembayaran kasir (metode Tunai dengan kalkulator uang kembalian instan atau simulasi QRIS) serta pratinjau cetak struk kasir thermal dengan header khas Sikasep Purwakarta.

**Acceptance criteria:**
- [ ] Transaksi hanya disimpan ke Supabase setelah kasir menekan tombol "Konfirmasi Transaksi".
- [ ] Modal pembayaran menyediakan tombol cepat uang pas / pecahan Rp50.000, Rp100.000 dan menghitung kembalian akurat.
- [ ] Setelah pembayaran selesai, muncul pratinjau struk thermal rapi dengan opsi cetak / bagikan dan tombol pesanan baru.

**Dependencies:** Task 5, Task 6  
**Files likely touched:**
- `src/components/ConfirmPaymentModal.tsx`
- `src/components/ReceiptModal.tsx`
- `src/app/dashboard/page.tsx`

---

## Task 8: Penyelarasan Halaman Menu, Riwayat, Rekap, dan Login
**Description:** Menyelaraskan seluruh halaman aplikasi lainnya (Login/Auth, Katalog Menu, Riwayat Transaksi, Rekap Penjualan, Sikasep AI) dengan palet Keramik Plered dan motif Rereng Kendi.

**Acceptance criteria:**
- [ ] Halaman login dan register memiliki kartu hangat dengan tekstur Rereng Kendi subtil.
- [ ] Halaman Rekap & Riwayat menggunakan warna chart yang selaras dengan palet terakota dan tanah liat (menghapus warna neon).
- [ ] Seluruh halaman bebas dari emoji sebagai ikon.

**Dependencies:** Task 1–7  
**Files likely touched:**
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/dashboard/menu/page.tsx`
- `src/app/dashboard/riwayat/page.tsx`
- `src/app/dashboard/rekap/page.tsx`
