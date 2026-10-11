# Architecture & Implementation Plan: Sikasep Remake
> **Inisiatif:** Sikasep — Sistem Kasir Suara Enterpreneur Purwakarta  
> **Dasar Spesifikasi:** [`docs/specs/SPEC-sikasep.md`](file:///d:/idcamp/docs/specs/SPEC-sikasep.md) & [`design-system/sikasep/MASTER.md`](file:///d:/idcamp/design-system/sikasep/MASTER.md)

---

## 1. Dependency Graph

```
Token Desain CSS (Keramik Plered & Rereng Kendi SVG)
    │
    ├── Ikon Khas Purwakarta (SVG Kendi, Anglo, Iket Sunda tanpa emoji)
    │       │
    │       ├── Komponen Navigasi (Sidebar, Header, BottomNav)
    │       │
    │       ├── Komponen Katalog Cepat (QuickMenuGrid)
    │       │
    │       ├── Komponen Suara (MicThumbBar + Fallback Pencarian)
    │       │
    │       └── Komponen Transaksi Draf (DraftOrderDrawer & Item Editor)
    │               │
    │               └── Alur Konfirmasi Pembayaran & Cetak Struk (ReceiptModal)
    │                       │
    │                       └── Halaman Terkait: Menu, Rekap, Riwayat, Login
```

---

## 2. Strategi Vertical Slice

Setiap tahapan dikerjakan dalam unit kecil (*vertical slices*) yang langsung dapat dijalankan dan diuji:

1. **Slice 1: Fondasi Visual & Token Keramik Plered**
   * Mengganti konfigurasi tema gelap teal lama di `src/app/globals.css` ke palet Plered (krem `#FFFBEB`, terakota `#9A3412`, arang `#1C1917`).
   * Membuat komponen SVG `RerengKendiPattern` dan set ikon purwakarta `PurwakartaIcons.tsx` (Kendi, Anglo, Iket Sunda).
2. **Slice 2: Header Kasir & Navigasi Purwakarta**
   * Memperbarui `Sidebar.tsx`, `BottomNav.tsx`, dan `layout.tsx` dengan branding Sikasep, sapaan Sunda (*Sampurasun*), dan ikon khas.
3. **Slice 3: Core Kasir POS (Hybrid Quick Grid + Draf Keranjang)**
   * Membangun `QuickMenuGrid` untuk katalog menu terlaris (Sate Maranggi, Es Kelapa, Simping, dll).
   * Membangun `DraftOrderDrawer` untuk menampung draf item, ubah kuantitas, hapus item, dan hitung subtotal otomatis dengan format mata uang `tabular-nums`.
4. **Slice 4: Jalan Pintas Suara & AI Engine Toleran Dialek**
   * Mengintegrasikan `MicThumbBar` (tombol mic jempol 64px di bottom zone).
   * Menghubungkan ke Web Speech API & `/api/extract` (Gemini) agar hasil suara masuk ke draf pesanan dengan indikator status.
   * Menambahkan fallback manual (ketik nama menu / pilih katalog).
5. **Slice 5: Modal Konfirmasi Pembayaran & Cetak Struk**
   * Dialog konfirmasi tap kasir sebelum simpan: hitung uang tunai & kembalian, QRIS simulator.
   * Tampilan pratinjau struk kasir thermal bernuansa Plered yang rapi dan siap cetak/simpan ke Supabase.
6. **Slice 6: Halaman Pendukung (Login, Menu, Riwayat, Rekap)**
   * Menyelaraskan seluruh halaman dashboard lainnya ke tema visual dan tipografi Sikasep.

---

## 3. Analisis Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Kasir di warung ramai/bising, suara tidak tertangkap jelas | Transaksi terhambat jika 100% voice | Menyediakan Quick Grid sentuh instan & fallback ketik pencarian cepat |
| Logat lokal/slang Sunda ambigu (misal "dua maranggi ulah lada") | AI salah mengenali item atau jumlah | AI Gemini dibekali instruksi khusus istilah Sunda, dan hasil selalu masuk ke draf untuk diperiksa kasir |
| Kontras layar HP redup di luar ruangan saat siang | Kasir salah membaca nominal harga | Gunakan background krem alami `#FFFBEB` dan teks arang pekat `#1C1917` (kontras > 12:1) serta angka besar `tabular-nums` |

---

## 4. Fase 2: Alur Suara v2 (SPEC §7)

### 4.1 Dependency Graph

```
Test gagal lebih dulu (mic-gate, anti-ganda, jumlah tak wajar)
    │
    ├── Slice 9:  Logika murni  — mic-gate.ts + order-policy.ts (tanpa UI)
    │       │
    │       ├── Slice 10: Integrasi kasir — hapus TTS, bunyi singkat, saklar Bunyi,
    │       │             mic dijeda saat bunyi, pipeline Normal/Ramai, saklar Tunai|QRIS
    │       │
    │       └── Slice 11: Migrasi 002 + query (payment_method, status, source, updated_at, RLS)
    │                   │
    │                   ├── Slice 12: Simpan otomatis Mode Ramai + toast "Batalkan" 8 detik
    │                   │
    │                   └── Slice 13: Riwayat — batal, edit item, ubah metode, cetak struk;
    │                                 rekap & omzet mengecualikan status dibatalkan
```

### 4.2 Urutan & Checkpoint

| Slice | Isi | Checkpoint |
| :--- | :--- | :--- |
| 9 | `src/lib/voice/mic-gate.ts`, `src/lib/voice/order-policy.ts` | 4 kelompok test wajib berubah dari merah ke hijau |
| 10 | `MicButton.tsx`, `dashboard/page.tsx`, `src/lib/voice/cue.ts` | Tidak ada `speechSynthesis`/filter teks di kasir; uji manual Mode Ramai tanpa echo |
| 11 | `supabase/migrations/002_voice_flow_v2.sql`, `queries.ts`, `types` | Migrasi diterapkan di Supabase; build lulus |
| 12 | Auto-save + `UndoToast` | Simpan → Batalkan dalam 8 detik → status `dibatalkan` |
| 13 | `riwayat/page.tsx`, `rekap`, `analytics.ts` | Edit mengisi `updated_at`; omzet tidak menghitung `dibatalkan` |

### 4.3 Risiko Tambahan

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Chrome memutus `SpeechRecognition` saat di-`stop()` lalu `start()` cepat | Mic tidak menyala lagi setelah bunyi | `mic-gate` memakai hitungan suara aktif + resume tertunda; uji manual di Chrome Android |
| Pembeli berbeda mengucap pesanan identik < 3 detik | Satu transaksi terlewat | Jendela sengaja pendek (3 dtk) + indikator "Pesanan identik diabaikan" yang terlihat kasir |
| Migrasi belum diterapkan di Supabase produksi | Insert gagal karena kolom tidak ada | Kolom baru punya default; query baru ditulis toleran sampai migrasi diterapkan |
