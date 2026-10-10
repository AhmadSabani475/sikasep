import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 3: QuickMenuGrid Component (Hybrid POS Touch Catalog)', () => {
  const quickMenuGridPath = path.resolve('src/components/QuickMenuGrid.tsx');

  test('src/components/QuickMenuGrid.tsx must exist', () => {
    assert.ok(fs.existsSync(quickMenuGridPath), 'QuickMenuGrid.tsx must exist');
  });

  test('QuickMenuGrid must NOT contain any emoji characters', () => {
    const content = fs.readFileSync(quickMenuGridPath, 'utf8');
    const emojiRegex = /\p{Extended_Pictographic}/u;

    assert.equal(
      emojiRegex.test(content),
      false,
      'QuickMenuGrid must not contain emojis'
    );
  });

  test('QuickMenuGrid must use Keramik Plered styling (#9A3412, #E7E0D3, #FDF6E2)', () => {
    const content = fs.readFileSync(quickMenuGridPath, 'utf8');

    assert.match(content, /#9[aA]3412/i, 'Must use terracotta #9A3412 for price or highlight');
    assert.match(content, /#E7E0D3/i, 'Must use lempung border #E7E0D3');
  });

  test('QuickMenuGrid must use tabular-nums for aligned financial numbers', () => {
    const content = fs.readFileSync(quickMenuGridPath, 'utf8');

    assert.match(content, /tabular-nums/i, 'Must specify tabular-nums class for prices');
  });

  test('QuickMenuGrid must feature a responsive grid layout (grid-cols-2 min on mobile)', () => {
    const content = fs.readFileSync(quickMenuGridPath, 'utf8');

    assert.match(content, /grid-cols-2/i, 'Must have 2 columns minimum on mobile');
  });
});
