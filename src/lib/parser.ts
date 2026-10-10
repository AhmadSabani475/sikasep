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
};

export function parseTranscriptFallback(
  transcript: string,
  menuItems: MenuItemInput[]
): FallbackParseResult {
  const cleanText = (transcript || '').toLowerCase();
  if (!cleanText || !Array.isArray(menuItems) || menuItems.length === 0) {
    return { items: [], total: 0, item_tidak_dikenal: [] };
  }

  // Pisahkan klausa berdasarkan koma, titik, tanda baca, atau kata sambung
  const clauses = cleanText
    .split(/[,.;!?]|\bdan\b|\bsareng\b|\bjeung\b|\btambah\b|\blalu\b|\bterus\b|\bplus\b/)
    .map((c) => c.trim())
    .filter(Boolean);

  const detectedMap = new Map<string, ParsedItemResult>();

  const extractQuantity = (clauseStr: string): number => {
    const tokens = clauseStr.split(/\s+/);
    for (const token of tokens) {
      if (NUMBER_WORDS[token]) {
        return NUMBER_WORDS[token];
      }
      const num = parseInt(token, 10);
      if (!isNaN(num) && num > 0 && num < 100) {
        return num;
      }
    }
    return 1;
  };

  const matchMenu = (clauseStr: string): MenuItemInput | null => {
    // 1. Exact / substring match
    for (const item of menuItems) {
      const lower = item.nama.toLowerCase();
      if (clauseStr.includes(lower)) {
        return item;
      }
    }

    // 2. Multi-token match (semua token panjang > 2 ada di klausa)
    for (const item of menuItems) {
      const tokens = item.nama.toLowerCase().split(/\s+/);
      const sigTokens = tokens.filter((t) => t.length > 2);
      if (sigTokens.length > 0 && sigTokens.every((t) => clauseStr.includes(t))) {
        return item;
      }
    }

    // 3. Regional alias matching
    for (const item of menuItems) {
      const itemLower = item.nama.toLowerCase();
      for (const [key, aliases] of Object.entries(REGIONAL_ALIASES)) {
        if (itemLower.includes(key) || key.includes(itemLower)) {
          for (const alias of aliases) {
            if (clauseStr.includes(alias)) {
              return item;
            }
          }
        }
      }
    }

    // 4. Single strong token match (> 4 karakter)
    for (const item of menuItems) {
      const tokens = item.nama.toLowerCase().split(/\s+/);
      for (const t of tokens) {
        if (t.length > 4 && clauseStr.includes(t)) {
          return item;
        }
      }
    }

    return null;
  };

  for (const clause of clauses) {
    const matched = matchMenu(clause);
    if (matched) {
      const qty = extractQuantity(clause);
      const existing = detectedMap.get(matched.nama);
      if (existing) {
        existing.jumlah += qty;
        existing.subtotal = existing.jumlah * matched.harga;
      } else {
        detectedMap.set(matched.nama, {
          nama: matched.nama,
          jumlah: qty,
          harga_satuan: matched.harga,
          subtotal: qty * matched.harga,
        });
      }
    }
  }

  // Jika belum ada yang cocok, scan seluruh teks
  if (detectedMap.size === 0) {
    for (const item of menuItems) {
      const itemLower = item.nama.toLowerCase();
      let matched = cleanText.includes(itemLower);
      if (!matched) {
        for (const [key, aliases] of Object.entries(REGIONAL_ALIASES)) {
          if (itemLower.includes(key)) {
            matched = aliases.some((a) => cleanText.includes(a));
            if (matched) break;
          }
        }
      }

      if (matched) {
        const qty = extractQuantity(cleanText);
        detectedMap.set(item.nama, {
          nama: item.nama,
          jumlah: qty,
          harga_satuan: item.harga,
          subtotal: qty * item.harga,
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
