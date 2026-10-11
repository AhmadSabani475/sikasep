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

## Task 3: Quick Menu Grid & Perbaikan Layar Kasir (COMPLETED)
**Description:** Membangun antarmuka katalog menu cepat untuk kasir yang memuat produk terlaris dengan kartu sentuh besar (target >= 48px), memperbaiki tombol mic besar (kontras >= 3:1), merapikan layout panel suara AI, menghapus widget chat ungu-pink, dan mengoreksi data demo Air Mineral.

**Acceptance criteria:**
- [x] Tombol mic besar menggunakan latar terakota `#9A3412` dan ikon krem `#FFFBEB` (kontras 6.41:1 > 3:1).
- [x] Panel suara kasir tertata vertikal dan sejajar: judul, status "Tekan untuk bicara", tombol mic besar 88px, dan "Mode Ramai".
- [x] Widget chat ungu-pink (`AIChatWidget.tsx`) dihapus dari dashboard layout.
- [x] Seluruh kartu produk dan kategori pill memiliki target sentuh >= 48px (kartu produk min 96px).
- [x] Harga demo Air Mineral dikoreksi menjadi Rp 4.000 di Supabase DB dan `mock-data.ts`.
- [x] Keterangan singkat "Mode Ramai" dan "Suara AI" ditambahkan secara jelas.
- [x] Hasil terverifikasi pada viewport 375px (mobile) dan 1280px (desktop).
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

## Task 4: Integrasi Suara Toleran Dialek (Server-Only Gemini + Rate Limit & Fallback) (COMPLETED)
**Description:** Memastikan kunci Google Gemini API eksklusif di server (`/api/extract`), dilengkapi pelindung batas frekuensi pemakaian (*rate limiting* HTTP 429), pengenalan dialek Sunda Purwakarta (*hiji, dua, tilu, maranggi, peuyeum, simping*), dan parser fallback lokal jika AI offline.

**Acceptance criteria:**
- [x] API key Google Gemini tersimpan murni di environment server (`GEMINI_API_KEY` / `process.env`) tanpa `NEXT_PUBLIC_`.
- [x] Route handler `/api/extract` dilengkapi pelindung batas pemakaian (sliding window rate limit 40 req/min dengan status 429 & Retry-After).
- [x] Prompt ekstraksi mengenali angka Sunda (hiji..sapuluh), satuan (seporsi, segelas, sapasang), dan kuliner khas Purwakarta.
- [x] Fallback rule-based parser otomatis aktif saat AI offline, error, atau API key belum disetel.
- [x] Unit test `tests/extract-voice.test.mjs` terverifikasi lulus 100%.

**Verification:**
- [x] Tests pass: `npm test` (49 tests passing)
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 3  
**Files touched:**
- `src/app/api/extract/route.ts`
- `tests/extract-voice.test.mjs`

---

## Task 5: Panel Draf Pesanan & Editor Kuantitas (COMPLETED)
**Description:** Membangun panel draf pesanan di mana kasir dapat meninjau draf pesanan, mengoreksi salah dengar/salah ketuk, mengubah jumlah item (`+` / `−` minimal 48px), dan menghapus item sebelum pembayaran.

**Acceptance criteria:**
- [x] Setiap baris item berupa kartu bertumpuk dengan nama penuh, kuantitas, harga satuan, dan subtotal.
- [x] Tombol stepper kuantitas berukuran $\ge 48$px dengan feedback sentuh aktif.
- [x] Tampilan total belanja menggunakan teks besar `tabular-nums font-extrabold`.
- [x] Tidak ada data yang tersimpan otomatis sebelum kasir melakukan konfirmasi final.
- [x] Unit test `tests/cashier-draft.test.mjs` terverifikasi lulus 100%.

**Verification:**
- [x] Tests pass: `npm test`
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 3, Task 4  
**Files touched:**
- `src/components/TransactionCard.tsx`
- `src/app/dashboard/page.tsx`
- `tests/cashier-draft.test.mjs`

---

## Task 6: Ikonografi Khas Purwakarta (SVG Murni Kendi, Anglo, Iket Sunda — Tanpa Emoji) (COMPLETED)
**Description:** Membuat kumpulan komponen ikon SVG monoline berkarakter lokal Purwakarta: Kendi air (logo/minuman), Anglo (dapur/makanan panas), Iket Sunda (profil/sapaan wirausaha), FoodTray (nampan saji kuliner), dan Receipt (struk transaksi) untuk memperkuat identitas khas tanpa emoji.

**Acceptance criteria:**
- [x] Berkas `src/components/icons/PurwakartaIcons.tsx` menyediakan ikon: `KendiIcon`, `AngloIcon`, `IketIcon`, `FoodTrayIcon`, `ReceiptIcon`.
- [x] Seluruh ikon menggunakan stroke monoline 2px, berskala responsif, dan menyertakan `aria-hidden` aksesibel.
- [x] Terintegrasi ke Sidebar (logo Kendi & nav item), BottomNav (Menu & Riwayat), serta QuickMenuGrid (tab kategori Makanan, Minuman, Oleh-oleh).
- [x] Nol emoji pada seluruh komponen ikonografi.
- [x] Unit test `tests/purwakarta-icons.test.mjs` terverifikasi lulus 100%.

**Verification:**
- [x] Tests pass: `npm test` (54 tests passing)
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 1, Task 2, Task 3  
**Files touched:**
- `src/components/icons/PurwakartaIcons.tsx`
- `src/components/Sidebar.tsx`
- `src/components/BottomNav.tsx`
- `src/components/QuickMenuGrid.tsx`
- `tests/purwakarta-icons.test.mjs`

