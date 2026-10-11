/**
 * MicGate — Pengaman mic agar tidak mendengarkan suara yang keluar dari aplikasi sendiri.
 * Menggantikan pendekatan salah yang menyaring teks (misal kata "rupiah").
 */

export interface RecognizerController {
  pause: () => void;
  resume: () => void;
}

export interface MicGate {
  setListening: (listening: boolean) => void;
  isListening: () => boolean;
  acceptsResult: () => boolean;
  playAppSound: <T>(action: () => Promise<T> | T) => Promise<T>;
  setRecognizer?: (controller: RecognizerController | null) => void;
}

export function createMicGate(initialRecognizer?: RecognizerController | null): MicGate {
  let recognizer: RecognizerController | null = initialRecognizer ?? null;
  let listening = false;
  let activeSoundCount = 0;

  return {
    setListening(val: boolean) {
      listening = val;
    },

    isListening() {
      return listening;
    },

    acceptsResult() {
      return listening && activeSoundCount === 0;
    },

    setRecognizer(ctrl: RecognizerController | null) {
      recognizer = ctrl;
    },

    async playAppSound<T>(action: () => Promise<T> | T): Promise<T> {
      const wasListening = listening;
      activeSoundCount += 1;

      if (wasListening && activeSoundCount === 1 && recognizer) {
        try {
          recognizer.pause();
        } catch (e) {
          console.warn('Gagal menjeda recognizer:', e);
        }
      }

      try {
        return await action();
      } finally {
        activeSoundCount = Math.max(0, activeSoundCount - 1);
        // Hanya resume jika active sound count kembali 0 DAN kasir tidak mematikan mic selama bunyi
        if (activeSoundCount === 0 && listening && recognizer) {
          try {
            recognizer.resume();
          } catch (e) {
            console.warn('Gagal melanjutkan recognizer:', e);
          }
        }
      }
    },
  };
}
