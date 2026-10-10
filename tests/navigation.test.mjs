import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 2: Navigation & Shell (Sidebar, BottomNav, DashboardLayout)', () => {
  const sidebarPath = path.resolve('src/components/Sidebar.tsx');
  const bottomNavPath = path.resolve('src/components/BottomNav.tsx');
  const layoutPath = path.resolve('src/app/dashboard/layout.tsx');

  test('All navigation files must exist', () => {
    assert.ok(fs.existsSync(sidebarPath), 'Sidebar.tsx must exist');
    assert.ok(fs.existsSync(bottomNavPath), 'BottomNav.tsx must exist');
    assert.ok(fs.existsSync(layoutPath), 'dashboard/layout.tsx must exist');
  });

  test('Sidebar and BottomNav must NOT contain any emoji characters', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');
    const emojiRegex = /\p{Extended_Pictographic}/u;

    assert.equal(emojiRegex.test(sidebarContent), false, 'Sidebar must not contain emojis');
    assert.equal(emojiRegex.test(bottomNavContent), false, 'BottomNav must not contain emojis');
  });

  test('Sidebar and BottomNav must NOT contain purple or pink neon gradients', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

    assert.ok(!sidebarContent.includes('from-purple-500'), 'Sidebar must not contain purple gradients');
    assert.ok(!sidebarContent.includes('to-pink-500'), 'Sidebar must not contain pink gradients');
    assert.ok(!bottomNavContent.includes('from-purple-500'), 'BottomNav must not contain purple gradients');
    assert.ok(!bottomNavContent.includes('to-pink-500'), 'BottomNav must not contain pink gradients');
  });

  test('Sidebar and BottomNav must NOT use undefined legacy classes (.glass, .gradient-primary, .border-white/5)', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

    assert.ok(!sidebarContent.includes('glass'), 'Sidebar must not use dead .glass class');
    assert.ok(!sidebarContent.includes('gradient-primary'), 'Sidebar must not use dead .gradient-primary class');
    assert.ok(!sidebarContent.includes('border-white/5'), 'Sidebar must not use border-white/5');

    assert.ok(!bottomNavContent.includes('glass'), 'BottomNav must not use dead .glass class');
    assert.ok(!bottomNavContent.includes('border-white/5'), 'BottomNav must not use border-white/5');
  });

  test('Sidebar and BottomNav must use Keramik Plered active tokens (#9A3412 / #FDF6E2)', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

    assert.match(sidebarContent, /#9[aA]3412/i, 'Sidebar must use terracotta active color');
    assert.match(bottomNavContent, /#9[aA]3412/i, 'BottomNav must use terracotta active color');
  });

  test('BottomNav items must meet touch target requirement (min-h-[48px])', () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');
    assert.match(bottomNavContent, /min-h-\[48px\]/i, 'BottomNav items must enforce min-h-[48px] touch targets');
  });
});
