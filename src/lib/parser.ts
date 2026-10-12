export interface MenuItemInput {
  nama: string;
  harga: number;
}

export interface ParsedItemResult {
  nama: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}

export interface FallbackParseResult {
  items: ParsedItemResult[];
  total: number;
  item_tidak_dikenal: string[];
}

export const NUMBER_WORDS: Record<string, number> = {
  hiji: 1,
  siji: 1,
  satu: 1,
  se: 1,
  seporsi: 1,
  saporsi: 1,
  segelas: 1,
  sacangkir: 1,
  sebungkus: 1,
  dua: 2,
  loro: 2,
  sapasang: 2,
  tilu: 3,
  tiga: 3,
  telu: 3,
  opat: 4,
  empat: 4,
  papat: 4,
  lima: 5,
  limo: 5,
  genep: 6,
  enam: 6,
  tujuh: 7,
  pitu: 7,
  dalapan: 8,
  delapan: 8,
  wolu: 8,
  salapan: 9,
  sembilan: 9,
  songo: 9,
  sapuluh: 10,
  sepuluh: 10,
};

export const REGIONAL_ALIASES: Record<string, string[]> = {
  'sate maranggi': ['maranggi', 'sate', 'marangi'],
  'air mineral': ['cai', 'cai herang', 'aer', 'aqua', 'air'],
  'es kelapa': ['es kalapa', 'kalapa', 'kelapa muda'],
  'teh manis': ['es teh', 'teh haneut', 'teh panas', 'esteh'],
  'simping': ['simping kencur', 'simping purwakarta'],
  'peuyeum': ['peuyeum bendul', 'tapai'],
  'sop iga': ['sop', 'sup iga', 'sop iga sapi', 'sop daging'],
};

function extractNumberFromTokens(tokens: string[]): number | null {
  for (const token of tokens) {
    if (NUMBER_WORDS[token]) return NUMBER_WORDS[token];
    const num = parseInt(token, 10);
    if (!isNaN(num) && num > 0 && num < 100) return num;
  }
  return null;
}

