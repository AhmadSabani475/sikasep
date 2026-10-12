'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RerengKendiPattern } from '@/components/RerengKendiPattern';
import { KendiIcon } from '@/components/icons/PurwakartaIcons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="relative min-h-screen flex flex-1 items-center justify-center px-4 py-12 bg-[#FFFBEB] text-[#1C1917] overflow-hidden">
      {/* Tekstur Halus Rereng Kendi di Latar Belakang */}
      <RerengKendiPattern opacity={0.04} className="z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header Form */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#9A3412] flex items-center justify-center shadow-xs group-hover:bg-[#7C2D12] transition-colors text-white">
              <KendiIcon size={22} strokeWidth={2} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#1C1917]">
              Sikasep
            </span>
          </Link>
          <p className="text-[#57534E] text-sm font-medium">
            Masuk ke akun kasir wirausaha Anda
          </p>
        </div>

        {/* Kartu Formulir Login */}
        <div className="bg-white rounded-2xl p-8 border border-[#E7E0D3] shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-sm font-medium animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-[#1C1917] mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#FFFBEB]/40 border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#57534E] text-sm focus:outline-none focus:border-[#9A3412] focus:ring-2 focus:ring-[#9A3412]/20 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-[#1C1917] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#FFFBEB]/40 border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#57534E] text-sm focus:outline-none focus:border-[#9A3412] focus:ring-2 focus:ring-[#9A3412]/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#1C1917] transition-colors p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-[#FFFBEB] font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-ring min-h-[48px] flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  <span>Masuk...</span>
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E7E0D3]" />
            <span className="text-xs font-medium text-[#78350F]">atau</span>
            <div className="flex-1 h-px bg-[#E7E0D3]" />
          </div>

          <p className="text-center text-sm text-[#57534E]">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="text-[#9A3412] hover:text-[#7C2D12] font-semibold underline decoration-[#C2410C]/30 underline-offset-4 transition-colors"
            >
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
