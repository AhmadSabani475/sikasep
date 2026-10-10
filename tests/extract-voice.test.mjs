import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Task 4: Gemini Security & Server-Side Rules', async (t) => {
  await t.test('GEMINI API key must NEVER be exposed via NEXT_PUBLIC_', () => {
    // Search codebase for NEXT_PUBLIC_GEMINI
    const srcDir = path.join(projectRoot, 'src');
    function scanDir(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          scanDir(fullPath);
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          assert.doesNotMatch(
            content,
            /NEXT_PUBLIC_GEMINI/i,
            `File ${file.name} must NOT contain NEXT_PUBLIC_GEMINI`
          );
        }
      }
    }
    scanDir(srcDir);
  });
});

test('Task 4: Server-Side Rate Limiter & Rule-Based Fallback', async (t) => {
  const routePath = path.join(projectRoot, 'src', 'app', 'api', 'extract', 'route.ts');
  const content = fs.readFileSync(routePath, 'utf-8');

  await t.test('route.ts must implement rate limiting with 429 response', () => {
    assert.match(
      content,
      /429|Too Many Requests/i,
      'Route handler /api/extract harus menyertakan proteksi rate limit HTTP 429'
    );
  });

  await t.test('route.ts must support Sunda dialect quantities (hiji, dua, tilu, opat, lima)', () => {
    assert.match(
      content,
      /hiji|tilu|sunda/i,
      'System prompt / parser harus mendukung dialek Sunda Purwakarta'
    );
  });

  await t.test('route.ts must feature a graceful fallback parser if Gemini fails or is rate limited', () => {
    assert.match(
      content,
      /fallback|offline|parseTranscriptFallback/i,
      'Route handler /api/extract harus memiliki fallback parser jika AI tidak tersedia'
    );
  });

  await t.test('parseTranscriptFallback must extract multi-item Sunda dialect accurately', async () => {
    const { parseTranscriptFallback } = await import('../src/lib/parser.ts');
    const menuItems = [
      { nama: 'Sate Maranggi', harga: 25000 },
      { nama: 'Nasi Goreng Spesial', harga: 15000 },
      { nama: 'Air Mineral', harga: 4000 },
      { nama: 'Es Kelapa', harga: 8000 },
    ];

    // Case 1: Multi-item dengan angka Sunda
    const res1 = parseTranscriptFallback('nasi goreng dua sareng air mineral hiji', menuItems);
    assert.equal(res1.items.length, 2);
    const nasi = res1.items.find((i) => i.nama === 'Nasi Goreng Spesial');
    const air = res1.items.find((i) => i.nama === 'Air Mineral');
    assert.ok(nasi, 'Nasi Goreng Spesial harus terdeteksi');
    assert.equal(nasi.jumlah, 2);
    assert.ok(air, 'Air Mineral harus terdeteksi');
    assert.equal(air.jumlah, 1);
    assert.equal(res1.total, 2 * 15000 + 1 * 4000);

    // Case 2: Regional culinary alias (maranggi tilu, cai herang hiji)
    const res2 = parseTranscriptFallback('maranggi tilu, cai herang dua', menuItems);
    assert.equal(res2.items.length, 2);
    const sate = res2.items.find((i) => i.nama === 'Sate Maranggi');
    const cai = res2.items.find((i) => i.nama === 'Air Mineral');
    assert.ok(sate, 'Sate Maranggi harus terdeteksi dari alias maranggi');
    assert.equal(sate.jumlah, 3);
    assert.ok(cai, 'Air Mineral harus terdeteksi dari alias cai herang');
    assert.equal(cai.jumlah, 2);
    assert.equal(res2.total, 3 * 25000 + 2 * 4000);
  });
});

