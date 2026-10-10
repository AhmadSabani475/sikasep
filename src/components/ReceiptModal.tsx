'use client';

import type { ParsedItem } from '@/types';
import { formatRupiah } from '@/lib/mock-data';
import { KendiIcon, ReceiptIcon } from '@/components/icons/PurwakartaIcons';

interface ReceiptModalProps {
  isOpen: boolean;
  storeName?: string;
  items: ParsedItem[];
  total: number;
  paymentDetails: {
    method: 'tunai' | 'qris';
    paidAmount: number;
    changeAmount: number;
    transactionId?: string;
    createdAt?: string;
  };
  onNewOrder: () => void;
  onClose: () => void;
}

export function ReceiptModal({
  isOpen,
  storeName = 'Warung Sikasep Purwakarta',
  items,
  total,
  paymentDetails,
  onNewOrder,
  onClose,
}: ReceiptModalProps) {
  if (!isOpen) return null;

  const txId = paymentDetails.transactionId || `TRX-${Date.now().toString().slice(-6)}`;
  const dateStr = paymentDetails.createdAt || new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#E7E0D3] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#FDF6E2] border-b border-[#E7E0D3] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ReceiptIcon size={18} strokeWidth={2.2} className="text-[#9A3412]" />
            <h2 id="receipt-modal-title" className="text-sm font-bold text-[#1C1917]">
              Struk Pembayaran Berhasil
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#57534E] hover:text-[#1C1917] p-1 rounded-lg"
            aria-label="Tutup pratinjau struk"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Thermal Receipt Paper (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-[#1C1917] bg-[#FFFBEB]/40 print:bg-white print:p-0">
          <div className="bg-white p-5 rounded-xl border border-[#E7E0D3] shadow-2xs print:border-none print:shadow-none print:p-0">
            {/* Header Toko */}
            <div className="text-center space-y-1 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#9A3412] text-[#FFFBEB] mx-auto flex items-center justify-center">
                <KendiIcon size={16} strokeWidth={2.2} />
              </div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#1C1917]">
                {storeName}
              </h3>
              <p className="text-[11px] text-[#57534E]">Sikasep POS — Purwakarta</p>
              <p className="text-[10px] text-[#78350F]">Kerajinan & Kuliner Istimewa</p>
            </div>

            {/* Separator Dashed */}
            <div className="border-b border-dashed border-[#E7E0D3] my-2.5" />

            {/* Info Transaksi */}
            <div className="space-y-1 text-[11px] text-[#57534E]">
              <div className="flex justify-between">
                <span>No. Ref:</span>
                <span className="font-bold text-[#1C1917]">{txId}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span className="tabular-nums">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>Kasir Sikasep</span>
              </div>
            </div>

            {/* Separator Dashed */}
            <div className="border-b border-dashed border-[#E7E0D3] my-2.5" />

            {/* Rincian Item */}
            <div className="space-y-2 py-1">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1C1917] truncate">{item.nama}</p>
                    <p className="text-[10px] text-[#57534E] tabular-nums">
                      {item.jumlah} × {formatRupiah(item.harga_satuan)}
                    </p>
                  </div>
                  <span className="font-bold text-[#1C1917] tabular-nums shrink-0">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Separator Dashed */}
            <div className="border-b border-dashed border-[#E7E0D3] my-2.5" />

            {/* Total & Rincian Pembayaran */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-sm font-extrabold text-[#9A3412]">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Metode:</span>
                <span className="font-semibold uppercase">{paymentDetails.method}</span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Bayar:</span>
                <span className="tabular-nums font-semibold">
                  {formatRupiah(paymentDetails.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-[#1C1917] font-bold">
                <span>Kembalian:</span>
                <span className="tabular-nums">
                  {formatRupiah(paymentDetails.changeAmount)}
                </span>
              </div>
            </div>

            {/* Separator Dashed */}
            <div className="border-b border-dashed border-[#E7E0D3] my-3" />

            {/* Pesan Penutup Khas Sunda Purwakarta */}
            <div className="text-center space-y-1 text-[11px] text-[#57534E] pt-1">
              <p className="font-semibold text-[#1C1917]">Hatur nuhun parantos balanja!</p>
              <p className="text-[10px] text-[#78350F]">Sampurasun — Mugia langkung barokah</p>
              <p className="text-[9px] text-[#A8A29E] tracking-widest uppercase mt-2">
                — SIKASEP PURWAKARTA —
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Print & Pesanan Baru) */}
        <div className="p-4 bg-[#FDF6E2]/60 border-t border-[#E7E0D3] flex flex-col gap-2 no-print">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7E0D3] bg-white hover:bg-[#FDF6E2] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer transition-all shadow-2xs"
            >
              <ReceiptIcon size={16} strokeWidth={2} />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={onNewOrder}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] active:bg-[#6c2710] text-xs font-bold text-[#FFFBEB] flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer transition-all shadow-2xs"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Pesanan Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
