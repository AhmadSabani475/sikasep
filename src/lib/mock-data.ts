import { MenuItem, Transaction, TransactionItem } from '@/types';
export const mockMenuItems: MenuItem[] = [
  {
    id: 'menu-1',
    store_id: 'store-1',
    name: 'Sate Maranggi',
    price: 30000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-2',
    store_id: 'store-1',
    name: 'Simping',
    price: 15000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-3',
    store_id: 'store-1',
    name: 'Peuyeum',
    price: 12000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-4',
    store_id: 'store-1',
    name: 'Colenak',
    price: 14000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-5',
    store_id: 'store-1',
    name: 'Es Teh Manis',
    price: 5000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-6',
    store_id: 'store-1',
    name: 'Es Jeruk',
    price: 7000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-7',
    store_id: 'store-1',
    name: 'Teh Hangat',
    price: 4000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-8',
    store_id: 'store-1',
    name: 'Kopi Hitam',
    price: 5000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-9',
    store_id: 'store-1',
    name: 'Nasi Putih',
    price: 5000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-10',
    store_id: 'store-1',
    name: 'Sate Maranggi Sapi',
    price: 35000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-11',
    store_id: 'store-1',
    name: 'Sate Maranggi Kambing',
    price: 40000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-12',
    store_id: 'store-1',
    name: 'Es Kelapa Muda',
    price: 10000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
  {
    id: 'menu-13',
    store_id: 'store-1',
    name: 'Air Mineral',
    price: 4000,
    is_active: true,
    created_at: '2026-07-14T10:00:00Z',
  },
];
const mockTxItems1: TransactionItem[] = [
  {
    id: 'ti-1',
    transaction_id: 'tx-1',
    menu_item_id: 'menu-1',
    item_name: 'Sate Maranggi',
    quantity: 2,
    unit_price: 30000,
    subtotal: 60000,
  },
  {
    id: 'ti-2',
    transaction_id: 'tx-1',
    menu_item_id: 'menu-5',
    item_name: 'Es Teh Manis',
    quantity: 2,
    unit_price: 5000,
    subtotal: 10000,
  },
];

const mockTxItems2: TransactionItem[] = [
  {
    id: 'ti-3',
    transaction_id: 'tx-2',
    menu_item_id: 'menu-2',
    item_name: 'Simping',
    quantity: 2,
    unit_price: 15000,
    subtotal: 30000,
  },
  {
    id: 'ti-4',
    transaction_id: 'tx-2',
    menu_item_id: 'menu-9',
    item_name: 'Nasi Putih',
    quantity: 1,
    unit_price: 5000,
    subtotal: 5000,
  },
  {
    id: 'ti-5',
    transaction_id: 'tx-2',
    menu_item_id: 'menu-6',
    item_name: 'Es Jeruk',
    quantity: 1,
    unit_price: 7000,
    subtotal: 7000,
  },
];

const mockTxItems3: TransactionItem[] = [
  {
    id: 'ti-6',
    transaction_id: 'tx-3',
    menu_item_id: 'menu-4',
    item_name: 'Colenak',
    quantity: 2,
    unit_price: 14000,
    subtotal: 28000,
  },
  {
    id: 'ti-7',
    transaction_id: 'tx-3',
    menu_item_id: 'menu-3',
    item_name: 'Peuyeum',
    quantity: 2,
    unit_price: 12000,
    subtotal: 24000,
  },
  {
    id: 'ti-8',
    transaction_id: 'tx-3',
    menu_item_id: 'menu-7',
    item_name: 'Teh Hangat',
    quantity: 2,
    unit_price: 4000,
    subtotal: 8000,
  },
];
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    store_id: 'store-1',
    raw_transcript: 'dua sate maranggi sama dua es teh',
    total_amount: 70000,
    created_at: new Date().toISOString(),
    items: mockTxItems1,
  },
  {
    id: 'tx-2',
    store_id: 'store-1',
    raw_transcript: 'dua simping satu nasi putih es jeruk',
    total_amount: 42000,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    items: mockTxItems2,
  },
  {
    id: 'tx-3',
    store_id: 'store-1',
    raw_transcript: 'dua colenak dua peuyeum dua teh hangat',
    total_amount: 60000,
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    items: mockTxItems3,
  },
];
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
