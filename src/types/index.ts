export interface Store {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  raw_transcript: string | null;
  total_amount: number;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ParsedTransactionResult {
  items: ParsedItem[];
  total: number;
  item_tidak_dikenal: string[];
}

export interface ParsedItem {
  nama: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  is_custom?: boolean;
}

export type MicStatus = 'idle' | 'recording' | 'processing' | 'done' | 'error';
