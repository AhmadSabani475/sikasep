/**
 * Audio Cue Helper — Menghasilkan bunyi chime singkat via Web Audio API.
 * Berjalan tanpa file audio eksternal dan bebas dari ketergantungan TTS.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

export type CueType = 'success' | 'draft' | 'duplicate' | 'error';

/**
 * Memainkan bunyi singkat sesuai tipe event.
 * Mengembalikan Promise yang selesai saat bunyi berakhir (~150-250ms).
 */
export async function playCueSound(type: CueType = 'success', enabled: boolean = true): Promise<void> {
  if (!enabled || typeof window === 'undefined') {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  return new Promise<void>((resolve) => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      let duration = 0.18;

      if (type === 'success') {
        // Melodi naik singkat (523Hz C5 -> 659Hz E5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        duration = 0.18;
      } else if (type === 'draft') {
        // Nada netral tunggal (440Hz A4)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        duration = 0.15;
      } else if (type === 'duplicate') {
        // Nada pendek lembut (330Hz E4)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        duration = 0.12;
      } else {
        // Error tone rendah
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        duration = 0.2;
      }

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore
        }
        resolve();
      };

      // Fallback timer jika onended tidak terpanggil
      setTimeout(resolve, Math.round(duration * 1000) + 50);
    } catch {
      resolve();
    }
  });
}
