// Skenario Mode Ramai end-to-end di Node:
// MicButton ASLI + createMicGate ASLI + createVoiceOrderPipeline ASLI,
// dirangkai persis seperti src/app/dashboard/page.tsx (handleTranscript ->
// pipeline -> executeAutoSave -> jendela Batalkan 8 dtk -> bunyi via micGate.playAppSound).
// Yang dipalsukan hanya batas luar: SpeechRecognition, /api/extract, dan Web Audio.
import { mock } from 'node:test';
import { createFakeSpeech } from './fake-speech.mjs';
import { mount, findNode, textOf } from './fake-react.mjs';
import { loadTsxComponent } from './load-tsx.mjs';

const MENU = [
  { id: 'm1', name: 'Nasi Goreng Spesial', price: 15000 },
  { id: 'm2', name: 'Es Teh Manis', price: 5000 },
  { id: 'm3', name: 'Sate Maranggi', price: 25000 },
];

const RESPONSES = {
  'nasi goreng dua': [{ nama: 'Nasi Goreng Spesial', jumlah: 2, harga: 15000 }],
  'es teh tilu': [{ nama: 'Es Teh Manis', jumlah: 3, harga: 5000 }],
  'sate maranggi hiji': [{ nama: 'Sate Maranggi', jumlah: 1, harga: 25000 }],
};

export async function setupRamaiScenario({ soundMs = 180, extractMs = 400, captureLogs = true } = {}) {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 0 });

  const speech = createFakeSpeech();
  const logs = [];
  const origDebug = console.debug;
  const origWarn = console.warn;
  const origError = console.error;
  const stamp = (msg) => logs.push(`[t=${String(Date.now()).padStart(5)}ms] ${msg}`);
  if (captureLogs) {
    console.debug = (...args) => stamp(args.filter((a) => a !== '[RAMAI-DEBUG]').join(' '));
    console.warn = (...args) => stamp(`WARN ${args.join(' ')}`);
    console.error = (...args) => stamp(`ERROR ${args.map(String).join(' ')}`);
  }

  globalThis.window = {
    webkitSpeechRecognition: speech.Ctor,
    setTimeout: (...a) => setTimeout(...a),
    clearTimeout: (...a) => clearTimeout(...a),
  };
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);

  const { default: MicButton } = await loadTsxComponent('src/components/MicButton.tsx');
  const { createMicGate } = await import('../../src/lib/voice/mic-gate.ts');
  const { createVoiceOrderPipeline, UNDO_WINDOW_MS } = await import('../../src/lib/voice/order-policy.ts');

  const saved = [];
  const outcomes = [];
  let undoTimer = null;
  const micGate = createMicGate();

  // Sama dengan executeAutoSave di page.tsx
  async function executeAutoSave(parsed, rawText) {
    const txId = `TRX-${saved.length + 1}`;
    saved.push({ id: txId, rawText, total: parsed.total });
    console.debug('[RAMAI-DEBUG]', `alur: TERSIMPAN ${txId} -> MENUNGGU BATALKAN (8 dtk)`);
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => console.debug('[RAMAI-DEBUG]', 'alur: jendela Batalkan habis'), UNDO_WINDOW_MS);
    // playCueSound('success') ~180 ms bila Bunyi aktif; langsung selesai bila Bunyi mati
    await micGate.playAppSound(() =>
      soundMs > 0 ? new Promise((r) => setTimeout(r, soundMs)) : undefined
    );
  }

  const pipeline = createVoiceOrderPipeline({
    getMode: () => (props.isRamai ? 'ramai' : 'normal'),
    getMenu: () => MENU,
    extract: async (text) => {
      await new Promise((r) => setTimeout(r, extractMs));
      const items = (RESPONSES[text] ?? []).map((i) => ({
        nama: i.nama,
        jumlah: i.jumlah,
        harga_satuan: i.harga,
        subtotal: i.jumlah * i.harga,
      }));
      return { items, total: items.reduce((s, i) => s + i.subtotal, 0), item_tidak_dikenal: [] };
    },
    onAutoSave: (parsed, raw) => executeAutoSave(parsed, raw),
    onDraft: async () => {
      await micGate.playAppSound(() => (soundMs > 0 ? new Promise((r) => setTimeout(r, soundMs)) : undefined));
    },
    onDuplicate: async () => {
      await micGate.playAppSound(() => (soundMs > 0 ? new Promise((r) => setTimeout(r, soundMs)) : undefined));
    },
    onIgnored: async () => {},
  });

  // Sama dengan handleTranscript di page.tsx
  async function handleTranscript(text) {
    console.debug('[RAMAI-DEBUG]', `alur: MEMPROSES "${text}"`);
    try {
      const outcome = await pipeline.handleTranscript(text);
      outcomes.push(outcome);
      console.debug('[RAMAI-DEBUG]', `alur: hasil pipeline = ${outcome}`);
    } finally {
      console.debug('[RAMAI-DEBUG]', 'alur: SIAP (isProcessing=false)');
    }
  }

  const props = {
    onTranscript: handleTranscript,
    disabled: false,
    micGate,
    isRamai: false,
    onToggleRamai: (v) => {
      props.isRamai = v;
      root.rerender();
    },
  };
  const root = mount(MicButton, () => ({ ...props }));

  async function flush() {
    for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r));
  }

  async function advance(ms, step = 5) {
    for (let t = 0; t < ms; t += step) {
      mock.timers.tick(step);
      await flush();
    }
  }

  function buttonByText(text) {
    const btn = findNode(root.tree, (n) => n.type === 'button' && textOf(n).includes(text));
    if (!btn) throw new Error(`Tombol "${text}" tidak ditemukan`);
    return btn;
  }

  return {
    speech,
    micGate,
    saved,
    outcomes,
    logs,
    advance,
    flush,
    /** Kasir menyalakan Mode Ramai (satu-satunya sentuhan di skenario). */
    async turnOnModeRamai() {
      buttonByText('Mode Ramai').props.onClick();
      await flush();
    },
    /** Pembeli/kasir mengucapkan pesanan. */
    say(text) {
      const heard = speech.say(text);
      if (!heard) console.debug('[RAMAI-DEBUG]', `(ucapan "${text}" tidak sampai: tidak ada sesi mic aktif)`);
      return heard;
    },
    teardown() {
      root.unmount();
      console.debug = origDebug;
      console.warn = origWarn;
      console.error = origError;
      mock.timers.reset();
      delete globalThis.window;
      delete globalThis.requestAnimationFrame;
    },
  };
}
