// Test-first untuk Alur Suara v2 (SPEC §7).
// Ditulis SEBELUM implementasi: semua test di berkas ini diharapkan MERAH
// sampai src/lib/voice/mic-gate.ts dan src/lib/voice/order-policy.ts dibuat.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

async function loadMicGate() {
  return import('../src/lib/voice/mic-gate.ts');
}
async function loadPolicy() {
  return import('../src/lib/voice/order-policy.ts');
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function fakeRecognizer() {
  const calls = [];
  return {
    calls,
    pause() {
      calls.push('pause');
    },
    resume() {
      calls.push('resume');
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

const MENU = [
  { id: 'm1', name: 'Nasi Goreng Spesial', price: 15000 },
  { id: 'm2', name: 'Air Mineral', price: 4000 },
  { id: 'm3', name: 'Sate Maranggi', price: 25000 },
];

function item(nama, jumlah, harga) {
  return { nama, jumlah, harga_satuan: harga, subtotal: jumlah * harga };
}

function result(items, unknown = []) {
  return {
    items,
    total: items.reduce((s, i) => s + i.subtotal, 0),
    item_tidak_dikenal: unknown,
  };
}

/**
 * Bangun pipeline dengan jam palsu & extractor palsu.
 * `responses` memetakan transkrip -> hasil ekstraksi.
 */
async function buildPipeline({ mode = 'ramai', responses = {} } = {}) {
  const { createVoiceOrderPipeline } = await loadPolicy();
  const clock = { t: 0 };
  const log = { autosave: [], draft: [], ignored: [], duplicate: [], extractCalls: 0 };

  const pipeline = createVoiceOrderPipeline({
    getMode: () => mode,
    getMenu: () => MENU,
    now: () => clock.t,
    extract: async (transcript) => {
      log.extractCalls += 1;
      const r = responses[transcript];
      if (!r) throw new Error(`Tidak ada respons palsu untuk: ${transcript}`);
      return r;
    },
    onAutoSave: (parsed, transcript) => log.autosave.push({ parsed, transcript }),
    onDraft: (parsed, transcript) => log.draft.push({ parsed, transcript }),
    onIgnored: (transcript) => log.ignored.push(transcript),
    onDuplicate: (transcript) => log.duplicate.push(transcript),
  });

  return { pipeline, clock, log };
}

// ---------------------------------------------------------------------------
// 1. Mic mati saat aplikasi bersuara
// ---------------------------------------------------------------------------
describe('Voice v2 — mic mati selama aplikasi bersuara (SPEC §7.2)', () => {
  test('mic dijeda SEBELUM bunyi diputar dan dilanjutkan SETELAH bunyi selesai', async () => {
    const { createMicGate } = await loadMicGate();
    const rec = fakeRecognizer();
    const gate = createMicGate(rec);
    gate.setListening(true);

    await gate.playAppSound(async () => {
      rec.calls.push('play');
      assert.equal(gate.acceptsResult(), false, 'hasil pengenalan harus ditolak selama aplikasi bersuara');
    });

    assert.deepEqual(rec.calls, ['pause', 'play', 'resume']);
    assert.equal(gate.acceptsResult(), true, 'hasil diterima lagi setelah bunyi selesai');
  });

  test('mic tetap dilanjutkan walau pemutaran bunyi gagal', async () => {
    const { createMicGate } = await loadMicGate();
    const rec = fakeRecognizer();
    const gate = createMicGate(rec);
    gate.setListening(true);

    await assert.rejects(
      gate.playAppSound(async () => {
        throw new Error('audio diblokir browser');
      })
    );

    assert.deepEqual(rec.calls, ['pause', 'resume']);
    assert.equal(gate.acceptsResult(), true);
  });

  test('bunyi yang tumpang tindih hanya menjeda sekali dan melanjutkan setelah SEMUA selesai', async () => {
    const { createMicGate } = await loadMicGate();
    const rec = fakeRecognizer();
    const gate = createMicGate(rec);
    gate.setListening(true);

    const a = deferred();
    const b = deferred();
    const p1 = gate.playAppSound(() => a.promise);
    const p2 = gate.playAppSound(() => b.promise);

    a.resolve();
    await p1;
    assert.deepEqual(rec.calls, ['pause'], 'belum boleh resume selama bunyi kedua masih aktif');
    assert.equal(gate.acceptsResult(), false);

    b.resolve();
    await p2;
    assert.deepEqual(rec.calls, ['pause', 'resume']);
  });

  test('mic yang dijeda kasir saat bunyi berlangsung TIDAK dinyalakan kembali', async () => {
    const { createMicGate } = await loadMicGate();
    const rec = fakeRecognizer();
    const gate = createMicGate(rec);
    gate.setListening(true);

    await gate.playAppSound(async () => {
      gate.setListening(false); // kasir mengetuk "jeda" saat bunyi diputar
    });

    assert.deepEqual(rec.calls, ['pause'], 'tidak boleh resume karena kasir sudah menjeda');
    assert.equal(gate.acceptsResult(), false);
  });

  test('saat mic tidak mendengar, bunyi diputar tanpa memanggil pause/resume', async () => {
    const { createMicGate } = await loadMicGate();
    const rec = fakeRecognizer();
    const gate = createMicGate(rec);

    await gate.playAppSound(async () => {
      rec.calls.push('play');
    });

    assert.deepEqual(rec.calls, ['play']);
  });

  test('layar kasir tidak lagi memakai TTS pembacaan pesanan maupun filter teks echo', () => {
    const page = fs.readFileSync(path.join(root, 'src/app/dashboard/page.tsx'), 'utf8');
    assert.doesNotMatch(page, /SpeechSynthesisUtterance|speechSynthesis\.speak/, 'TTS pembacaan pesanan harus dihapus');
    assert.doesNotMatch(page, /includes\(\s*['"]rupiah['"]\s*\)/, 'penyaringan teks "rupiah" dilarang sebagai pengaman echo');
    assert.doesNotMatch(page, /includes\(\s*['"]berhasil disimpan['"]\s*\)/, 'penyaringan teks dilarang sebagai pengaman echo');
  });
});

// ---------------------------------------------------------------------------
// 2. Tidak ada transaksi ganda dari satu ucapan
// ---------------------------------------------------------------------------
describe('Voice v2 — anti-transaksi ganda dari satu ucapan (SPEC §7.4)', () => {
  test('konstanta jendela anti-ganda adalah 3 detik dan jendela Batalkan 8 detik', async () => {
    const { DUPLICATE_WINDOW_MS, UNDO_WINDOW_MS } = await loadPolicy();
    assert.equal(DUPLICATE_WINDOW_MS, 3000);
    assert.equal(UNDO_WINDOW_MS, 8000);
  });

  test('satu ucapan yang dilaporkan dua kali dalam 1 detik hanya menyimpan SATU transaksi', async () => {
    const text = 'nasi goreng dua';
    const { pipeline, clock, log } = await buildPipeline({
      responses: { [text]: result([item('Nasi Goreng Spesial', 2, 15000)]) },
    });

    clock.t = 10_000;
    const first = await pipeline.handleTranscript(text);
    clock.t = 11_000;
    const second = await pipeline.handleTranscript(text);

    assert.equal(first, 'autosave');
    assert.equal(second, 'duplicate');
    assert.equal(log.autosave.length, 1);
    assert.equal(log.duplicate.length, 1, 'harus memicu indikator "Pesanan identik diabaikan"');
    assert.equal(log.extractCalls, 1, 'duplikat tidak boleh memanggil ekstraksi lagi');
  });

  test('laporan ganda yang datang bersamaan (sebelum ekstraksi pertama selesai) tetap satu transaksi', async () => {
    const text = 'air mineral hiji';
    const { pipeline, clock, log } = await buildPipeline({
      responses: { [text]: result([item('Air Mineral', 1, 4000)]) },
    });

    clock.t = 5_000;
    const [a, b] = await Promise.all([pipeline.handleTranscript(text), pipeline.handleTranscript(text)]);

    assert.deepEqual([a, b].sort(), ['autosave', 'duplicate']);
    assert.equal(log.autosave.length, 1);
  });

  test('normalisasi: beda huruf besar/spasi tetap dianggap ucapan yang sama', async () => {
    const { pipeline, clock, log } = await buildPipeline({
      responses: { 'nasi goreng dua': result([item('Nasi Goreng Spesial', 2, 15000)]) },
    });

    clock.t = 0;
    await pipeline.handleTranscript('nasi goreng dua');
    clock.t = 2_000;
    const outcome = await pipeline.handleTranscript('  Nasi   Goreng DUA ');

    assert.equal(outcome, 'duplicate');
    assert.equal(log.autosave.length, 1);
  });
});

// ---------------------------------------------------------------------------
// 3. Dua pesanan identik dari pembeli berbeda tetap tercatat dua
// ---------------------------------------------------------------------------
describe('Voice v2 — pesanan identik dari pembeli berbeda tetap dua transaksi (SPEC §7.4)', () => {
  test('pesanan sama berselang > 3 detik menghasilkan DUA transaksi', async () => {
    const text = 'sate maranggi tilu';
    const { pipeline, clock, log } = await buildPipeline({
      responses: { [text]: result([item('Sate Maranggi', 3, 25000)]) },
    });

    clock.t = 0;
    const first = await pipeline.handleTranscript(text);
    clock.t = 3_001;
    const second = await pipeline.handleTranscript(text);

    assert.equal(first, 'autosave');
    assert.equal(second, 'autosave');
    assert.equal(log.autosave.length, 2);
    assert.equal(log.duplicate.length, 0);
  });

  test('tepat di batas 3 detik masih dianggap duplikat', async () => {
    const text = 'sate maranggi tilu';
    const { pipeline, clock, log } = await buildPipeline({
      responses: { [text]: result([item('Sate Maranggi', 3, 25000)]) },
    });

    clock.t = 0;
    await pipeline.handleTranscript(text);
    clock.t = 3_000;
    const second = await pipeline.handleTranscript(text);

    assert.equal(second, 'duplicate');
    assert.equal(log.autosave.length, 1);
  });

  test('pesanan berbeda di antara keduanya tidak memengaruhi pencatatan dua pesanan identik', async () => {
    const a = 'nasi goreng dua';
    const b = 'air mineral hiji';
    const { pipeline, clock, log } = await buildPipeline({
      responses: {
        [a]: result([item('Nasi Goreng Spesial', 2, 15000)]),
        [b]: result([item('Air Mineral', 1, 4000)]),
      },
    });

    clock.t = 0;
    await pipeline.handleTranscript(a);
    clock.t = 1_000;
    await pipeline.handleTranscript(b);
    clock.t = 8_000;
    await pipeline.handleTranscript(a);

    assert.equal(log.autosave.length, 3);
  });
});

// ---------------------------------------------------------------------------
// 4. Jumlah tidak wajar tidak auto-save (+ aturan keputusan lain)
// ---------------------------------------------------------------------------
describe('Voice v2 — aturan keputusan & jumlah tidak wajar (SPEC §7.3)', () => {
  test('batas jumlah wajar adalah 20', async () => {
    const { MAX_REASONABLE_QTY } = await loadPolicy();
    assert.equal(MAX_REASONABLE_QTY, 20);
  });

  test('Mode Ramai: jumlah 21 masuk DRAF, tidak disimpan otomatis', async () => {
    const text = 'nasi goreng dua puluh satu';
    const { pipeline, log } = await buildPipeline({
      responses: { [text]: result([item('Nasi Goreng Spesial', 21, 15000)]) },
    });

    const outcome = await pipeline.handleTranscript(text);

    assert.equal(outcome, 'draft');
    assert.equal(log.autosave.length, 0);
    assert.equal(log.draft.length, 1);
  });

  test('Mode Ramai: jumlah tepat 20 masih disimpan otomatis', async () => {
    const text = 'air mineral dua puluh';
    const { pipeline, log } = await buildPipeline({
      responses: { [text]: result([item('Air Mineral', 20, 4000)]) },
    });

    assert.equal(await pipeline.handleTranscript(text), 'autosave');
    assert.equal(log.autosave.length, 1);
  });

  test('Mode Ramai: satu item tidak wajar membuat SELURUH pesanan masuk draf', async () => {
    const text = 'nasi goreng dua, air mineral lima puluh';
    const { pipeline, log } = await buildPipeline({
      responses: {
        [text]: result([item('Nasi Goreng Spesial', 2, 15000), item('Air Mineral', 50, 4000)]),
      },
    });

    assert.equal(await pipeline.handleTranscript(text), 'draft');
    assert.equal(log.autosave.length, 0);
  });

  test('decideVoiceOrder melaporkan alasan jumlah tidak wajar', async () => {
    const { decideVoiceOrder } = await loadPolicy();
    const decision = decideVoiceOrder(result([item('Sate Maranggi', 25, 25000)]), MENU, 'ramai');
    assert.equal(decision.action, 'draft');
    assert.ok(decision.reasons.includes('jumlah_tidak_wajar'));
  });

  test('Mode Ramai: sebagian item tidak dikenal masuk draf', async () => {
    const { decideVoiceOrder } = await loadPolicy();
    const decision = decideVoiceOrder(
      result([item('Nasi Goreng Spesial', 1, 15000)], ['bakso urat']),
      MENU,
      'ramai'
    );
    assert.equal(decision.action, 'draft');
    assert.ok(decision.reasons.includes('item_tidak_dikenal'));
  });

  test('Mode Ramai: item yang namanya tidak ada di menu dianggap tidak dikenal', async () => {
    const { decideVoiceOrder } = await loadPolicy();
    const decision = decideVoiceOrder(
      result([item('Nasi Goreng Spesial', 1, 15000), item('Es Cendol', 1, 6000)]),
      MENU,
      'ramai'
    );
    assert.equal(decision.action, 'draft');
  });

  test('tanpa satu pun item dikenal: DIABAIKAN, bukan membuat draf (kedua mode)', async () => {
    const { decideVoiceOrder } = await loadPolicy();
    const empty = result([], ['permisi kang']);
    assert.equal(decideVoiceOrder(empty, MENU, 'ramai').action, 'ignore');
    assert.equal(decideVoiceOrder(empty, MENU, 'normal').action, 'ignore');

    const onlyUnknown = result([item('Es Cendol', 1, 6000)]);
    assert.equal(decideVoiceOrder(onlyUnknown, MENU, 'ramai').action, 'ignore');
  });

  test('Mode Normal: hasil valid selalu masuk draf, tidak pernah disimpan otomatis', async () => {
    const text = 'nasi goreng dua';
    const { pipeline, log } = await buildPipeline({
      mode: 'normal',
      responses: { [text]: result([item('Nasi Goreng Spesial', 2, 15000)]) },
    });

    assert.equal(await pipeline.handleTranscript(text), 'draft');
    assert.equal(log.autosave.length, 0);
  });

  test('kecocokan nama menu tidak membedakan huruf besar/kecil', async () => {
    const { decideVoiceOrder } = await loadPolicy();
    const decision = decideVoiceOrder(result([item('nasi goreng spesial', 1, 15000)]), MENU, 'ramai');
    assert.equal(decision.action, 'autosave');
  });
});

// ---------------------------------------------------------------------------
// 5. Integrasi Layar Kasir & Mode Ramai (SPEC §7.1, §7.2, §7.5)
// ---------------------------------------------------------------------------
describe('Voice v2 — integrasi layar kasir & auto-save 8s (SPEC §7.1, §7.2, §7.5)', () => {
  const pagePath = path.join(root, 'src/app/dashboard/page.tsx');
  const micPath = path.join(root, 'src/components/MicButton.tsx');
  const cuePath = path.join(root, 'src/lib/voice/cue.ts');

  test('berkas audio cue Web Audio API tersedia dan bebas TTS', () => {
    assert.ok(fs.existsSync(cuePath), 'src/lib/voice/cue.ts harus ada');
    const content = fs.readFileSync(cuePath, 'utf8');
    assert.match(content, /AudioContext/i, 'harus memakai Web Audio API');
    assert.doesNotMatch(content, /speechSynthesis/, 'audio cue dilarang memakai speechSynthesis');
  });

  test('layar kasir memiliki saklar "Bunyi", saklar permanen "Tunai | QRIS", dan bilah Batalkan 8 detik', () => {
    const page = fs.readFileSync(pagePath, 'utf8');

    // Saklar Bunyi
    assert.match(page, /Bunyi/i, 'harus ada saklar Bunyi pengganti Suara AI');
    // Saklar permanen Tunai | QRIS saat Mode Ramai
    assert.match(page, /ramaiPaymentMethod/i, 'harus ada state metode bayar Mode Ramai');
    assert.match(page, /Tunai \(Uang Pas\)/i, 'harus ada opsi Tunai default');
    assert.match(page, /QRIS/i, 'harus ada opsi QRIS');
    // Jendela Batalkan 8 detik
    assert.match(page, /undoCountdown/i, 'harus ada hitung mundur batalkan');
    assert.match(page, /UNDO_WINDOW_MS/i, 'harus memakai konstanta UNDO_WINDOW_MS (8000ms)');
    assert.match(page, /Batalkan/i, 'harus ada tombol Batalkan');
    // Touch targets >= 48px
    assert.match(page, /min-h-\[48px\]/, 'tombol aksi harus memenuhi target sentuh >= 48px');
  });

  test('MicButton mendukung Mode Ramai dengan 1 ketukan jeda dan integrasi MicGate', () => {
    const mic = fs.readFileSync(micPath, 'utf8');
    assert.match(mic, /micGate/i, 'MicButton harus menerima micGate');
    assert.match(mic, /isRamaiPaused/i, 'harus mendukung jeda Mode Ramai tanpa mematikan continuous');
    assert.match(mic, /acceptsResult/i, 'harus membuang transkrip saat aplikasi bersuara via acceptsResult()');
  });
});

// ---------------------------------------------------------------------------
// 6. Migrasi Skema 002 & Query Supabase (SPEC §7.8)
// ---------------------------------------------------------------------------
describe('Voice v2 — migrasi 002 & queries (SPEC §7.6, §7.8)', () => {
  const migPath = path.join(root, 'supabase/migrations/002_voice_flow_v2.sql');
  const queriesPath = path.join(root, 'src/lib/supabase/queries.ts');
  const analyticsPath = path.join(root, 'src/lib/supabase/analytics.ts');

  test('berkas migrasi 002 mencakup seluruh kolom & RLS yang diwajibkan', () => {
    assert.ok(fs.existsSync(migPath), '002_voice_flow_v2.sql harus ada');
    const mig = fs.readFileSync(migPath, 'utf8');
    assert.match(mig, /payment_method/i);
    assert.match(mig, /status/i);
    assert.match(mig, /source/i);
    assert.match(mig, /cash_received/i);
    assert.match(mig, /change_amount/i);
    assert.match(mig, /updated_at/i);
    assert.match(mig, /create policy.*update/i);
  });

  test('queries.ts mendukung pembatalan, pembaruan item, dan mengecualikan transaksi dibatalkan dari omzet', () => {
    const queries = fs.readFileSync(queriesPath, 'utf8');
    assert.match(queries, /cancelTransaction/, 'harus mengekspor cancelTransaction');
    assert.match(queries, /updateTransaction/, 'harus mengekspor updateTransaction');
    assert.match(queries, /updateTransactionItems/, 'harus mengekspor updateTransactionItems');
    assert.match(queries, /status.*dibatalkan/, 'getTodayTotal harus mengecualikan status dibatalkan');
  });

  test('analytics.ts mengecualikan transaksi dibatalkan dari statistik', () => {
    const analytics = fs.readFileSync(analyticsPath, 'utf8');
    assert.match(analytics, /neq\(\s*['"]status['"]\s*,\s*['"]dibatalkan['"]\s*\)/, 'analytics harus mengecualikan dibatalkan');
  });
});

// ---------------------------------------------------------------------------
// 7. Pengelolaan Transaksi dari Riwayat (SPEC §7.6)
// ---------------------------------------------------------------------------
describe('Voice v2 — kelola transaksi dari riwayat (SPEC §7.6)', () => {
  const riwayatPath = path.join(root, 'src/app/dashboard/riwayat/page.tsx');

  test('halaman riwayat menyediakan aksi Batalkan, Ubah Metode, Edit Item, dan Cetak Struk', () => {
    const riwayat = fs.readFileSync(riwayatPath, 'utf8');
    assert.match(riwayat, /handleTogglePaymentMethod|Ubah ke/i, 'harus ada fitur ubah metode bayar');
    assert.match(riwayat, /handleConfirmCancel|Batalkan Transaksi/i, 'harus ada fitur batalkan transaksi');
    assert.match(riwayat, /handleStartEdit|Edit Item/i, 'harus ada fitur edit item transaksi');
    assert.match(riwayat, /Cetak Struk/i, 'harus ada fitur cetak struk');
    assert.match(riwayat, /Dibatalkan/i, 'harus ada badge status Dibatalkan');
    assert.match(riwayat, /Selesai/i, 'harus ada badge status Selesai');
  });

  test('hitungan transaksi aktif dan item terjual di Riwayat mengecualikan transaksi dibatalkan', () => {
    const riwayat = fs.readFileSync(riwayatPath, 'utf8');
    assert.match(riwayat, /activeTransactions|status\s*!==\s*['"]dibatalkan['"]/, 'harus memfilter transaksi aktif');
  });
});

