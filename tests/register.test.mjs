import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper: Calculate relative luminance according to WCAG 2.1
function getLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const [r, g, b] = rgb.map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper: Calculate contrast ratio between two hex colors
function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Register Page Design System Compliance & Contrast', () => {
  const registerPagePath = path.resolve('src/app/register/page.tsx');

  test('src/app/register/page.tsx must exist', () => {
    assert.ok(fs.existsSync(registerPagePath), 'RegisterPage must exist');
  });

  test('Contrast verification: Cream text (#FFFBEB) on Terracotta button (#9A3412) >= 4.5:1', () => {
    const terracotta = '#9A3412';
    const cream = '#FFFBEB';
    const ratio = getContrastRatio(cream, terracotta);

    assert.ok(
      ratio >= 4.5,
      `Contrast ratio ${ratio.toFixed(2)}:1 must be at least 4.5:1 (WCAG AA)`
    );
  });

  test('RegisterPage must NOT use undefined legacy classes (.gradient-primary, .glass, .gradient-hero, .border-white/5)', () => {
    const content = fs.readFileSync(registerPagePath, 'utf8');

    assert.ok(!content.includes('gradient-primary'), 'Must not use dead .gradient-primary class');
    assert.ok(!content.includes('gradient-hero'), 'Must not use dead .gradient-hero class');
    assert.ok(!content.includes('glass rounded'), 'Must not use dead .glass class');
    assert.ok(!content.includes('border-white/5'), 'Must not use invisible border-white/5');
  });

  test('RegisterPage submit button must use solid terracotta (#9A3412) and cream text (#FFFBEB)', () => {
    const content = fs.readFileSync(registerPagePath, 'utf8');

    assert.match(content, /#9[aA]3412/i, 'Submit button must use terracotta #9A3412');
    assert.match(content, /#FFFBEB/i, 'Button text or background must reference #FFFBEB');
  });

  test('RegisterPage login link must use terracotta instead of old orange', () => {
    const content = fs.readFileSync(registerPagePath, 'utf8');

    assert.ok(!content.includes('text-primary-400'), 'Must not use old orange text-primary-400');
    assert.match(content, /href="\/login"[^>]*text-\[#9[aA]3412\]/i, 'Login link must use terracotta #9A3412');
  });
});
