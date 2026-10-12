'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { MicStatus } from '@/types';
import type { MicGate } from '@/lib/voice/mic-gate';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  micGate?: MicGate;
  isRamai?: boolean;
  onToggleRamai?: (active: boolean) => void;
}

let globalContinuousMode = false;

export default function MicButton({
  onTranscript,
  disabled = false,
  micGate,
  isRamai: controlledIsRamai,
  onToggleRamai,
}: MicButtonProps) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [fallbackText, setFallbackText] = useState('');
  
  // Mode Ramai state (controlled if prop provided, else local)
  const isControlled = controlledIsRamai !== undefined;
  const [localContinuousMode, setLocalContinuousMode] = useState(globalContinuousMode);
  const continuousMode = isControlled ? controlledIsRamai : localContinuousMode;
  const continuousModeRef = useRef(continuousMode);
  
  const [isRamaiPaused, setIsRamaiPaused] = useState(false);
  const isRamaiPausedRef = useRef(false);
  const isAppSoundMutedRef = useRef(false);

  const [audioLevel, setAudioLevel] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    continuousModeRef.current = continuousMode;
    globalContinuousMode = continuousMode;
  }, [continuousMode]);

  useEffect(() => {
    isRamaiPausedRef.current = isRamaiPaused;
  }, [isRamaiPaused]);

  const startAudioVisualization = useCallback(() => {
    const updateLevel = () => {
      setAudioLevel(0.1 + Math.random() * 0.4);
      animFrameRef.current = window.setTimeout(() => {
        requestAnimationFrame(updateLevel);
      }, 150);
    };
    updateLevel();
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animFrameRef.current) {
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.webkitSpeechRecognition || window.SpeechRecognition)
      : null;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuousModeRef.current;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onstart = () => {
      // Abaikan event dari sesi lama yang sudah digantikan
      if (recognitionRef.current !== recognition) return;
      setStatus('recording');
      setInterimText('');
      startAudioVisualization();
      micGate?.setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (recognitionRef.current !== recognition) return;
      // Echo defense: buang hasil jika suara aplikasi sedang diputar
      if (micGate && !micGate.acceptsResult()) {
        return;
      }
      if (isAppSoundMutedRef.current) {
        return;
      }

      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentInterim) {
        setInterimText(currentInterim);
      }

      if (finalTranscript.trim()) {
        setInterimText('');
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognitionRef.current !== recognition) return;
      // Abaikan error 'aborted' karena dipicu secara sengaja saat mic dijeda/dihentikan
      if (event.error === 'aborted') {
        return;
      }
      if (event.error === 'no-speech' && continuousModeRef.current && !isRamaiPausedRef.current) {
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        continuousModeRef.current = false;
      }
      console.warn('Speech recognition error:', event.error);
      setStatus('error');
      stopAudioVisualization();
      micGate?.setListening(false);
    };

    recognition.onend = () => {
      // Sesi lama yang sudah digantikan tidak boleh mengubah status sesi yang sedang berjalan
      if (recognitionRef.current !== recognition) return;
      const mutedByAppSound = isAppSoundMutedRef.current;
      stopAudioVisualization();
      recognitionRef.current = null;
      // Saat dimatikan sementara oleh MicGate, niat kasir tetap "mendengarkan":
      // jangan laporkan listening=false agar MicGate menyalakan ulang setelah bunyi.
      if (mutedByAppSound) return;

      micGate?.setListening(false);
      if (continuousModeRef.current && !isRamaiPausedRef.current) {
        setTimeout(() => {
          if (
            continuousModeRef.current &&
            !isRamaiPausedRef.current &&
            !isAppSoundMutedRef.current &&
            !recognitionRef.current
          ) {
            startRecordingRef.current();
          }
        }, 300);
      } else {
        setStatus('idle');
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      recognitionRef.current = null;
      setStatus('error');
      micGate?.setListening(false);
    }
  }, [onTranscript, startAudioVisualization, stopAudioVisualization, micGate]);

  const startRecordingRef = useRef<() => void>(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    // Selalu laporkan ke MicGate, termasuk saat sesi sedang dimatikan sementara oleh bunyi,
    // agar MicGate tidak menyalakan ulang mic yang dijeda kasir.
    setStatus('idle');
    stopAudioVisualization();
    micGate?.setListening(false);
  }, [stopAudioVisualization, micGate]);

  // Daftarkan controller ke MicGate untuk menjeda saat suara aplikasi diputar
  useEffect(() => {
    if (micGate?.setRecognizer) {
      micGate.setRecognizer({
        pause: () => {
          isAppSoundMutedRef.current = true;
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch {
              // ignore
            }
          }
          stopAudioVisualization();
        },
        resume: () => {
          isAppSoundMutedRef.current = false;
          if (!continuousModeRef.current || isRamaiPausedRef.current) return;
          if (recognitionRef.current) {
            // Sesi yang di-abort belum selesai berakhir: onend-nya akan menyalakan ulang.
            return;
          }
          startRecordingRef.current();
        },
      });
    }
  }, [micGate, stopAudioVisualization]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    setIsSupported(supported);

    if (supported && continuousMode) {
      const timer = setTimeout(() => {
        // Jangan ganti sesi yang sudah dibuat (mis. oleh tombol saklar Mode Ramai)
        if (!isRamaiPausedRef.current && !recognitionRef.current) {
          try {
            startRecording();
          } catch (e) {
            console.error('Failed to auto-start mic in Mode Ramai', e);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [continuousMode, startRecording]);

  // Klik tombol mic besar
  const handleClick = () => {
    if (continuousMode) {
      // Di Mode Ramai: 1 ketukan untuk menjeda / melanjutkan (SPEC §7.1)
      if (isRamaiPaused) {
        setIsRamaiPaused(false);
        isRamaiPausedRef.current = false;
        startRecording();
      } else {
        setIsRamaiPaused(true);
        isRamaiPausedRef.current = true;
        stopRecording();
      }
    } else {
      // Di Mode Normal: 1 ketukan mulai / berhenti
      if (status === 'recording') {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // Toggle Mode Ramai via tombol saklar bawah
  const handleContinuousToggle = () => {
    const nextVal = !continuousMode;
    if (isControlled && onToggleRamai) {
      onToggleRamai(nextVal);
    } else {
      setLocalContinuousMode(nextVal);
    }
    setIsRamaiPaused(false);
    isRamaiPausedRef.current = false;

    if (!nextVal) {
      stopRecording();
    } else {
      if (status !== 'recording') {
        setTimeout(startRecording, 100);
      }
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackText.trim()) {
      onTranscript(fallbackText.trim());
      setFallbackText('');
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full animate-fade-in">
        <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E7E0D3]">
          <div className="flex items-center gap-2 mb-3 text-[#78350F] text-xs font-semibold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Browser tidak mendukung Web Speech API. Gunakan Google Chrome untuk fitur suara.
          </div>
          <form onSubmit={handleFallbackSubmit} className="flex gap-2">
            <input
              type="text"
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="Ketik pesanan... (cth: 2 sate maranggi, 1 es teh)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFFBEB]/50 border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#57534E] text-sm focus:outline-none focus:border-[#9A3412] focus:ring-2 focus:ring-[#9A3412]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!fallbackText.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-[#FFFBEB] text-sm font-semibold disabled:opacity-40 transition-all min-h-[48px]"
            >
              Proses
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 w-full">
      {/* 1. Status Bar Rata Tengah (Aksesibel & Jelas) */}
      <div className="text-xs font-semibold px-4 py-1 rounded-full bg-[#FDF6E2] border border-[#E7E0D3] text-[#78350F] h-7 flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap min-w-[200px]">
        {status === 'idle' && !continuousMode && 'Tekan untuk bicara'}
        {continuousMode && !isRamaiPaused && (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-[#9A3412] animate-pulse" />
            <span className="text-[#9A3412]">Mode Ramai aktif — mendengarkan... (1 ketukan untuk jeda)</span>
          </>
        )}
        {continuousMode && isRamaiPaused && (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
            <span className="text-[#B45309]">Mode Ramai dijeda — ketuk untuk lanjut</span>
          </>
        )}
        {status === 'recording' && !continuousMode && (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] animate-pulse" />
            <span className="text-[#B91C1C]">Merekam... tekan lagi untuk stop</span>
          </>
        )}
        {status === 'error' && (
          <span className="text-[#B91C1C]">Gagal merekam. Coba tekan lagi.</span>
        )}
      </div>

      {/* 2. Tombol Mic Besar Berwarna Terakota Solid (#9A3412) dengan Ikon Krem (#FFFBEB) */}
      <div className="relative my-1">
        {/* Glow Ring saat aktif */}
        {(status === 'recording' || (continuousMode && !isRamaiPaused)) && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-[#9A3412]/30 transition-transform duration-100"
              style={{
                transform: `scale(${1 + (audioLevel || 0.15) * 0.5})`,
                opacity: 0.3 + (audioLevel || 0.15) * 0.4,
              }}
            />
            <div className="absolute inset-0 rounded-full border-2 border-[#9A3412]/40 animate-mic-ring" />
            <div
              className="absolute inset-0 rounded-full border border-[#9A3412]/30 animate-mic-ring"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={disabled}
          type="button"
          className={`relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all focus-ring shadow-lg cursor-pointer ${
            continuousMode
              ? isRamaiPaused
                ? 'bg-[#B45309] hover:bg-[#92400E] text-[#FFFBEB] shadow-[#B45309]/30 hover:scale-105 active:scale-95'
                : 'bg-[#9A3412] hover:bg-[#7C2D12] text-[#FFFBEB] shadow-[#9A3412]/40 animate-pulse scale-105'
              : status === 'recording'
              ? 'bg-[#B91C1C] hover:bg-[#991B1B] text-[#FFFBEB] shadow-[#B91C1C]/30 animate-mic-pulse scale-105'
              : 'bg-[#9A3412] hover:bg-[#7C2D12] active:bg-[#6c2710] text-[#FFFBEB] shadow-[#9A3412]/30 hover:scale-105 active:scale-95'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          aria-label={
            continuousMode
              ? isRamaiPaused
                ? 'Lanjutkan mikrofon Mode Ramai'
                : 'Jeda mikrofon Mode Ramai'
              : status === 'recording'
              ? 'Berhenti merekam suara'
              : 'Mulai merekam suara kasir'
          }
        >
          {continuousMode && isRamaiPaused ? (
            // Icon Play / Resume saat dijeda
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="#FFFBEB"
              aria-hidden="true"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : status === 'recording' && !continuousMode ? (
            // Icon Stop di Mode Normal
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="#FFFBEB"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Icon Mic
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFBEB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {/* 3. Tombol Mode Ramai Sejajar, Aksesibel (min 48px) & Keterangan Singkat */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <button
          onClick={handleContinuousToggle}
          disabled={disabled}
          type="button"
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[48px] cursor-pointer border shadow-2xs w-full max-w-[240px] ${
            continuousMode
              ? 'bg-[#9A3412] text-[#FFFBEB] border-[#9A3412] shadow-xs'
              : 'bg-white text-[#57534E] border-[#E7E0D3] hover:bg-[#FDF6E2] hover:text-[#1C1917]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="1 4 1 10 7 10" />
            <polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          <span>{continuousMode ? 'Mode Ramai: Aktif' : 'Mode Ramai'}</span>
        </button>
        <p className="text-[11px] text-[#57534E] text-center max-w-[260px] leading-tight">
          {continuousMode
            ? 'Mic terus aktif & auto-save. Ketuk tombol mic untuk menjeda.'
            : 'Mic terus aktif saat antrean ramai tanpa perlu ditekan berulang'}
        </p>
      </div>

      {/* 4. Transkrip Sementara Real-time */}
      {interimText && (
        <div className="bg-[#FFFBEB] rounded-xl px-4 py-2 border border-[#E7E0D3] max-w-sm text-center animate-fade-in shadow-2xs">
          <p className="text-xs text-[#78350F] italic leading-relaxed">&ldquo;{interimText}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
