'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RerengKendiPattern } from '@/components/RerengKendiPattern';

export default function LandingPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemo = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setDemoError(data.error || 'Gagal masuk mode demo');
      }
    } catch {
      setDemoError('Terjadi kesalahan jaringan');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FFFBEB] text-[#1C1917] selection:bg-[#9A3412] selection:text-white overflow-hidden">
      {/* Tekstur Halus Rereng Kendi di Latar Belakang */}
      <RerengKendiPattern opacity={0.04} className="z-0" />

      {/* Header Aplikasi */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 border-b border-[#E7E0D3]/80 bg-[#FFFBEB]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Logo Simbol Kendi Air Plered */}
          <div className="w-10 h-10 rounded-xl bg-[#9A3412] flex items-center justify-center shadow-sm">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v2" />
              <path d="M10 4h4" />
              <path d="M9 7h6" />
              <path d="M8 10c0 4.5 1.5 9 4 11 2.5-2 4-6.5 4-11a5 5 0 0 0-8 0Z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#1C1917] block leading-none">
              Sikasep
            </span>
            <span className="text-[11px] font-medium text-[#78350F] tracking-wide uppercase">
              Purwakarta POS
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold rounded-full border border-[#E7E0D3] bg-white text-[#1C1917] hover:bg-[#FDF6E2] hover:border-[#C2410C] transition-all focus-ring shadow-xs min-h-[44px] flex items-center justify-center"
          >
            Masuk Kasir
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-20 text-center max-w-5xl mx-auto">
        {/* Badge Identitas Daerah */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF6E2] border border-[#E7E0D3] text-[#78350F] text-xs font-semibold mb-6 shadow-2xs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <span>Sistem Kasir Suara Enterpreneur Purwakarta</span>
        </div>

        {/* Tajuk Utama Hangat Berkarakter */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1C1917] leading-[1.12] max-w-4xl">
          Catat Transaksi Kasir,{' '}
          <span className="text-[#9A3412] underline decoration-[#C2410C]/40 decoration-wavy decoration-2 underline-offset-8">
            Cukup Ucapkan Suara
          </span>
        </h1>

        {/* Deskripsi Nilai Produk */}
        <p className="mt-6 text-base md:text-lg text-[#57534E] max-w-2xl leading-relaxed">
          Sistem kasir hybrid inovatif untuk wirausaha kuliner dan UMKM Purwakarta.
          Dari antrean Sate Maranggi hingga Simping, cukup bicara pesanan — AI menyusun
          draf keranjang, kasir tinggal konfirmasi dengan satu sentuhan.
        </p>

        {/* Tombol Aksi Utama */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#9A3412] hover:bg-[#7C2D12] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all focus-ring disabled:opacity-60 flex items-center justify-center gap-2.5 min-h-[48px]"
          >
            {demoLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Menyiapkan Kasir Demo...</span>
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Coba Demo Kasir Langsung</span>
              </>
            )}
          </button>

          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#E7E0D3] bg-white hover:bg-[#FDF6E2] text-[#1C1917] font-semibold text-sm shadow-xs transition-all focus-ring min-h-[48px] flex items-center justify-center"
          >
            Daftarkan Usaha
          </Link>
        </div>

        {demoError && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium">
            {demoError}
          </div>
        )}

        {/* Visualisasi Fitur Suara Khas Plered */}
        <div className="mt-14 relative flex flex-col items-center">
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#9A3412] flex items-center justify-center shadow-xl shadow-[#9A3412]/20">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:w-12 md:h-12"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-[#9A3412]/30 animate-mic-ring" />
            <div
              className="absolute inset-0 rounded-full border border-[#9A3412]/20 animate-mic-ring"
              style={{ animationDelay: '0.6s' }}
            />
          </div>

          {/* Contoh Ucapan Suara Kasir */}
          <div className="mt-4 px-4 py-2 rounded-full bg-white border border-[#E7E0D3] text-[#78350F] text-xs font-medium shadow-xs">
            <span>&ldquo;Sate maranggi dua bungkus, es kalapa muda hiji&rdquo;</span>
          </div>
        </div>
      </main>

      {/* Fitur Utama — 3 Kartu Berbasis Ikon Garis SVG (Bebas Emoji) */}
      <section className="relative z-10 px-6 pb-16 md:px-12 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kartu 1: Kecepatan Sat-Set */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E0D3] shadow-xs hover:border-[#C2410C] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Sat-Set &lt; 5 Detik</h3>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              Catat pesanan jauh lebih cepat tanpa mengetik manual satu per satu di layar ponsel.
            </p>
          </div>

          {/* Kartu 2: Hybrid Suara + Sentuh */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E0D3] shadow-xs hover:border-[#C2410C] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Hybrid Suara + Sentuh</h3>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              Quick grid menu terlaris tetap siap di layar sentuh, tombol suara jempol sebagai jalan pintas cepat.
            </p>
          </div>

          {/* Kartu 3: Draf Aman & Struk Rapi */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E0D3] shadow-xs hover:border-[#C2410C] hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-[#1C1917]">Draf Aman &amp; Struk Rapi</h3>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              Suara masuk sebagai draf yang bisa diedit kasir sebelum tap konfirmasi final untuk cetak struk.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Bersahaja */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-[#E7E0D3] bg-[#FAF6F0]">
        <p className="text-sm font-semibold text-[#78350F]">
          Kasir Kasep, Usaha Makin Sat-Set.
        </p>
        <p className="text-xs text-[#57534E] mt-1.5">
          &copy; {new Date().getFullYear()} Sikasep &mdash; Sistem Kasir Suara Enterpreneur Purwakarta.
        </p>
      </footer>
    </div>
  );
}
