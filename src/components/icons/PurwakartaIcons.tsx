import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  ariaLabel?: string;
}

/**
 * KendiIcon - Kendi air tembikar khas Keramik Plered Purwakarta.
 * Melambangkan minuman, kesegaran, dan kerajinan tanah liat lokal.
 */
export function KendiIcon({
  size = 24,
  className = '',
  strokeWidth = 2,
  ariaLabel,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Tutup & Leher Kendi */}
      <path d="M10 2h4" />
      <path d="M11 2v3" />
      <path d="M13 2v3" />
      <path d="M9 5h6" />
      <path d="M10 5v3c-3 1.5-5 4-5 7.5a6.5 6.5 0 0 0 13 0c0-3.5-2-6-5-7.5V5" />
      {/* Cerat / Corong Kendi Plered */}
      <path d="M5.5 12.5C4 12 3 10.5 3 9c1.5 0 3 1 4 2" />
      {/* Dasar Kendi */}
      <path d="M9 22h6" />
    </svg>
  );
}

/**
 * AngloIcon - Tungku anglo pembakar sate Maranggi khas Purwakarta.
 * Melambangkan makanan panas, aroma arang, dan kelezatan Maranggi.
 */
export function AngloIcon({
  size = 24,
  className = '',
  strokeWidth = 2,
  ariaLabel,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Kisi Panggangan Atas */}
      <line x1="4" y1="4" x2="20" y2="4" />
      <line x1="7" y1="4" x2="7" y2="7" />
      <line x1="12" y1="4" x2="12" y2="7" />
      <line x1="17" y1="4" x2="17" y2="7" />
      {/* Badan Anglo Tanah Liat */}
      <path d="M4 7h16l-2 10H6L4 7Z" />
      {/* Lubang Sirkulasi Hawa / Abu Bawah */}
      <path d="M9 17v3" />
      <path d="M15 17v3" />
      <path d="M7 20h10" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

/**
 * IketIcon - Iket Sunda (penutup kepala adat khas Jawa Barat / Purwakarta).
 * Melambangkan sapaan hangat, wirausaha lokal, dan jati diri daerah.
 */
export function IketIcon({
  size = 24,
  className = '',
  strokeWidth = 2,
  ariaLabel,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Lipatan Puncak Iket (Makuta Wangsa) */}
      <path d="M12 3 5 9h14l-7-6Z" />
      {/* Lingkar Kepala & Ikatan Kain */}
      <path d="M4 10h16v4c0 4-3.5 7-8 7s-8-3-8-7v-4Z" />
      {/* Simpul Lipatan Belakang Samping */}
      <path d="M18 12c1.5.5 3 2 3 4s-1 3-2 3" />
      <path d="M8 14h8" />
    </svg>
  );
}

/**
 * FoodTrayIcon - Nampan saji / besek bambu tradisional.
 * Melambangkan pesanan kuliner dan etalase hidangan khas Purwakarta.
 */
export function FoodTrayIcon({
  size = 24,
  className = '',
  strokeWidth = 2,
  ariaLabel,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Tudung Saji / Nampan */}
      <path d="M12 4v2" />
      <path d="M4 14a8 8 0 0 1 16 0H4Z" />
      <line x1="2" y1="18" x2="22" y2="18" />
      <path d="M4 18l1 2h14l1-2" />
    </svg>
  );
}

/**
 * ReceiptIcon - Struk transaksi kasir dengan stempel kendi tanah liat.
 * Melambangkan bukti transaksi, rekap pembayaran, dan transparansi toko.
 */
export function ReceiptIcon({
  size = 24,
  className = '',
  strokeWidth = 2,
  ariaLabel,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Lembaran Struk Kertas bergerigi */}
      <path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2V3Z" />
      {/* Garis Data Transaksi */}
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  );
}
