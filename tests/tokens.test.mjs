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

describe('Task 1: Keramik Plered Design Tokens & Accessibility', () => {
  const globalsCssPath = path.resolve('src/app/globals.css');
  const rerengPatternPath = path.resolve('src/components/RerengKendiPattern.tsx');

  test('globals.css must exist and contain Keramik Plered palette tokens', () => {
    assert.ok(fs.existsSync(globalsCssPath), 'globals.css must exist');
    const content = fs.readFileSync(globalsCssPath, 'utf8');

    // Expected Keramik Plered tokens
    const requiredTokens = [
      '--color-primary',
      '--color-background',
      '--color-foreground',
      '--color-clay',
      '--color-surface',
      '--color-border',
    ];

    for (const token of requiredTokens) {
      assert.ok(content.includes(token), `globals.css must define ${token}`);
    }

    // Verify terracotta primary #9A3412 or uppercase #9a3412
    assert.match(content, /#9[aA]3412/i, 'Primary color must be Terracotta (#9A3412)');
    // Verify warm sand/cream background #FFFBEB
    assert.match(content, /#fffbeb/i, 'Background color must be Warm Cream (#FFFBEB)');
    // Verify charcoal foreground #1C1917
    assert.match(content, /#1c1917/i, 'Foreground color must be Charcoal (#1C1917)');
  });

  test('Accessibility: Charcoal text on Cream background meets WCAG AA (>= 4.5:1)', () => {
    const cream = '#FFFBEB';
    const charcoal = '#1C1917';
    const ratio = getContrastRatio(charcoal, cream);

    assert.ok(
      ratio >= 4.5,
      `Contrast ratio ${ratio.toFixed(2)}:1 must be at least 4.5:1 (WCAG AA)`
    );
    assert.ok(
      ratio >= 10.0,
      `Targeted contrast ratio ${ratio.toFixed(2)}:1 should be high-contrast (> 10:1) for daylight readability`
    );
  });

  test('Accessibility: Terracotta primary text on Cream background meets WCAG AA for UI (>= 4.5:1)', () => {
    const cream = '#FFFBEB';
    const terracotta = '#9A3412';
    const ratio = getContrastRatio(terracotta, cream);

    assert.ok(
      ratio >= 4.5,
      `Terracotta contrast ratio ${ratio.toFixed(2)}:1 must be at least 4.5:1`
    );
  });

  test('RerengKendiPattern.tsx must exist and have subtle opacity (<= 0.08)', () => {
    assert.ok(fs.existsSync(rerengPatternPath), 'RerengKendiPattern.tsx must exist');
    const content = fs.readFileSync(rerengPatternPath, 'utf8');

    assert.match(content, /<pattern/i, 'Must define an SVG pattern element');
    assert.match(content, /rereng-kendi/i, 'Pattern ID or name must reference rereng-kendi');
    // Opacity should be subtle (between 0.03 and 0.08)
    assert.match(content, /opacity\s*=\s*(?:0\.0[3-8]|"0\.0[3-8]"|\{\s*0\.0[3-8]\s*\})/i, 'Pattern opacity default must be between 3% and 8%');
  });
});
