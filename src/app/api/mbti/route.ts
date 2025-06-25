import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';   // luôn chạy trên Edge/Node
export const runtime = 'nodejs';          // tránh Next biến thành Edge Function

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauth' }, { status: 401 });

  const body = await req.json();               // { code: 'INFP' }
  const { code } = body as { code: string };

  const { error: dbError } = await supabase
    .from('mbti_results')
    .upsert({ user_id: user.id, mbti_code: code });

  if (dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
