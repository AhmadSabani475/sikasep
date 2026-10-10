import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

interface MenuItemInput {
  nama: string;
  harga: number;
}

interface ExtractRequest {
  transcript: string;
  menuItems: MenuItemInput[];
}

// ---------------------------------------------------------------------------
// Rate Limiter In-Memory (Sliding Window per IP)
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 40; // Maksimal 40 request per menit per IP
const ipRateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  // Bersihkan data lama jika sudah expired
  if (!entry || now > entry.resetTime) {
    ipRateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// ---------------------------------------------------------------------------
// Rule-based Fallback Parser (Offline / Dialek Sunda & Indonesia)
// Digunakan saat API key tidak ada, kuota habis, atau AI offline
// ---------------------------------------------------------------------------
const NUMBER_WORDS: Record<string, number> = {
  hiji: 1,
  siji: 1,
  satu: 1,
  se: 1,
  seporsi: 1,
  segelas: 1,
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

export function parseTranscriptFallback(
  transcript: string,
  menuItems: MenuItemInput[]
): {
  items: Array<{ nama: string; jumlah: number; harga_satuan: number; subtotal: number }>;
  total: number;
  item_tidak_dikenal: string[];
} {
  const words = transcript.toLowerCase().split(/\s+/);
  const detectedItems: Array<{ nama: string; jumlah: number; harga_satuan: number; subtotal: number }> = [];
  const unknownWords: string[] = [];

  for (const item of menuItems) {
    const itemNameLower = item.nama.toLowerCase();
    const itemTokens = itemNameLower.split(/\s+/);

    // Cek apakah transkrip memuat sebagian besar token nama menu
    const matchFound = itemTokens.some((token) =>
      token.length > 2 && transcript.toLowerCase().includes(token)
    );

    if (matchFound) {
      // Cari angka sebelum atau sesudah nama menu
      let qty = 1;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (NUMBER_WORDS[w]) {
          qty = NUMBER_WORDS[w];
          break;
        }
        const num = parseInt(w, 10);
        if (!isNaN(num) && num > 0 && num < 100) {
          qty = num;
          break;
        }
      }

      detectedItems.push({
        nama: item.nama,
        jumlah: qty,
        harga_satuan: item.harga,
        subtotal: qty * item.harga,
      });
    }
  }

  const total = detectedItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  return {
    items: detectedItems,
    total,
    item_tidak_dikenal: unknownWords,
  };
}

// ---------------------------------------------------------------------------
// Route Handler POST /api/extract
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // 1. Pemeriksaan Rate Limit (Batas Pemakaian Server-Side)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-client';

    const { allowed, retryAfter } = checkRateLimit(clientIp);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Batas pemakaian suara tercapai (Rate Limit exceeded). Silakan tunggu beberapa detik.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // 2. Parse Body Request
    const body: ExtractRequest = await request.json();
    const { transcript, menuItems } = body;

    if (!transcript || !menuItems || !Array.isArray(menuItems)) {
      return NextResponse.json(
        { error: 'Missing or invalid transcript or menuItems' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 3. Fallback Parser jika API key tidak tersedia di environment server
    if (!apiKey) {
      console.warn('GEMINI_API_KEY tidak terkonfigurasi. Menggunakan parser fallback lokal.');
      const fallbackResult = parseTranscriptFallback(transcript, menuItems);
      return NextResponse.json(fallbackResult);
    }

    // 4. Ekstraksi Menggunakan Google Gemini dengan Toleransi Dialek Sunda Purwakarta
    const menuListStr = JSON.stringify(
      menuItems.map((item) => ({ nama: item.nama, harga: item.harga }))
    );

    const systemPrompt = `Kamu adalah mesin ekstraksi pesanan untuk sistem kasir Sikasep (Purwakarta).
Tugas kamu adalah mengekstrak item, jumlah (kuantitas), dan harga dari teks ucapan kasir/pelanggan.

Daftar menu toko:
${menuListStr}

Kembalikan HANYA format JSON valid berikut tanpa teks markdown tambahan:
{
  "items": [
    {"nama": "string (sesuaikan persis dengan daftar menu)", "jumlah": number, "harga_satuan": number, "subtotal": number}
  ],
  "total": number,
  "item_tidak_dikenal": ["string, ucapan item yang tidak cocok dengan menu manapun"]
}

Aturan Penting:
1. Pahami dialek Sunda Purwakarta dan campuran Indonesia:
   - Angka Sunda: "hiji" = 1, "dua" = 2, "tilu" = 3, "opat" = 4, "lima" = 5, "genep" = 6, "tujuh" = 7, "dalapan" = 8, "salapan" = 9, "sapuluh" = 10.
   - Satuan: "seporsi" / "saporsi" = 1, "segelas" / "sacangkir" = 1, "sapasang" = 2, "sebungkus" = 1.
   - Kuliner Purwakarta: "maranggi" -> Sate Maranggi, "simping", "peuyeum", "es kalapa" / "es kelapa", "teh haneut", "cai herang" -> Air Mineral.
2. Harga HARUS diambil persis dari daftar menu toko. JANGAN mengarang harga.
3. subtotal = jumlah × harga_satuan.
4. total = jumlah total semua subtotal.
5. Jika jumlah tidak disebutkan eksplisit, gunakan 1.`;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Teks ucapan kasir: "${transcript}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;

    if (!responseText) {
      // Fallback jika respon teks kosong
      const fallbackResult = parseTranscriptFallback(transcript, menuItems);
      return NextResponse.json(fallbackResult);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Gagal parse JSON dari Gemini, beralih ke fallback:', responseText);
      const fallbackResult = parseTranscriptFallback(transcript, menuItems);
      return NextResponse.json(fallbackResult);
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      const fallbackResult = parseTranscriptFallback(transcript, menuItems);
      return NextResponse.json(fallbackResult);
    }

    parsed.items = parsed.items.map(
      (item: { nama: string; jumlah: number; harga_satuan: number; subtotal: number }) => ({
        nama: String(item.nama || ''),
        jumlah: Math.max(1, Number(item.jumlah) || 1),
        harga_satuan: Math.max(0, Number(item.harga_satuan) || 0),
        subtotal: Math.max(0, Number(item.subtotal) || 0),
      })
    );

    parsed.total = parsed.items.reduce(
      (sum: number, item: { subtotal: number }) => sum + item.subtotal,
      0
    );

    if (!parsed.item_tidak_dikenal) {
      parsed.item_tidak_dikenal = [];
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Extract API error:', error);
    // Graceful fallback jika terjadi network error atau kuota habis
    try {
      const body: ExtractRequest = await request.clone().json();
      if (body.transcript && Array.isArray(body.menuItems)) {
        const fallbackResult = parseTranscriptFallback(body.transcript, body.menuItems);
        return NextResponse.json(fallbackResult);
      }
    } catch {
      // Ignore clone error
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
