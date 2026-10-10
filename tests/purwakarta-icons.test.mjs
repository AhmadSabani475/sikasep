import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Task 6: Purwakarta Cultural Icons Component', async (t) => {
  const iconFilePath = path.join(projectRoot, 'src', 'components', 'icons', 'PurwakartaIcons.tsx');

  await t.test('PurwakartaIcons.tsx must exist', () => {
    assert.equal(fs.existsSync(iconFilePath), true, 'PurwakartaIcons.tsx must exist in src/components/icons/');
  });

  const content = fs.existsSync(iconFilePath) ? fs.readFileSync(iconFilePath, 'utf-8') : '';

  await t.test('must export KendiIcon, AngloIcon, IketIcon, FoodTrayIcon, and ReceiptIcon', () => {
    assert.match(content, /export\s+(function|const)\s+KendiIcon\b/, 'Must export KendiIcon');
    assert.match(content, /export\s+(function|const)\s+AngloIcon\b/, 'Must export AngloIcon');
    assert.match(content, /export\s+(function|const)\s+IketIcon\b/, 'Must export IketIcon');
    assert.match(content, /export\s+(function|const)\s+FoodTrayIcon\b/, 'Must export FoodTrayIcon');
    assert.match(content, /export\s+(function|const)\s+ReceiptIcon\b/, 'Must export ReceiptIcon');
  });

  await t.test('must be pure SVG with 24x24 viewBox and stroke-based styling', () => {
    assert.match(content, /viewBox=["']0 0 24 24["']/, 'Must use standard 24x24 viewBox');
    assert.match(content, /strokeLinecap=["']round["']/, 'Must use rounded line caps');
    assert.match(content, /strokeLinejoin=["']round["']/, 'Must use rounded line joins');
  });

  await t.test('must NOT contain any emoji characters', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(content), false, 'PurwakartaIcons.tsx must not contain emojis');
  });
});
