import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface MenuItemInput {
  nama: string;
  harga: number;
}

interface ExtractRequest {
  transcript: string;
  menuItems: MenuItemInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { transcript, menuItems } = body;

    if (!transcript || !menuItems) {
      return NextResponse.json(
        { error: 'Missing transcript or menuItems' },
        { status: 400 }
      );
    }
    const menuListStr = JSON.stringify(
      menuItems.map((item) => ({ nama: item.nama, harga: item.harga }))
    );
    const systemPrompt = `Kamu adalah sistem ekstraksi data transaksi untuk kasir warung.
Diberikan teks ucapan pelanggan/pedagang dan daftar menu toko berikut:

Daftar menu:
${menuListStr}

Tugas kamu: ekstrak item, jumlah, dan harga dari teks ucapan berikut,
lalu kembalikan HANYA dalam format JSON tanpa teks tambahan:

{
  "items": [
    {"nama": "string (cocokkan ke daftar menu jika mirip)", "jumlah": number, "harga_satuan": number, "subtotal": number}
  ],
  "total": number,
  "item_tidak_dikenal": ["string, jika ada ucapan yang tidak cocok dengan menu manapun"]
}

Aturan penting:
1. Harga HARUS diambil dari daftar menu, JANGAN mengarang harga.
2. Cocokkan nama menu meskipun ada typo, singkatan, atau variasi ucapan (misal: "ngor" = "Nasi Goreng", "esteh" = "Es Teh Manis").
3. Jika jumlah tidak disebutkan, anggap 1.
4. Jika ada item yang tidak cocok dengan menu manapun, masukkan ke "item_tidak_dikenal".
5. subtotal = jumlah × harga_satuan.
6. total = sum semua subtotal.
7. Kenali dan terjemahkan jumlah dari berbagai bahasa daerah/slang (misal: Jawa "siji"=1, "loro"=2, Sunda "hiji"=1, atau "seporsi", "segelas"=1).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Teks ucapan: "${transcript}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;

    if (!responseText) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON from AI', raw: responseText },
        { status: 500 }
      );
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: 'Invalid response structure', raw: parsed },
        { status: 500 }
      );
    }
    parsed.items = parsed.items.map((item: { nama: string; jumlah: number; harga_satuan: number; subtotal: number }) => ({
      nama: String(item.nama || ''),
      jumlah: Math.max(1, Number(item.jumlah) || 1),
      harga_satuan: Math.max(0, Number(item.harga_satuan) || 0),
      subtotal: Math.max(0, Number(item.subtotal) || 0),
    }));
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
