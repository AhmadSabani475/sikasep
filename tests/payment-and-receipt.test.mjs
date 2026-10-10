import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Task 7: PaymentModal & Cashier Checkout Requirements', async (t) => {
  const paymentModalPath = path.join(projectRoot, 'src', 'components', 'PaymentModal.tsx');

  await t.test('PaymentModal.tsx must exist', () => {
    assert.equal(fs.existsSync(paymentModalPath), true, 'PaymentModal.tsx must exist in src/components/');
  });

  const content = fs.existsSync(paymentModalPath) ? fs.readFileSync(paymentModalPath, 'utf-8') : '';

  await t.test('must support Tunai and QRIS payment methods', () => {
    assert.match(content, /tunai/i, 'Must support Tunai payment');
    assert.match(content, /qris/i, 'Must support QRIS payment');
  });

  await t.test('must calculate and display kembalian accurately', () => {
    assert.match(content, /kembalian/i, 'Must calculate and display kembalian');
  });

  await t.test('must provide quick cash buttons including Uang Pas', () => {
    assert.match(content, /Uang Pas/i, 'Must provide Uang Pas quick button');
  });

  await t.test('must have minimum 48px touch targets for action buttons', () => {
    assert.match(content, /min-h-\[48px\]/, 'Payment buttons must have min 48px touch target');
  });

  await t.test('must NOT contain any emoji characters', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(content), false, 'PaymentModal.tsx must not contain emojis');
  });
});

test('Task 7: ReceiptModal & Thermal Print Requirements', async (t) => {
  const receiptModalPath = path.join(projectRoot, 'src', 'components', 'ReceiptModal.tsx');

  await t.test('ReceiptModal.tsx must exist', () => {
    assert.equal(fs.existsSync(receiptModalPath), true, 'ReceiptModal.tsx must exist in src/components/');
  });

  const content = fs.existsSync(receiptModalPath) ? fs.readFileSync(receiptModalPath, 'utf-8') : '';

  await t.test('must provide Cetak Struk and Pesanan Baru actions', () => {
    assert.match(content, /Cetak Struk/i, 'Must provide Cetak Struk button');
    assert.match(content, /Pesanan Baru/i, 'Must provide Pesanan Baru button');
  });

  await t.test('must include Purwakarta Sikasep receipt branding', () => {
    assert.match(content, /Sikasep|Purwakarta/i, 'Must include Sikasep/Purwakarta in receipt branding');
  });

  await t.test('must NOT contain any emoji characters', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(content), false, 'ReceiptModal.tsx must not contain emojis');
  });
});

test('Task 7: Dashboard Page Integration', async (t) => {
  const pagePath = path.join(projectRoot, 'src', 'app', 'dashboard', 'page.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  await t.test('Dashboard page must integrate PaymentModal and ReceiptModal', () => {
    assert.match(content, /PaymentModal/, 'page.tsx must import and use PaymentModal');
    assert.match(content, /ReceiptModal/, 'page.tsx must import and use ReceiptModal');
  });
});
