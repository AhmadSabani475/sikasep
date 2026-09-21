import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    const demoEmail = process.env.DEMO_EMAIL || 'demo@sikasep.id';
    const demoPassword = process.env.DEMO_PASSWORD || 'demo123456';

    let { data, error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (error && !process.env.DEMO_EMAIL) {
      const fallback = await supabase.auth.signInWithPassword({
        email: 'demo@suaratoko.id',
        password: demoPassword,
      });
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.error('Demo login error:', error);
      return NextResponse.json(
        { error: 'Demo mode tidak tersedia saat ini. Silakan daftar akun gratis.', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data.user?.email });
  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
