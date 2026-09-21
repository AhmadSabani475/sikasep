'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col flex-1 gradient-hero overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">Sikasep</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 text-sm font-medium rounded-full border border-white/10 hover:bg-white/5 transition-colors focus-ring"
        >
          Masuk
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">


        <h1 className="animate-slide-up text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1]">
          Catat Transaksi{" "}
          <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
            Cukup Bicara
          </span>
        </h1>

        <p
          className="animate-slide-up mt-5 text-base md:text-lg text-text-secondary max-w-xl leading-relaxed"
          style={{ animationDelay: "0.1s" }}
        >
          Kasir digital berbasis suara untuk UMKM &amp; enterpreneur Purwakarta.
          Tanpa mengetik, tanpa ribet — ucapkan pesanan, AI yang catat.
        </p>

        <div
          className="animate-slide-up mt-8 flex flex-col sm:flex-row gap-3"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white font-semibold text-sm hover:from-purple-500/30 hover:to-pink-500/30 transition-all focus-ring disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {demoLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memuat Demo...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Coba Demo Langsung
              </>
            )}
          </button>
        </div>

        {demoError && (
          <div className="animate-fade-in mt-4 px-4 py-2 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-xs">
            {demoError}
          </div>
        )}

        <div
          className="animate-slide-up mt-16 relative"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="animate-float relative w-28 h-28 md:w-36 md:h-36 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:w-14 md:h-14"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border border-primary-500/20 animate-mic-ring" />
          <div
            className="absolute inset-0 rounded-full border border-primary-500/10 animate-mic-ring"
            style={{ animationDelay: "0.5s" }}
          />
        </div>
      </main>

      <section className="px-6 pb-12 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            {
              icon: "⚡",
              title: "< 10 Detik",
              desc: "Catat transaksi lebih cepat dari mengetik",
            },
            {
              icon: "🧠",
              title: "AI Insights",
              desc: "Analisis bisnis & saran otomatis dari AI",
            },
            {
              icon: "📊",
              title: "Rekap Otomatis",
              desc: "Riwayat, menu terlaris, & omzet real-time",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-5 text-center hover:bg-white/[0.04] transition-colors"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-text-secondary mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 px-6 text-center border-t border-white/5">
        <p className="text-sm font-medium text-text-secondary">Kasir Kasep, Usaha Makin Sat-Set.</p>
        <p className="text-xs text-text-muted mt-1.5">
          &copy; {new Date().getFullYear()} Sikasep — Sistem Kasir Suara Enterpreneur Purwakarta
        </p>
      </footer>
    </div>
  );
}
