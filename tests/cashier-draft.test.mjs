import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// Helper logic simulating draft update in cashier
function updateDraftWithItem(prevResult, item) {
  const existingItems = prevResult ? [...prevResult.items] : [];
  const index = existingItems.findIndex(
    (i) => i.nama.toLowerCase() === item.name.toLowerCase() || i.menu_item_id === item.id
  );

  if (index >= 0) {
    const current = existingItems[index];
    const newQty = current.jumlah + 1;
    existingItems[index] = {
      ...current,
      jumlah: newQty,
      subtotal: newQty * current.harga_satuan,
    };
  } else {
    existingItems.push({
      nama: item.name,
      jumlah: 1,
      harga_satuan: item.price,
      subtotal: item.price,
      menu_item_id: item.id,
    });
  }

  const total = existingItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  return {
    items: existingItems,
    total,
    item_tidak_dikenal: prevResult ? prevResult.item_tidak_dikenal : [],
  };
}

test('Cashier Draft Logic & TDD Scenarios', async (t) => {
  await t.test('dua item berbeda menghasilkan dua baris', () => {
    const item1 = { id: 'item-1', name: 'Nasi Goreng Spesial', price: 15000 };
    const item2 = { id: 'item-2', name: 'Air Mineral', price: 4000 };

    let draft = updateDraftWithItem(null, item1);
    assert.equal(draft.items.length, 1);
    assert.equal(draft.items[0].nama, 'Nasi Goreng Spesial');
    assert.equal(draft.items[0].jumlah, 1);
    assert.equal(draft.total, 15000);

    // Tap second different item
    draft = updateDraftWithItem(draft, item2);
    assert.equal(draft.items.length, 2, 'Dua item berbeda harus menghasilkan dua baris di draf');
    assert.equal(draft.items[0].nama, 'Nasi Goreng Spesial');
    assert.equal(draft.items[1].nama, 'Air Mineral');
    assert.equal(draft.items[1].jumlah, 1);
    assert.equal(draft.total, 19000);
  });

  await t.test('mengetuk item yang sama dua kali menambah qty', () => {
    const item1 = { id: 'item-1', name: 'Nasi Goreng Spesial', price: 15000 };

    let draft = updateDraftWithItem(null, item1);
    assert.equal(draft.items.length, 1);
    assert.equal(draft.items[0].jumlah, 1);

    // Tap same item again
    draft = updateDraftWithItem(draft, item1);
    assert.equal(draft.items.length, 1, 'Mengetuk item yang sama tidak boleh menambah baris baru');
    assert.equal(draft.items[0].jumlah, 2, 'Mengetuk item yang sama dua kali harus menambah qty jadi 2');
    assert.equal(draft.items[0].subtotal, 30000);
    assert.equal(draft.total, 30000);
  });
});

test('TransactionCard Component Requirements', async (t) => {
  const transactionCardPath = path.join(projectRoot, 'src', 'components', 'TransactionCard.tsx');
  const content = fs.readFileSync(transactionCardPath, 'utf-8');

  await t.test('TransactionCard must synchronize internal items with incoming props (useEffect on initialItems)', () => {
    // TransactionCard must NOT solely rely on useState(initialItems) without synchronization
    assert.match(
      content,
      /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*setItems\s*\(\s*initialItems\s*\)/,
      'TransactionCard harus menyinkronkan state internal items ketika initialItems berubah dari parent'
    );
  });

  await t.test('TransactionCard must use stacked card layout instead of cramped table', () => {
    // Should NOT use <table> with cramped columns
    assert.doesNotMatch(
      content,
      /<table\b/,
      'TransactionCard tidak boleh menggunakan tag <table> yang menyebabkan nama item menciut'
    );
  });

  await t.test('TransactionCard must have explicit + and - stepper buttons with >= 48px touch targets', () => {
    assert.match(
      content,
      /min-w-\[48px\][\s\S]*min-h-\[48px\]|min-h-\[48px\][\s\S]*min-w-\[48px\]/,
      'Tombol + dan - pada stepper qty harus memiliki target sentuh minimal 48px'
    );
  });

  await t.test('TransactionCard must not use browser native input number spinner', () => {
    assert.doesNotMatch(
      content,
      /<input[^>]*type=["']number["']/,
      'TransactionCard tidak boleh menggunakan input type="number" bawaan browser'
    );
  });
});
