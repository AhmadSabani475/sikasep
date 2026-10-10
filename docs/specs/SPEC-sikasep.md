# Technical Specification: Sikasep (Sistem Kasir Suara Enterpreneur Purwakarta)
> **Dokumen ID:** `SPEC-sikasep`  
> **Status:** Draft Ready for Implementation  
> **Versi:** 1.0.0  
> **Target Framework:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Supabase + Google Gemini (`@google/genai`)

---

## 1. Objective

Membangun kembali (*remake*) aplikasi kasir web/PWA **Sikasep** untuk UMKM Purwakarta dengan arsitektur **Hybrid Suara + Sentuh**, menerapkan tema visual **Keramik Plered**, serta alur transaksi yang kebal salah input dengan *draft review* dan verifikasi kasir eksplisit sebelum transaksi dicatat ke database.

---

## 2. Perintah Operasional (Commands)

```bash
# Menjalankan development server lokal
npm run dev

# Membangun bundle produksi (Next.js)
npm run build

# Memulai server produksi
npm run start

# Menjalankan static code linter
npm run lint
```

---

## 3. Struktur Modul & Berkas Terkait

```
d:/idcamp/
├── design-system/sikasep/MASTER.md    # Source of truth token desain & identitas
├── docs/intent/sikasep-remake.md       # Dokumen intent terkonfirmasi
├── docs/specs/SPEC-sikasep.md          # Dokumen spesifikasi teknis (berkas ini)
├── tasks/plan.md                       # Rencana arsitektur dan dependensi
├── tasks/todo.md                       # Daftar rincian tugas implementasi terukur
├── src/
│   ├── app/
│   │   ├── globals.css                 # Token CSS tema Keramik Plered & utilitas
│   │   ├── layout.tsx                  # Root layout, Google Fonts (Plus Jakarta Sans)
│   │   ├── page.tsx                    # Landing page / pengenalan Sikasep
│   │   ├── login/page.tsx              # Autentikasi wirausaha (tekstur Rereng Kendi)
│   │   ├── register/page.tsx           # Pendaftaran usaha wirausaha Purwakarta
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Halaman Utama Kasir POS (Hybrid Voice+Touch)
│   │   │   ├── menu/page.tsx           # Manajemen Katalog Produk & Harga
│   │   │   ├── riwayat/page.tsx        # Riwayat Transaksi & Cetak Ulang Struk
│   │   │   ├── rekap/page.tsx          # Laporan Omzet, Jam Ramai, Menu Terlaris
│   │   │   └── insights/page.tsx       # Asisten Bisnis Pintar (Sikasep AI)
│   │   └── api/
│   │       ├── extract/route.ts        # Ekstraksi Suara ke JSON Item (Google Gemini)
│   │       └── chat/route.ts           # Konsultasi AI Bisnis UMKM
│   ├── components/
│   │   ├── icons/PurwakartaIcons.tsx   # Ikon SVG Kendi, Anglo, Iket Sunda (No emoji)
│   │   ├── RerengKendiPattern.tsx      # SVG background pattern subtil (4% opacity)
│   │   ├── QuickMenuGrid.tsx           # Grid menu terlaris untuk input sentuh cepat
│   │   ├── MicThumbBar.tsx             # Floating bottom bar + mic jempol 64px
│   │   ├── DraftOrderDrawer.tsx        # Keranjang draf (edit qty, hapus, fallback cari)
│   │   ├── ConfirmPaymentModal.tsx     # Modal bayar (Tunai/QRIS) & tap final
│   │   ├── ReceiptModal.tsx            # Pratinjau struk thermal kasir Plered
│   │   ├── Sidebar.tsx                 # Navigasi desktop dengan logo Kendi
│   │   └── BottomNav.tsx               # Navigasi mobile bawah yang ergonomis
│   ├── lib/
│   │   ├── speech/recognition.ts       # Wrapper Web Speech API dengan dialek Sunda/ID
│   │   ├── supabase/                   # Klien Supabase browser & server
│   │   └── formatters.ts               # Formatter Rupiah, tanggal Sunda/ID, tabular-nums
│   └── types/
│       └── index.ts                    # Kontrak tipe data TypeScript
```

---

## 4. Kontrak Data & Skema Komponen

### 4.1 Tipe Data Transaksi (`src/types/index.ts`)

```typescript
export interface MenuItem {
  id: string;
  name: string;             // Contoh: "Sate Maranggi Sapi"
  category: 'makanan' | 'minuman' | 'camilan' | 'oleh-oleh';
  price: number;            // Contoh: 35000
  is_favorite: boolean;     // Menentukan tampil di Quick Menu Grid
  stock?: number;
  unit: string;             // "porsi", "bungkus", "tusuk", "gelas"
}

export interface OrderItemDraft {
  menu_item_id?: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;           // "kurang lada", "bawa bungkus"
  is_voice_extracted?: boolean; // Penanda item berasal dari ekstraksi suara
  confidence?: 'high' | 'low';  // Jika low, diberi highlight kuning untuk verifikasi
}

export interface TransactionPayload {
  id?: string;
  user_id: string;
  items: OrderItemDraft[];
  total_amount: number;
  payment_method: 'cash' | 'qris' | 'transfer';
  cash_tendered?: number;   // Uang dibayar (untuk menghitung kembalian)
  change_amount?: number;   // Kembalian
  voice_transcript_raw?: string; // Teks rekaman suara asli
  status: 'completed' | 'cancelled';
  created_at?: string;
}
```

