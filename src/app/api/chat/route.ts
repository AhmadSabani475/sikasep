import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const systemPrompt = `Kamu adalah asisten AI cerdas bernama "Sikasep AI" untuk aplikasi kasir Sikasep (Sistem Kasir Suara Enterpreneur Purwakarta). Kamu membantu pemilik UMKM & entrepreneur Purwakarta (warung, kedai kopi, kios) dengan menjawab pertanyaan tentang bisnis mereka.

Konteks data toko saat ini:
${JSON.stringify(context || {}, null, 2)}

Aturan:
1. Jawab dalam bahasa Indonesia yang natural dan mudah dipahami
2. Jika pertanyaan tentang data (omzet, penjualan, menu), JAWAB berdasarkan konteks data yang diberikan
3. Jika ditanya sesuatu di luar konteks data, berikan jawaban umum yang bermanfaat untuk UMKM
4. Jawaban singkat dan to-the-point (1-3 paragraf), jangan bertele-tele
5. Gunakan angka/data spesifik saat menjawab tentang penjualan
6. Jangan mengarang data — jika data tidak tersedia, katakan dengan jelas
7. Format mata uang dalam Rupiah (Rp)
8. Bersikap ramah, supportif, dan memotivasi pemilik usaha`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
