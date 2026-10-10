import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 8: Secondary Pages & Design System Harmony', () => {
  const rootDir = process.cwd();
  const menuPath = path.join(rootDir, 'src/app/dashboard/menu/page.tsx');
  const menuModalPath = path.join(rootDir, 'src/components/MenuFormModal.tsx');
  const riwayatPath = path.join(rootDir, 'src/app/dashboard/riwayat/page.tsx');
  const rekapPath = path.join(rootDir, 'src/app/dashboard/rekap/page.tsx');
  const insightsPath = path.join(rootDir, 'src/app/dashboard/insights/page.tsx');

  const files = [
    { name: 'MenuPage', path: menuPath },
    { name: 'MenuFormModal', path: menuModalPath },
    { name: 'RiwayatPage', path: riwayatPath },
    { name: 'RekapPage', path: rekapPath },
    { name: 'InsightsPage', path: insightsPath },
  ];

  test('All secondary pages must NOT contain any emoji characters', () => {
    // Standard emoji regex
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const f of files) {
      assert.ok(fs.existsSync(f.path), `${f.name} must exist`);
      const content = fs.readFileSync(f.path, 'utf8');
      assert.ok(
        !emojiRegex.test(content),
        `${f.name} contains emoji character(s)! Zero-emoji policy applies.`
      );
    }
  });

  test('Secondary pages must NOT contain neon or dark-mode leftover artifacts', () => {
    const forbiddenPatterns = [
      '#10b981', // Neon green
      '#1aad7c', // Neon green
      'from-purple-500', // Neon purple
      'to-pink-500', // Neon pink
      'border-white/5', // Dark mode remnant
      'border-white/10', // Dark mode remnant
      'border-white/[0.03]', // Dark mode remnant
    ];

    for (const f of files) {
      const content = fs.readFileSync(f.path, 'utf8');
      for (const pattern of forbiddenPatterns) {
        assert.ok(
          !content.includes(pattern),
          `${f.name} contains forbidden pattern '${pattern}'. Must use Keramik Plered palette.`
        );
      }
    }
  });

  test('RekapPage charts must use Keramik Plered color palette', () => {
    const content = fs.readFileSync(rekapPath, 'utf8');
    // Terracotta colors: #9A3412 or #C2410C or #78350F or #B45309
    assert.ok(
      content.includes('#9A3412') || content.includes('#C2410C'),
      'RekapPage AreaChart must use Keramik Plered terracotta colors'
    );
  });
});
