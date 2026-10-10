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
});
