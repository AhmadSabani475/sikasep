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

describe('Cashier Screen Fixes & Polish', () => {
  const micButtonPath = path.resolve('src/components/MicButton.tsx');
  const layoutPath = path.resolve('src/app/dashboard/layout.tsx');
  const dashboardPagePath = path.resolve('src/app/dashboard/page.tsx');
  const quickMenuPath = path.resolve('src/components/QuickMenuGrid.tsx');
  const mockDataPath = path.resolve('src/lib/mock-data.ts');

  test('(1) MicButton icon contrast: Icon (#FFFBEB) on Terracotta button (#9A3412) >= 3:1', () => {
    const cream = '#FFFBEB';
    const terracotta = '#9A3412';
    const ratio = getContrastRatio(cream, terracotta);

    assert.ok(ratio >= 3.0, `Contrast ratio ${ratio.toFixed(2)}:1 must be at least 3:1`);
    assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)}:1 meets WCAG AA (>= 4.5:1)`);
  });

  test('(1) MicButton must use terracotta #9A3412 and #FFFBEB stroke (no white-on-white)', () => {
    const content = fs.readFileSync(micButtonPath, 'utf8');

    assert.ok(!content.includes('gradient-primary'), 'Must not use dead .gradient-primary class');
    assert.match(content, /#9[aA]3412/i, 'Must use terracotta #9A3412');
    assert.match(content, /#FFFBEB/i, 'Must use cream #FFFBEB for stroke/fill');
  });

  test('(2 & 6) Dashboard and MicButton must include explanations for Mode Ramai and Suara AI', () => {
    const pageContent = fs.readFileSync(dashboardPagePath, 'utf8');

    assert.match(pageContent, /Mode Ramai/i, 'Must include Mode Ramai mention/explanation');
    assert.match(pageContent, /Suara AI/i, 'Must include Suara AI mention');
  });

  test('(3) AIChatWidget must NOT be rendered in dashboard layout', () => {
    const content = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(!content.includes('<AIChatWidget'), 'Must not render AIChatWidget in layout');
    assert.ok(!content.includes('AIChatWidget'), 'Must not import AIChatWidget in layout');
  });

  test('(4) QuickMenuGrid category tabs must have >= 48px touch targets', () => {
    const content = fs.readFileSync(quickMenuPath, 'utf8');

    assert.match(content, /min-h-\[(?:4[8-9]|[5-9]\d|\d{3})px\]/i, 'Category buttons must have >= 48px touch targets');
  });

  test('(5) Air Mineral must exist in mock-data.ts with realistic price (4000)', () => {
    const content = fs.readFileSync(mockDataPath, 'utf8');

    assert.match(content, /name:\s*['"]Air Mineral['"]/i, 'Air Mineral must be defined in mock-data.ts');
    assert.match(content, /price:\s*4000/i, 'Air Mineral price must be 4000');
  });
});
