import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Landing Page Redesign & No Emoji Policy', () => {
  const landingPagePath = path.resolve('src/app/page.tsx');

  test('src/app/page.tsx must exist', () => {
    assert.ok(fs.existsSync(landingPagePath), 'page.tsx must exist');
  });

  test('Landing page must NOT contain any emoji characters', () => {
    const content = fs.readFileSync(landingPagePath, 'utf8');

    // Unicode regex matching standard emoji pictographs
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const hasEmoji = emojiRegex.test(content);

    assert.equal(
      hasEmoji,
      false,
      'Landing page must not contain emojis. Found emoji in code!'
    );
  });

  test('Landing page must NOT contain purple or pink neon gradients', () => {
    const content = fs.readFileSync(landingPagePath, 'utf8');

    assert.ok(!content.includes('from-purple-500'), 'Must not contain purple gradients');
    assert.ok(!content.includes('to-pink-500'), 'Must not contain pink gradients');
  });

  test('Landing page must incorporate RerengKendiPattern and Keramik Plered styling', () => {
    const content = fs.readFileSync(landingPagePath, 'utf8');

    assert.match(content, /RerengKendiPattern/i, 'Must use RerengKendiPattern');
    assert.match(content, /Sikasep/i, 'Must feature Sikasep branding');
    assert.match(content, /Purwakarta/i, 'Must mention Purwakarta');
  });
});
