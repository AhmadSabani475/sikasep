# Sikasep — Sistem Kasir Suara Enterpreneur Purwakarta

> *"Kasir Kasep, Usaha Makin Sat-Set."*

**Sikasep** (Sistem Kasir Suara Enterpreneur Purwakarta) adalah aplikasi kasir digital (POS) berbasis suara inovatif yang dirancang khusus dengan fokus untuk UMKM & enterpreneur Purwakarta. Tanpa mengetik, tanpa ribet — cukup ucapkan pesanan pelanggan, AI yang langsung mencatat dan merekap transaksi secara akurat.

---

## 🚀 Fitur Utama

- **🎙️ Catat Transaksi Cukup Bicara**: Input transaksi instan melalui pengenalan suara (Web Speech API) dalam hitungan detik.
- **🧠 Ekstraksi AI Pintar (Google Gemini)**: Menganalisis ucapan transaksi, mencocokkan menu lokal (seperti *Sate Maranggi*, *Simping*, *Peuyeum*, *Colenak*), menghitung kuantitas, subtotal, dan total harga secara otomatis termasuk memahami istilah/slang daerah.
- **🔊 Voice Feedback & Auto-Save**: Konfirmasi suara otomatis saat pesanan berhasil disimpan tanpa perlu menyentuh layar.
- **📊 Rekap & Analisis Penjualan**: Dashboard visual interaktif dengan grafik omzet harian/mingguan, jam sibuk penjualan, dan menu terlaris.
- **💡 Sikasep AI (Business Assistant & Insights)**: Asisten AI cerdas untuk konsultasi performa toko, rekomendasi strategi bisnis, dan ringkasan insight otomatis.
- **🧾 Cetak Struk Thermal**: Format cetak struk rapi dan praktis untuk printer kasir.
- **📱 Progressive Web App (PWA)**: Akses cepat dari browser atau instal langsung ke layar utama smartphone seperti aplikasi native.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth, Realtime)
- **AI & Natural Language**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
- **Data Visualization**: [Recharts](https://recharts.org/)

---

## 🏁 Memulai Proyek

### 1. Prasyarat
- Node.js versi 18+ atau LTS terbaru
- Akun Supabase & Google Gemini API Key

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env.local` di root proyek dan lengkapi konfigurasi berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup
Jalankan script SQL pada file `supabase/migrations/001_initial_schema.sql` di SQL Editor Supabase Anda.

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 📄 Lisensi & Kontribusi
Dikembangkan untuk memajukan digitalisasi UMKM dan enterpreneur lokal di Kabupaten Purwakarta.
