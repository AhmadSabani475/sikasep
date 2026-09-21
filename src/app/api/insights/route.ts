import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analytics } = body;

    if (!analytics) {
      return NextResponse.json({ error: 'Missing analytics data' }, { status: 400 });
    }

    const systemPrompt = `Kamu adalah konsultan bisnis AI untuk UMKM Indonesia. Kamu membantu pemilik warung/kedai memahami data penjualan mereka dan memberikan saran actionable.

Kamu akan diberikan data analytics toko berupa:
- Menu terlaris (nama, jumlah terjual, revenue)
- Distribusi jam transaksi (jam sibuk)
- Perbandingan penjualan minggu ini vs minggu lalu
- Total transaksi dan revenue 30 hari

Berikan analisis dalam format JSON berikut (HANYA JSON, tanpa teks tambahan):
{
  "ringkasan": "Rangkuman singkat kondisi bisnis dalam 1-2 kalimat",
  "insights": [
    {
      "judul": "Judul insight singkat",
      "deskripsi": "Penjelasan detail dengan angka/data spesifik",
      "tipe": "positive" | "warning" | "suggestion" | "info",
      "ikon": "trending_up" | "trending_down" | "star" | "clock" | "lightbulb" | "package" | "combo" | "target"
    }
  ],
  "saran_aksi": [
    {
      "aksi": "Saran aksi spesifik dan actionable",
      "prioritas": "tinggi" | "sedang" | "rendah",
      "estimasi_dampak": "Estimasi dampak positif jika dijalankan"
    }
  ]
}

Aturan:
1. Gunakan bahasa Indonesia yang mudah dipahami (bayangkan pemilik warung sederhana)
2. Berikan 3-5 insights yang berbeda-beda
3. Setiap insight HARUS berdasarkan data yang diberikan, bukan asumsi
4. Saran harus spesifik dan langsung bisa dilakukan (bukan generik seperti "tingkatkan penjualan")
5. Jika data terlalu sedikit, tetap berikan insight seadanya dan sarankan untuk mengumpulkan lebih banyak data
6. Sorot pola-pola menarik: menu terlaris, jam sibuk, tren naik/turun, combo potential`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Data analytics toko:\n${JSON.stringify(analytics, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