export function parseTranscriptFallback(
  transcript: string,
  menuItems: MenuItemInput[]
): FallbackParseResult {
  const cleanText = (transcript || '').toLowerCase().trim();
  if (!cleanText || !Array.isArray(menuItems) || menuItems.length === 0) {
    return { items: [], total: 0, item_tidak_dikenal: [] };
  }

  // 1. Kumpulkan seluruh pola pencarian menu beserta sinonim/aliasnya
  interface MatchPattern {
    phrase: string;
    item: MenuItemInput;
  }

  const patterns: MatchPattern[] = [];
  for (const item of menuItems) {
    const itemLower = item.nama.toLowerCase();
    patterns.push({ phrase: itemLower, item });

    for (const [key, aliases] of Object.entries(REGIONAL_ALIASES)) {
      if (itemLower.includes(key) || key.includes(itemLower)) {
        for (const alias of aliases) {
          if (!patterns.some((p) => p.phrase === alias && p.item === item)) {
            patterns.push({ phrase: alias, item });
          }
        }
      }
    }
  }

  // Urutkan pola terpanjang lebih dulu (longest match first)
  patterns.sort((a, b) => b.phrase.length - a.phrase.length);

  // 2. Cari seluruh kecocokan item di dalam transkrip ucapan
  interface ItemMatch {
    start: number;
    end: number;
    item: MenuItemInput;
    phrase: string;
  }

  const matches: ItemMatch[] = [];
  for (const p of patterns) {
    let searchStart = 0;
    while (searchStart < cleanText.length) {
      const idx = cleanText.indexOf(p.phrase, searchStart);
      if (idx === -1) break;
      const end = idx + p.phrase.length;

      // Pemeriksaan batas kata (word boundary)
      const prevChar = idx > 0 ? cleanText[idx - 1] : ' ';
      const nextChar = end < cleanText.length ? cleanText[end] : ' ';
      const isWordStart = /[\s,.;!?]/.test(prevChar);
      const isWordEnd = /[\s,.;!?]/.test(nextChar);

      if (isWordStart && isWordEnd) {
        // Hindari tumpang tindih dengan match yang sudah ada
        const overlaps = matches.some((m) => !(end <= m.start || idx >= m.end));
        if (!overlaps) {
          matches.push({ start: idx, end, item: p.item, phrase: p.phrase });
        }
      }
      searchStart = idx + 1;
    }
  }

  // 3. Jika ditemukan kecocokan berbasis posisi (multi-item sequence)
  if (matches.length > 0) {
    // Urutkan berdasarkan kemunculan di teks (kiri ke kanan)
    matches.sort((a, b) => a.start - b.start);

    // Tentukan gaya penuturan: apakah angka sebelum item atau setelah item
    const textBeforeFirst = cleanText.slice(0, matches[0].start).trim();
    const numBeforeFirst = extractNumberFromTokens(
      textBeforeFirst.split(/[\s,.;!?]+/).filter(Boolean)
    );
    const textAfterLast = cleanText.slice(matches[matches.length - 1].end).trim();
    const numAfterLast = extractNumberFromTokens(
      textAfterLast.split(/[\s,.;!?]+/).filter(Boolean)
    );

    // Jika ada angka sebelum item pertama tapi tidak ada setelah item terakhir, gaya prefix
    const preferPrefix = numBeforeFirst !== null && numAfterLast === null;

    const detectedMap = new Map<string, ParsedItemResult>();

    for (let i = 0; i < matches.length; i++) {
      const curr = matches[i];
      const prevEnd = i > 0 ? matches[i - 1].end : 0;
      const nextStart = i < matches.length - 1 ? matches[i + 1].start : cleanText.length;

      const afterTokens = cleanText
        .slice(curr.end, nextStart)
        .trim()
        .split(/[\s,.;!?]+/)
        .filter(Boolean);
      const beforeTokens = cleanText
        .slice(prevEnd, curr.start)
        .trim()
        .split(/[\s,.;!?]+/)
        .filter(Boolean);

      let qty: number | null = null;
      if (preferPrefix) {
        qty = extractNumberFromTokens([...beforeTokens].reverse());
        if (qty === null) qty = extractNumberFromTokens(afterTokens);
      } else {
        qty = extractNumberFromTokens(afterTokens);
        if (qty === null) qty = extractNumberFromTokens([...beforeTokens].reverse());
      }

      if (qty === null) qty = 1;

      const existing = detectedMap.get(curr.item.nama);
      if (existing) {
        existing.jumlah += qty;
        existing.subtotal = existing.jumlah * curr.item.harga;
      } else {
        detectedMap.set(curr.item.nama, {
          nama: curr.item.nama,
          jumlah: qty,
          harga_satuan: curr.item.harga,
          subtotal: qty * curr.item.harga,
        });
      }
    }

    const items = Array.from(detectedMap.values());
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    return { items, total, item_tidak_dikenal: [] };
  }

  // 4. Fallback jika tidak ada pola posisi kata: pisah klausa tradisional
  const clauses = cleanText
    .split(/[,.;!?]|\bdan\b|\bsareng\b|\bjeung\b|\btambah\b|\blalu\b|\bterus\b|\bplus\b/)
    .map((c) => c.trim())
    .filter(Boolean);

  const detectedMap = new Map<string, ParsedItemResult>();

  for (const clause of clauses) {
    let matchedItem: MenuItemInput | null = null;
    for (const item of menuItems) {
      const itemLower = item.nama.toLowerCase();
      if (clause.includes(itemLower)) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      const tokens = clause.split(/[\s,.;!?]+/).filter(Boolean);
      const qty = extractNumberFromTokens(tokens) ?? 1;
      const existing = detectedMap.get(matchedItem.nama);
      if (existing) {
        existing.jumlah += qty;
        existing.subtotal = existing.jumlah * matchedItem.harga;
      } else {
        detectedMap.set(matchedItem.nama, {
          nama: matchedItem.nama,
          jumlah: qty,
          harga_satuan: matchedItem.harga,
          subtotal: qty * matchedItem.harga,
        });
      }
    }
  }

  const items = Array.from(detectedMap.values());
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  return {
    items,
    total,
    item_tidak_dikenal: [],
  };
}
