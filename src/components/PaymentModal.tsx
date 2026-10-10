'use client';

import { useState, useMemo } from 'react';
import type { ParsedItem } from '@/types';
import { formatRupiah } from '@/lib/mock-data';
import { ReceiptIcon, KendiIcon } from '@/components/icons/PurwakartaIcons';

interface PaymentModalProps {
  isOpen: boolean;
  items: ParsedItem[];
  total: number;
  onClose: () => void;
  onConfirmPayment: (paymentDetails: {
    method: 'tunai' | 'qris';
    paidAmount: number;
    changeAmount: number;
  }) => Promise<void>;
}

export function PaymentModal({
  isOpen,
  items,
  total,
  onClose,
  onConfirmPayment,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'tunai' | 'qris'>('tunai');
  const [cashInput, setCashInput] = useState<string>(String(total));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Numeric value of cash given
  const paidAmount = useMemo(() => {
    if (method === 'qris') return total;
    const parsed = parseInt(cashInput.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [cashInput, method, total]);

  // Kembalian calculation
  const changeAmount = useMemo(() => {
    return Math.max(0, paidAmount - total);
  }, [paidAmount, total]);

  const isInsufficient = method === 'tunai' && paidAmount < total;

  // Preset cash nominal buttons based on total
  const quickAmounts = useMemo(() => {
    const suggestions = new Set<number>();
    suggestions.add(total); // Uang Pas

    // Round up to nearest 10.000 or 20.000
    const next10k = Math.ceil(total / 10000) * 10000;
    if (next10k > total) suggestions.add(next10k);

    const next20k = Math.ceil(total / 20000) * 20000;
    if (next20k > total) suggestions.add(next20k);

    // Standard Indonesian bills
    if (total <= 50000) suggestions.add(50000);
    if (total <= 100000) suggestions.add(100000);
    suggestions.add(Math.ceil(total / 50000) * 50000 + 50000);

    return Array.from(suggestions).filter((amt) => amt >= total).sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirmPayment({
        method,
        paidAmount,
        changeAmount,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#E7E0D3] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4.5 bg-[#FDF6E2] border-b border-[#E7E0D3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9A3412] text-[#FFFBEB] flex items-center justify-center shadow-2xs">
              <ReceiptIcon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="payment-modal-title" className="text-base font-bold text-[#1C1917]">
                Konfirmasi Pembayaran
              </h2>
              <p className="text-xs text-[#57534E]">Kasir Sikasep Purwakarta</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl text-[#57534E] hover:text-[#1C1917] hover:bg-black/5 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Tutup modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Total Tagihan Card */}
          <div className="bg-[#FFFBEB] rounded-xl p-4 border border-[#E7E0D3] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#57534E]">Total Pembayaran</p>
              <p className="text-2xl font-extrabold text-[#9A3412] tabular-nums mt-0.5">
                {formatRupiah(total)}
              </p>
            </div>
            <span className="text-xs font-bold text-[#78350F] bg-[#FDF6E2] px-3 py-1.5 rounded-lg border border-[#E7E0D3]">
              {items.length} item pesanan
            </span>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-[#1C1917] mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('tunai')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold min-h-[48px] transition-all cursor-pointer ${
                  method === 'tunai'
                    ? 'bg-[#9A3412] text-[#FFFBEB] border-[#9A3412] shadow-xs'
                    : 'bg-white text-[#57534E] border-[#E7E0D3] hover:bg-[#FDF6E2]'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                <span>Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('qris')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold min-h-[48px] transition-all cursor-pointer ${
                  method === 'qris'
                    ? 'bg-[#9A3412] text-[#FFFBEB] border-[#9A3412] shadow-xs'
                    : 'bg-white text-[#57534E] border-[#E7E0D3] hover:bg-[#FDF6E2]'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>QRIS Digital</span>
              </button>
            </div>
          </div>

          {/* Skenario Tunai: Input Uang Diterima & Kembalian */}
          {method === 'tunai' ? (
            <div className="space-y-4 pt-1">
              {/* Tombol Cepat Uang Pas & Pecahan */}
              <div>
                <p className="text-xs font-semibold text-[#57534E] mb-2">Tombol Uang Pas / Pecahan:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickAmounts.map((amt, idx) => {
                    const isUangPas = amt === total;
                    const isSelected = paidAmount === amt;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashInput(String(amt))}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold min-h-[48px] flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#FDF6E2] border-[#9A3412] text-[#9A3412] ring-2 ring-[#9A3412]/20'
                            : 'bg-white border-[#E7E0D3] text-[#1C1917] hover:bg-[#FDF6E2]'
                        }`}
                      >
                        <span className="tabular-nums">{formatRupiah(amt)}</span>
                        {isUangPas && (
                          <span className="text-[10px] text-[#78350F] font-semibold mt-0.5">Uang Pas</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Uang Diterima */}
              <div>
                <label htmlFor="cash-input" className="block text-xs font-bold text-[#1C1917] mb-1.5">
                  Nominal Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#78350F]">
                    Rp
                  </span>
                  <input
                    id="cash-input"
                    type="text"
                    inputMode="numeric"
                    value={cashInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setCashInput(digits);
                    }}
                    placeholder="Masukkan nominal uang..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7E0D3] rounded-xl text-base font-bold text-[#1C1917] tabular-nums focus:outline-none focus:border-[#9A3412] focus:ring-2 focus:ring-[#9A3412]/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* Status Kembalian / Peringatan Kurang */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isInsufficient
                    ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                    : 'bg-[#FDF6E2] border-[#E7E0D3] text-[#78350F]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {isInsufficient ? 'Uang Belum Cukup' : 'Uang Kembalian'}
                  </p>
                  <p className="text-xl font-extrabold tabular-nums mt-0.5">
                    {isInsufficient
                      ? `Kurang ${formatRupiah(total - paidAmount)}`
                      : formatRupiah(changeAmount)}
                  </p>
                </div>
                {!isInsufficient && changeAmount === 0 && (
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-[#E7E0D3] text-[#78350F]">
                    Uang Pas
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Skenario QRIS */
            <div className="bg-[#FDF6E2]/40 rounded-xl p-5 border border-[#E7E0D3] text-center space-y-3">
              <div className="w-36 h-36 mx-auto bg-white rounded-xl border border-[#E7E0D3] p-3 flex flex-col items-center justify-center shadow-xs">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="1.5">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <circle cx="6" cy="6" r="1.5" fill="#1C1917" />
                  <circle cx="18" cy="6" r="1.5" fill="#1C1917" />
                  <circle cx="6" cy="18" r="1.5" fill="#1C1917" />
                  <path d="M14 14h2v2h-2zM18 14h4v4h-4zM14 18h2v4h-2zM18 20h4v2h-4z" fill="#1C1917" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1C1917]">QRIS Kasir Sikasep</p>
                <p className="text-xs text-[#57534E] mt-0.5">
                  Tunjukkan kode QR kepada pelanggan untuk scan via mobile banking / e-wallet.
                </p>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#E7E0D3]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 rounded-xl border border-[#E7E0D3] bg-white text-sm font-semibold text-[#57534E] hover:bg-[#FDF6E2] hover:text-[#1C1917] transition-all min-h-[48px] flex items-center justify-center cursor-pointer"
            >
              Kembali ke Draf
            </button>
            <button
              type="submit"
              disabled={isInsufficient || isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] active:bg-[#6c2710] text-[#FFFBEB] text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <span>Selesaikan Pembayaran</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