### 4.2 Kontrak API Ekstraksi Suara (`/api/extract/route.ts`)

> **Keamanan & Pembatasan**:
> - API key Google Gemini (`GEMINI_API_KEY`) **wajib server-only** via `process.env`. Dilarang menggunakan prefix `NEXT_PUBLIC_`.
> - Dilengkapi *rate limiter* (in-memory per IP / sliding window) untuk mencegah eksploitasi kuota API dan beban berlebih.

* **Input**:
  ```json
  {
    "transcript": "Sate maranggi dua porsi ulah lada teuing, es kelapa hiji",
    "menu_catalog": [
      { "name": "Sate Maranggi Sapi", "price": 35000 },
      { "name": "Es Kelapa Muda", "price": 8000 }
    ]
  }
  ```
* **Output**:
  ```json
  {
    "items": [
      {
        "name": "Sate Maranggi Sapi",
        "quantity": 2,
        "price": 35000,
        "subtotal": 70000,
        "notes": "ulah lada teuing / tidak terlalu pedas",
        "confidence": "high"
      },
      {
        "name": "Es Kelapa Muda",
        "quantity": 1,
        "price": 8000,
        "subtotal": 8000,
        "notes": "",
        "confidence": "high"
      }
    ],
    "unrecognized_phrases": [],
    "total_estimated": 78000
  }
  ```

---

## 5. Spesifikasi Antarmuka & Interaksi (UI/UX)

### 5.1 Tema Warna & Token CSS (`src/app/globals.css`)
* Ganti seluruh warna bertema *Dark Teal* yang lama dengan token resmi Keramik Plered dari `design-system/sikasep/MASTER.md`:
  * Background: Krem `#FFFBEB`
  * Foreground: Arang `#1C1917`
  * Primary: Terakota `#9A3412` (hover `#7C2D12`)
  * Surface Card: `#FFFFFF` dengan border halus `#E7E0D3`
  * Font angka nominal: `tabular-nums font-bold tracking-tight`.

### 5.2 Header Kasir
* Menampilkan ucapan dinamis bernuansa hangat: *"Sampurasun, [Nama Toko/Juragan]!"*.
* Background memiliki aksen tekstur SVG halus `RerengKendiPattern` dengan opasitas 4%.
* Indikator status koneksi (Offline/Online) dan tanggal hari ini dalam format lokal.

### 5.3 Quick Menu Grid (Katalog Terlaris)
* Grid responsif: 2 kolom (mobile 375px) / 3-4 kolom (tablet/desktop).
* Kartu menu berukuran minimal 96px tinggi dengan area klik luas:
  * Nama menu jelas (15–16px tebal).
  * Harga kontras tinggi berlatar krem halus.
  * Tombol tap instan menambah +1 ke draf transaksi.
  * Tidak menggunakan ikon emoji; menggunakan siluet monoline kendi (minuman) dan anglo (makanan panas).

### 5.4 Mic Thumb Bar (Jalan Pintas Suara)
* Mengambang di area bawah layar (*Bottom Thumb Zone*), tidak menutupi item penting.
* Tombol Mic berdiameter 64px, warna terakota `#9A3412`, dengan efek getar/denyut visual saat aktif mendengarkan.
* Menampilkan transkrip suara *real-time* ("Mendengarkan: *'dua maranggi campur...'*").
* Dilengkapi tombol fallback berupa input pencarian manual jika kasir sedang berada di tempat yang sangat bising.

### 5.5 Draft Order Drawer & Modal Konfirmasi
* Setiap ucapan langsung dikonversi menjadi baris item draf.
* Kasir memiliki kendali penuh:
  * Tambah/kurang kuantitas per baris (`[ - ] [ Qty ] [ + ]`).
  * Hapus item salah dengar dengan satu sentuhan.
  * Tambah item manual dari menu tanpa harus mengulang suara.
* **Tombol Konfirmasi Final**: Berwarna terakota tebal dengan teks mencolok:
  **"Konfirmasi Transaksi • Rp [Total]"**.
  Membuka dialog pembayaran (pilihan Tunai + hitung kembalian cepat atau QRIS), lalu menembak simpan data ke Supabase dan menampilkan struk.

---

## 6. Persyaratan Aksesibilitas (WCAG AA) & Performa

* **Touch Targets**: Semua tombol aksi memiliki dimensi minimum 48×48px.
* **Kontras Teks**: Seluruh teks judul dan angka memenuhi standar rasio kontras > 4.5:1 terhadap background masing-masing.
* **Focus Visible**: Setiap elemen interaktif memiliki `ring-2 ring-primary ring-offset-2` yang tampak jelas saat dikontrol via keyboard.
* **Audio Feedback**: Dilengkapi indikator visual yang jelas (bukan hanya bunyi "bip") sehingga kasir tuna rungu atau di lingkungan bising tetap tahu mikrofon sedang aktif.
