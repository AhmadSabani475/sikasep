import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { parseTranscriptFallback, type MenuItemInput } from '@/lib/parser';

export { parseTranscriptFallback };

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
// Route Handler POST /api/extract
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Simpan input request di scope fungsi agar fallback selalu punya data valid
  let transcript = '';
  let menuItems: MenuItemInput[] = [];

  try {
    const body: ExtractRequest = await request.json();
    transcript = (body.transcript || '').trim();
    menuItems = Array.isArray(body.menuItems) ? body.menuItems : [];
  } catch {
    return NextResponse.json(
      { error: 'Format JSON permintaan tidak valid' },
      { status: 400 }
    );
  }

  if (!transcript) {
    return NextResponse.json(
      { error: 'Teks transkrip suara kosong' },
      { status: 400 }
    );
  }

  // 2. Pemeriksaan Rate Limit (Batas Pemakaian Server-Side)
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

  const apiKey = process.env.GEMINI_API_KEY;

  // 3. Fallback Parser jika API key tidak ada
  if (!apiKey) {
    console.warn('GEMINI_API_KEY tidak terkonfigurasi. Menggunakan parser fallback lokal.');
    const fallbackResult = parseTranscriptFallback(transcript, menuItems);
    return NextResponse.json(fallbackResult);
  }

  // 4. Ekstraksi Menggunakan Google Gemini dengan Timeout & Graceful Fallback
  const menuListStr = JSON.stringify(
    menuItems.map((item) => ({ nama: item.nama, harga: item.harga }))
  );

  const systemPrompt = `Kamu adalah mesin ekstraksi pesanan untuk sistem kasir Sikasep (Purwakarta).
Tugas kamu adalah mengekstrak item, jumlah (kuantitas), dan harga dari teks ucapan kasir/pelanggan.

Daftar menu toko:
${menuListStr}

Kembalikan HANYA format JSON valid berikut tanpa markdown/teks lain:
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
   - Kuliner Purwakarta: "maranggi" -> Sate Maranggi, "simping", "peuyeum", "es kalapa" -> Es Kelapa, "cai herang" / "cai" -> Air Mineral.
2. Harga HARUS diambil persis dari daftar menu toko. JANGAN mengarang harga.
3. subtotal = jumlah × harga_satuan.
4. total = jumlah total semua subtotal.
5. Jika jumlah tidak disebutkan eksplisit, gunakan 1.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Gunakan timeout 2500ms agar transaksi kasir tidak pernah menggantung lama
    const aiCall = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Teks ucapan kasir: "${transcript}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout (2500ms)')), 2500)
    );

    const response = await Promise.race([aiCall, timeoutPromise]);
    const responseText = response?.text;

    if (!responseText) {
      const fallbackResult = parseTranscriptFallback(transcript, menuItems);
      return NextResponse.json(fallbackResult);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
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
    // Apabila Gemini offline, 404, rate limit, atau timeout:
    // Aktifkan langsung parser fallback lokal yang handal (Status 200 OK)
    console.warn('Gemini extraction unavailable or timed out. Mengaktifkan fallback lokal:', error);
    const fallbackResult = parseTranscriptFallback(transcript, menuItems);
    return NextResponse.json(fallbackResult);
  }
}
