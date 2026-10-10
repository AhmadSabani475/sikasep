
import React from 'react';

interface RerengKendiPatternProps {
  className?: string;
  opacity?: number;
}

/**
 * RerengKendiPattern — Tekstur halus motif batik Rereng Kendi Purwakarta
 * Digunakan secara subtil (opasitas 4% - 6%) pada header, login, atau hero card.
 */
export function RerengKendiPattern({
  className = '',
  opacity = 0.05,
}: RerengKendiPatternProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="rereng-kendi"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            {/* Siluet garis stilasi Kendi Plered */}
            <path
              d="M28 8 C26 8 24 10 24 13 L22 20 C18 23 17 29 19 35 C21 41 28 43 28 43 C28 43 35 41 37 35 C39 29 38 23 34 20 L32 13 C32 10 30 8 28 8 Z"
              fill="none"
              stroke="#9A3412"
              strokeWidth="1.25"
            />
            {/* Garis ornamen leher kendi */}
            <line
              x1="23"
              y1="14"
              x2="33"
              y2="14"
              stroke="#78350F"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#rereng-kendi)"
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

export default RerengKendiPattern;
