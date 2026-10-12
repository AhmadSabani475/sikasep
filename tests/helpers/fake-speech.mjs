// SpeechRecognition palsu yang meniru semantik Chrome yang relevan:
// - start(): event `start` datang asinkron (~20 ms, saat mic mulai menangkap).
// - stop()/abort(): event `error`('aborted' untuk abort) lalu `end` datang asinkron (~5 ms).
// - start() kedua pada instans yang sama melempar InvalidStateError.
// - Layanan bisa mengakhiri sesi sendiri (hening/timeout) -> error 'no-speech' + `end`.
// Ucapan dikirim ke sesi aktif terbaru. `stats.maxConcurrent` mencatat berapa
// sesi yang pernah aktif bersamaan (Chrome hanya mengizinkan satu tangkapan mic).

export function createFakeSpeech() {
  const instances = [];
  const stats = { maxConcurrent: 0, created: 0 };
  const live = () => instances.filter((i) => i.state === 'starting' || i.state === 'started');

  class FakeSpeechRecognition {
    constructor() {
      this.id = ++stats.created;
      this.state = 'new';
      this.continuous = false;
      this.interimResults = false;
      this.lang = '';
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      instances.push(this);
    }

    start() {
      if (this.state !== 'new') {
        const err = new Error('InvalidStateError: recognition has already started');
        err.name = 'InvalidStateError';
        throw err;
      }
      this.state = 'starting';
      stats.maxConcurrent = Math.max(stats.maxConcurrent, live().length);
      setTimeout(() => {
        if (this.state !== 'starting') return;
        this.state = 'started';
        this.onstart?.();
      }, 20);
    }

    stop() {
      this._finish(null);
    }

    abort() {
      this._finish('aborted');
    }

    _finish(error) {
      if (this.state !== 'starting' && this.state !== 'started') return;
      this.state = 'ending';
      setTimeout(() => {
        if (error) this.onerror?.({ error });
        this.state = 'ended';
        this.onend?.();
      }, 5);
    }
  }

  return {
    Ctor: FakeSpeechRecognition,
    stats,
    instances,
    liveCount: () => live().length,
    /** Ucapkan kalimat final ke sesi aktif terbaru. Mengembalikan false bila tidak ada yang mendengar. */
    say(text) {
      const target = live().filter((i) => i.state === 'started').at(-1);
      if (!target) return false;
      target.onresult?.({
        resultIndex: 0,
        results: { 0: { 0: { transcript: text }, isFinal: true, length: 1 }, length: 1 },
      });
      return true;
    },
    /** Browser mengakhiri sesi sendiri (hening terlalu lama / batas waktu layanan). */
    serviceEndsSession() {
      for (const i of live()) i._finish('no-speech');
    },
  };
}
