// Regresi Mode Ramai: mic harus mendengarkan terus-menerus dan langsung siap
// untuk pesanan berikutnya tanpa disentuh, termasuk selama jendela Batalkan 8 dtk.
// Menjalankan MicButton ASLI + MicGate ASLI + pipeline ASLI (lihat tests/helpers/ramai-scenario.mjs).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { setupRamaiScenario } from './helpers/ramai-scenario.mjs';

async function withScenario(opts, fn) {
  const s = await setupRamaiScenario(opts);
  try {
    await fn(s);
  } catch (err) {
    err.message += `\n\n--- log [RAMAI] ---\n${s.logs.join('\n')}`;
    throw err;
  } finally {
    s.teardown();
  }
}

describe('Mode Ramai — mic terus mendengarkan antar pesanan', () => {
  for (const soundMs of [180, 0]) {
    const label = soundMs > 0 ? 'Bunyi aktif' : 'Bunyi mati';

    test(`dua pesanan beruntun tanpa menyentuh apa pun keduanya tersimpan (${label})`, async () => {
      await withScenario({ soundMs }, async (s) => {
        await s.turnOnModeRamai(); // satu-satunya sentuhan
        await s.advance(1500);

        assert.ok(s.say('nasi goreng dua'), 'pesanan 1 harus terdengar');
        await s.advance(2500); // tersimpan + bunyi; jendela Batalkan masih berjalan

        assert.equal(s.saved.length, 1, 'pesanan 1 harus tersimpan');
        assert.ok(s.say('es teh tilu'), 'pesanan 2 harus terdengar selama jendela Batalkan');
        await s.advance(2500);

        assert.deepEqual(
          s.saved.map((t) => t.rawText),
          ['nasi goreng dua', 'es teh tilu'],
          'kedua pesanan harus tersimpan otomatis'
        );
      });
    });

    test(`tidak pernah ada lebih dari satu sesi pengenalan aktif bersamaan (${label})`, async () => {
      await withScenario({ soundMs }, async (s) => {
        await s.turnOnModeRamai();
        await s.advance(1500);
        s.say('nasi goreng dua');
        await s.advance(2500);
        s.say('es teh tilu');
        await s.advance(2500);

        assert.equal(s.speech.stats.maxConcurrent, 1, 'sesi lama tidak boleh tertinggal (yatim) saat sesi baru dibuat');
        assert.equal(s.speech.liveCount(), 1, 'setelah pesanan selesai harus tepat satu sesi mic yang aktif');
      });
    });
  }

  test('sesi yang diakhiri browser sendiri dinyalakan ulang otomatis, termasuk setelah pesanan tersimpan', async () => {
    await withScenario({ soundMs: 180 }, async (s) => {
      await s.turnOnModeRamai();
      await s.advance(1500);
      s.say('nasi goreng dua');
      await s.advance(2500);

      s.speech.serviceEndsSession(); // Chrome menghentikan sesi (hening / batas waktu)
      await s.advance(1000);

      assert.ok(s.say('sate maranggi hiji'), 'mic harus sudah aktif lagi tanpa disentuh');
      await s.advance(2500);
      assert.equal(s.saved.length, 2);
      assert.equal(s.speech.liveCount(), 1);
    });
  });

  test('ucapan berikutnya setelah jendela Batalkan habis tetap terbaca', async () => {
    await withScenario({ soundMs: 180 }, async (s) => {
      await s.turnOnModeRamai();
      await s.advance(1500);
      s.say('nasi goreng dua');
      await s.advance(9000); // lewati jendela Batalkan 8 dtk

      assert.ok(s.say('es teh tilu'), 'mic harus aktif setelah jendela Batalkan habis');
      await s.advance(2500);
      assert.equal(s.saved.length, 2);
    });
  });
});
