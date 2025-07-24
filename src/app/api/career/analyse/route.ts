import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { matchJobs } from '@/lib/career/matchJobs';

export const runtime = 'nodejs';         // tránh Edge để dễ debug
// export const dynamic = 'force-dynamic'; // không cache (tùy chọn)

export async function POST(req: Request) {
  let payload: any;

  /* Đọc JSON an toàn ------------------------------------- */
  try {
    payload = await req.json();          // sẽ throw nếu body rỗng / không phải json
  } catch {
    return NextResponse.json(
      { error: 'BODY_EMPTY_OR_INVALID' },
      { status: 400 }
    );
  }

  /* Kết nối Supabase ------------------------------------- */
  const supabase = createSupabaseServerClient();

  /* Phân tích Knowdell + gợi ý nghề ----------------------- */
  try {
    const analysis = analyseKnowdell(payload);
    const suggestions = await matchJobs(supabase, payload);

    return NextResponse.json({ analysis, suggestions });
  } catch (err) {
    console.error('Analyse error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}

/* Nếu có GET thì chỉ trả lời rằng route yêu cầu POST  */
export async function GET() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
