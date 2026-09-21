'use client';

import { useState, useEffect } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  amount?: string;
}

export default function SuccessAnimation({ show, onComplete, amount }: SuccessAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'done'>('enter');

  useEffect(() => {
    if (!show) {
      setPhase('enter');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
        osc.start(audioContext.currentTime + startTime);
        osc.stop(audioContext.currentTime + startTime + duration);
      };

      playTone(880, 0, 0.15, 0.2);
      playTone(1320, 0.08, 0.15, 0.15);
      playTone(1760, 0.16, 0.3, 0.12);
    } catch {
    }

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 80]);
    }

    setPhase('enter');
    const enterTimer = setTimeout(() => setPhase('visible'), 50);
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [show, onComplete]);

  if (!show || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`absolute inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          phase === 'exit' ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      <div
        className={`relative flex flex-col items-center gap-4 transition-all duration-500 ${
          phase === 'enter' ? 'opacity-0 scale-50' : 
          phase === 'exit' ? 'opacity-0 scale-110 -translate-y-8' : 
          'opacity-100 scale-100'
        }`}
      >
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-primary-400/30 animate-[success-ring_0.6s_ease-out_forwards]" />
          
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/40">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="animate-[draw-check_0.4s_ease-out_0.2s_forwards]" style={{ strokeDasharray: 24, strokeDashoffset: 24 }}>
              <path d="M20 6 9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary-400"
              style={{
                top: '50%',
                left: '50%',
                animation: `success-particle 0.6s ease-out ${0.1 + i * 0.05}s forwards`,
                transform: `rotate(${i * 45}deg) translateY(0)`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        <div className="text-center animate-[fade-in_0.3s_ease-out_0.3s_forwards] opacity-0">
          <p className="text-lg font-bold text-text-primary">Transaksi Berhasil!</p>
          {amount && (
            <p className="text-primary-400 font-semibold text-sm mt-1">{amount}</p>
          )}
        </div>
      </div>
    </div>
  );
}
