/**
 * OrderPolicy — Aturan keputusan hasil suara kasir v2 (SPEC §7)
 * Memisahkan logika keputusan dari antarmuka React.
 */

import type { MenuItem, ParsedTransactionResult, ParsedItem } from '@/types';

export const DUPLICATE_WINDOW_MS = 3000; // 3 detik anti-ganda dari satu ucapan
export const UNDO_WINDOW_MS = 8000; // 8 detik tombol Batalkan setelah auto-save
export const MAX_REASONABLE_QTY = 20; // Batas jumlah wajar di Mode Ramai

export type VoiceOrderAction = 'autosave' | 'draft' | 'ignore';

export interface VoiceOrderDecision {
  action: VoiceOrderAction;
  reasons: string[];
  matchedItems: ParsedItem[];
  hasUnreasonableQty: boolean;
  hasUnknownItems: boolean;
}

export function normalizeTranscript(text: string): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Memutuskan tindakan untuk hasil ekstraksi suara:
 * - 'ignore': tidak ada satu pun item dikenal.
 * - 'draft': Mode Normal, atau Mode Ramai dengan item tak dikenal / jumlah > 20.
 * - 'autosave': Mode Ramai dengan semua item cocok menu dan jumlah 1–20.
 */
export function decideVoiceOrder(
  parsed: ParsedTransactionResult,
  menu: Array<{ id?: string; name: string; price: number }>,
  mode: 'normal' | 'ramai'
): VoiceOrderDecision {
  const reasons: string[] = [];
  const items = parsed?.items || [];
  const unknownList = parsed?.item_tidak_dikenal || [];

  // Peta nama menu (huruf kecil)
  const menuMap = new Map<string, { id?: string; name: string; price: number }>();
  for (const m of menu) {
    menuMap.set(m.name.toLowerCase(), m);
  }

  const matchedItems: ParsedItem[] = [];
  let unknownItemsCount = unknownList.length;
  let hasUnreasonableQty = false;

  for (const item of items) {
    const lowerName = (item.nama || '').toLowerCase();
    const matched = menuMap.get(lowerName);

    if (matched) {
      matchedItems.push({
        ...item,
        nama: matched.name,
        harga_satuan: matched.price,
        subtotal: item.jumlah * matched.price,
        menu_item_id: matched.id,
      });

      if (item.jumlah > MAX_REASONABLE_QTY) {
        hasUnreasonableQty = true;
      }
    } else {
      unknownItemsCount += 1;
    }
  }

  // 1. Tidak ada satu pun item dikenal -> ignore
  if (matchedItems.length === 0) {
    reasons.push('tidak_ada_item_dikenal');
    return {
      action: 'ignore',
      reasons,
      matchedItems: [],
      hasUnreasonableQty,
      hasUnknownItems: unknownItemsCount > 0,
    };
  }

  // 2. Mode Normal -> selalu masuk draf
  if (mode === 'normal') {
    reasons.push('mode_normal');
    return {
      action: 'draft',
      reasons,
      matchedItems,
      hasUnreasonableQty,
      hasUnknownItems: unknownItemsCount > 0,
    };
  }

  // 3. Mode Ramai
  const hasUnknownItems = unknownItemsCount > 0;
  if (hasUnknownItems) {
    reasons.push('item_tidak_dikenal');
  }
  if (hasUnreasonableQty) {
    reasons.push('jumlah_tidak_wajar');
  }

  if (hasUnknownItems || hasUnreasonableQty) {
    return {
      action: 'draft',
      reasons,
      matchedItems,
      hasUnreasonableQty,
      hasUnknownItems,
    };
  }

  reasons.push('semua_item_cocok');
  return {
    action: 'autosave',
    reasons,
    matchedItems,
    hasUnreasonableQty: false,
    hasUnknownItems: false,
  };
}

export interface UtteranceDeduperOptions {
  windowMs?: number;
  now?: () => number;
}

/**
 * Mendeteksi pengenalan ganda dari satu ucapan dalam jendela waktu pendek (default 3 dtk).
 */
export function createUtteranceDeduper(options: UtteranceDeduperOptions = {}) {
  const windowMs = options.windowMs ?? DUPLICATE_WINDOW_MS;
  const now = options.now ?? (() => Date.now());
  const history = new Map<string, number>();

  return {
    isDuplicateAndRecord(text: string): boolean {
      const normalized = normalizeTranscript(text);
      if (!normalized) return false;

      const currentTime = now();
      const lastSeen = history.get(normalized);

      if (lastSeen !== undefined && currentTime - lastSeen <= windowMs) {
        return true;
      }

      history.set(normalized, currentTime);

      // Bersihkan riwayat yang sudah kedaluwarsa (> 2x windowMs)
      for (const [key, timestamp] of history.entries()) {
        if (currentTime - timestamp > windowMs * 2) {
          history.delete(key);
        }
      }

      return false;
    },
    clear() {
      history.clear();
    },
  };
}

export interface VoiceOrderPipelineOptions {
  getMode: () => 'normal' | 'ramai';
  getMenu: () => Array<{ id?: string; name: string; price: number }>;
  now?: () => number;
  extract: (transcript: string) => Promise<ParsedTransactionResult>;
  onAutoSave?: (parsed: ParsedTransactionResult, transcript: string) => void | Promise<void>;
  onDraft?: (parsed: ParsedTransactionResult, transcript: string) => void | Promise<void>;
  onIgnored?: (transcript: string) => void | Promise<void>;
  onDuplicate?: (transcript: string) => void | Promise<void>;
}

export function createVoiceOrderPipeline(options: VoiceOrderPipelineOptions) {
  const deduper = createUtteranceDeduper({
    windowMs: DUPLICATE_WINDOW_MS,
    now: options.now,
  });

  return {
    async handleTranscript(rawTranscript: string): Promise<'autosave' | 'draft' | 'ignore' | 'duplicate'> {
      const trimmed = (rawTranscript || '').trim();
      if (!trimmed) {
        options.onIgnored?.(trimmed);
        return 'ignore';
      }

      if (deduper.isDuplicateAndRecord(trimmed)) {
        options.onDuplicate?.(trimmed);
        return 'duplicate';
      }

      const parsed = await options.extract(trimmed);
      const decision = decideVoiceOrder(parsed, options.getMenu(), options.getMode());

      if (decision.action === 'autosave') {
        parsed.items = decision.matchedItems;
        parsed.total = parsed.items.reduce((s, i) => s + i.subtotal, 0);
        await options.onAutoSave?.(parsed, trimmed);
        return 'autosave';
      }

      if (decision.action === 'draft') {
        await options.onDraft?.(parsed, trimmed);
        return 'draft';
      }

      await options.onIgnored?.(trimmed);
      return 'ignore';
    },
  };
}