---

## Task 7: Modal Konfirmasi Pembayaran & Struk Thermal Plered
**Description:** Membangun dialog pembayaran kasir (metode Tunai dengan kalkulator uang kembalian instan atau simulasi QRIS) serta pratinjau cetak struk kasir thermal dengan header khas Sikasep Purwakarta.

**Acceptance criteria:**
- [x] Transaksi hanya disimpan ke Supabase setelah kasir menekan tombol "Konfirmasi Transaksi".
- [x] Modal pembayaran menyediakan tombol cepat uang pas / pecahan Rp50.000, Rp100.000 dan menghitung kembalian akurat.
- [x] Setelah pembayaran selesai, muncul pratinjau struk thermal rapi dengan opsi cetak / bagikan dan tombol pesanan baru.

**Dependencies:** Task 5, Task 6  
**Files touched:**
- `src/components/PaymentModal.tsx`
- `src/components/ReceiptModal.tsx`
- `src/app/dashboard/page.tsx`
- `tests/payment-and-receipt.test.mjs`

---

## Task 8: Penyelarasan Halaman Menu, Riwayat, Rekap, dan Login
**Description:** Menyelaraskan seluruh halaman aplikasi lainnya (Login/Auth, Katalog Menu, Riwayat Transaksi, Rekap Penjualan, Sikasep AI) dengan palet Keramik Plered dan motif Rereng Kendi.

**Acceptance criteria:**
- [x] Halaman login dan register memiliki kartu hangat dengan tekstur Rereng Kendi subtil.
- [x] Halaman Rekap & Riwayat menggunakan warna chart yang selaras dengan palet terakota dan tanah liat (menghapus warna neon).
- [x] Seluruh halaman bebas dari emoji sebagai ikon.

**Dependencies:** Task 1–7  
**Files touched:**
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/dashboard/menu/page.tsx`
- `src/components/MenuFormModal.tsx`
- `src/app/dashboard/riwayat/page.tsx`
- `src/app/dashboard/rekap/page.tsx`
- `src/app/dashboard/insights/page.tsx`
- `tests/task8-secondary-pages.test.mjs`

---

# Fase 2: Alur Suara v2 (SPEC §7) (COMPLETED)

## Task 9: Logika Murni Mic-Gate & Kebijakan Pesanan Suara (COMPLETED)
**Acceptance criteria:**
- [x] Mic dijeda sebelum suara aplikasi diputar dan dilanjutkan setelahnya (juga saat pemutaran gagal); hasil yang tiba saat bersuara dibuang.
- [x] Mic yang dijeda kasir tidak ikut dinyalakan kembali setelah bunyi selesai.
- [x] Satu ucapan yang dilaporkan ganda dalam ≤ 3 detik menghasilkan satu transaksi + indikator "Pesanan identik diabaikan".
- [x] Dua pesanan identik dari pembeli berbeda (> 3 detik) tercatat dua transaksi.
- [x] Jumlah > 20 di Mode Ramai masuk draf, tidak disimpan otomatis; jumlah 20 tetap disimpan otomatis.
- [x] Hasil tanpa item dikenal diabaikan; sebagian dikenal masuk draf.
**Files:** `src/lib/voice/mic-gate.ts`, `src/lib/voice/order-policy.ts`, `tests/voice-flow-v2.test.mjs`

## Task 10: Integrasi Layar Kasir (Hapus TTS, Bunyi Singkat, Saklar Tunai|QRIS) (COMPLETED)
- [x] TTS pembacaan pesanan & filter teks "rupiah" dihapus dari kasir.
- [x] Saklar "Bunyi" menggantikan kotak centang "Suara AI".
- [x] Indikator mic Mode Ramai menyala jelas; 1 ketukan menjeda.
- [x] Saklar permanen Tunai | QRIS (default Tunai) tampil saat Mode Ramai.
**Files:** `src/app/dashboard/page.tsx`, `src/components/MicButton.tsx`, `src/lib/voice/cue.ts`

## Task 11: Migrasi 002 & Query (COMPLETED)
- [x] Kolom `payment_method`, `status`, `source`, `cash_received`, `change_amount`, `updated_at` + kebijakan RLS update.
- [x] Query `createTransaction` menerima metadata; query `cancelTransaction`, `updateTransaction`, `updateTransactionItems` siap pakai.
- [x] Omzet harian dan mingguan mengecualikan transaksi berstatus `dibatalkan`.
**Files:** `supabase/migrations/002_voice_flow_v2.sql`, `src/lib/supabase/queries.ts`, `src/lib/supabase/analytics.ts`

## Task 12: Simpan Otomatis Mode Ramai + "Batalkan" 8 Detik (COMPLETED)
- [x] Transaksi Mode Ramai tersimpan tanpa uang diterima/kembalian dan tanpa struk otomatis.
- [x] Tombol "Batalkan" (≥ 48px) tampil 8 detik; menekan = status `dibatalkan`.
- [x] Indikator visual real-time ("Tersimpan otomatis", "Pesanan identik diabaikan", dsb).
**Files:** `src/app/dashboard/page.tsx`

## Task 13: Kelola Transaksi dari Riwayat (COMPLETED)
- [x] Batal, edit item, ubah metode bayar (mengisi `updated_at`), cetak struk.
- [x] Omzet, riwayat ringkasan, dan rekap mengecualikan status `dibatalkan`.
- [x] Transaksi dibatalkan ditampilkan dengan badge "Dibatalkan" dan teks tercoret.
**Files:** `src/app/dashboard/riwayat/page.tsx`

