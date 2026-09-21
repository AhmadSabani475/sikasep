'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { MicStatus } from '@/types';

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
}

let globalContinuousMode = false;

export default function MicButton({ onTranscript, disabled = false }: MicButtonProps) {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [fallbackText, setFallbackText] = useState('');
  const [continuousMode, setContinuousMode] = useState(globalContinuousMode);
  const continuousModeRef = useRef(globalContinuousMode);
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    setIsSupported(supported);
    
    if (supported && globalContinuousMode) {
      let retryCount = 0;
      let timer: ReturnType<typeof setTimeout>;
      
      const tryStart = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
          timer = setTimeout(tryStart, 1000);
          return;
        }
        
        try {
          startRecording();
        } catch(e) {
          if (retryCount < 10) {
            retryCount++;
            timer = setTimeout(tryStart, 1000);
          } else {
            console.error('Failed to auto-resume mic after 10 retries', e);
          }
        }
      };

      timer = setTimeout(tryStart, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    continuousModeRef.current = continuousMode;
  }, [continuousMode]);

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
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onstart = () => {
      setStatus('recording');
      setInterimText('');
      startAudioVisualization();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimText(interim);

      if (finalTranscript) {
        setInterimText('');
        if (!disabled) {
          onTranscript(finalTranscript.trim());
        }
        
        if (!continuousModeRef.current) {
          setStatus('idle');
          stopAudioVisualization();
          recognition.stop();
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setStatus('idle');
        stopAudioVisualization();
        return;
      }
      
      console.error('Speech recognition error:', event.error);
      setStatus('error');
      stopAudioVisualization();
      setTimeout(() => {
        setStatus((s) => s === 'error' ? 'idle' : s);
        if (continuousModeRef.current && event.error !== 'not-allowed') {
          try { startRecording(); } catch (e) { console.error(e); }
        }
      }, 2000);
    };

    recognition.onend = () => {
      stopAudioVisualization();
      if (status === 'recording') {
        setStatus('idle');
      }
      if (continuousModeRef.current) {
        const tryStartEnd = () => {
          if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
            setTimeout(tryStartEnd, 1000);
            return;
          }
          try { startRecording(); } catch (e) { console.error('onend auto-restart failed', e); }
        };
        setTimeout(tryStartEnd, 1000);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [disabled, onTranscript, status, startAudioVisualization, stopAudioVisualization]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setStatus('idle');
      stopAudioVisualization();
    }
  }, [stopAudioVisualization]);

  const handleClick = () => {
    if (status === 'recording') {
      stopRecording();
      if (continuousMode) {
        setContinuousMode(false);
        globalContinuousMode = false;
      }
    } else {
      startRecording();
    }
  };

  const handleContinuousToggle = () => {
    if (continuousMode) {
      setContinuousMode(false);
      globalContinuousMode = false;
      stopRecording();
    } else {
      setContinuousMode(true);
      globalContinuousMode = true;
      if (status !== 'recording') {
        startRecording();
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
        <div className="glass rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3 text-accent-400 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Browser tidak mendukung input suara. Gunakan Chrome untuk fitur terbaik.
          </div>
          <form onSubmit={handleFallbackSubmit} className="flex gap-2">
            <input
              type="text"
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="Ketik pesanan... (cth: 2 sate maranggi, 1 es teh)"
              className="flex-1 px-4 py-3 rounded-xl bg-surface-700 border border-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={!fallbackText.trim()}
              className="px-5 py-3 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Proses
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-text-secondary h-6 flex items-center gap-2">
        {status === 'idle' && !continuousMode && 'Tekan untuk bicara'}
        {status === 'idle' && continuousMode && (
          <>
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            Mode Ramai aktif — menunggu suara...
          </>
        )}
        {status === 'recording' && (
          <>
            <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
            Merekam... {continuousMode ? '' : 'tekan lagi untuk selesai'}
          </>
        )}
        {status === 'error' && (
          <span className="text-danger-500">Gagal merekam. Coba lagi.</span>
        )}
      </div>

      <div className="relative">
        {status === 'recording' && (
          <>
            <div 
              className="absolute inset-0 rounded-full bg-primary-500/20 transition-transform duration-100"
              style={{ transform: `scale(${1 + audioLevel * 0.6})`, opacity: 0.3 + audioLevel * 0.4 }}
            />
            <div 
              className="absolute inset-0 rounded-full bg-primary-500/10 transition-transform duration-150"
              style={{ transform: `scale(${1 + audioLevel * 1.0})`, opacity: 0.2 + audioLevel * 0.3 }}
            />
            <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-mic-ring" />
            <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-mic-ring" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={disabled}
          className={`relative z-10 w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all focus-ring
            ${
              status === 'recording'
                ? 'bg-danger-500 shadow-lg shadow-danger-500/30 animate-mic-pulse scale-110'
                : continuousMode
                ? 'bg-gradient-to-br from-accent-400 to-accent-500 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105 active:scale-95'
                : 'gradient-primary shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-105 active:scale-95'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={status === 'recording' ? 'Berhenti merekam' : 'Mulai merekam suara'}
        >
          {status === 'recording' ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={handleContinuousToggle}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          continuousMode
            ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
            : 'glass text-text-muted hover:text-text-secondary hover:bg-white/5'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <polyline points="23 20 23 14 17 14" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
        {continuousMode ? 'Mode Ramai: ON' : 'Mode Ramai'}
      </button>

      {interimText && (
        <div className="glass rounded-xl px-4 py-2 max-w-sm text-center animate-fade-in">
          <p className="text-sm text-text-secondary italic">&ldquo;{interimText}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
