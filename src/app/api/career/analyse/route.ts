/* ------------------------------------------------------------------------- */
/*  /api/career/analyse  –  Tính GPT + gợi ý nghề + lưu vào career_profiles  */
/* ------------------------------------------------------------------------- */
import { NextResponse } from 'next/server';
import { cookies }            from 'next/headers';
import { analyseKnowdell }    from '@/lib/career/analyseKnowdell';
import { suggestJobs }        from '@/lib/career/matchJobs';
import { createSupabaseRouteServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';        // chạy trên Edge/Node tuỳ Vercel
export const runtime  = 'nodejs';               // để dùng service role secret

export async function POST() {
  /* 1. Supabase – lấy user + các bảng liên quan --------------------------- */
  const supabase = createSupabaseRouteServerClient(cookies);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'AUTH' }, { status: 401 });
  }
  const uid = session.user.id;

  /* 2. Tìm (hoặc tạo) career_profile của user ----------------------------- */
  let { data: profile } = await supabase
    .from('career_profiles')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (!profile) {
    // ---- Lấy dữ liệu thô (MBTI, Holland, Knowdell) để tạo dòng mới ---- //
    // Nếu một trong các bảng rỗng => trả 400 (yêu cầu làm test trước).
    const [{ data: mbti }, { data: holland }, { data: knowdell }] =
      await Promise.all([
        supabase.from('mbti_results').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('holland_results').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('knowdell_values').select('*').eq('user_id', uid),
      ]);

    if (!mbti || !holland || !knowdell?.length) {
      return NextResponse.json(
        { error: 'INCOMPLETE_TRAITS' },
        { status: 400 },
      );
    }

    const { error: insertErr, data: inserted } = await supabase
      .from('career_profiles')
      .insert({
        user_id: uid,
        mbti_code: mbti.type,
        holland_profile: holland.profile,
        knowdell_profile: { values: knowdell },   // lưu jsonb
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error(insertErr);
      return NextResponse.json({ error: 'DB_INSERT' }, { status: 500 });
    }
    profile = inserted;
  }

  /* 3. Phân tích Knowdell + gợi ý nghề ----------------------------------- */
  const analysisMD = await analyseKnowdell(profile);
  const jobs       = await suggestJobs(profile);

  /* 4. Lưu kết quả + trả OK ---------------------------------------------- */
  const { error: upErr } = await supabase
    .from('career_profiles')
    .update({
      knowdell_summary: analysisMD,
      suggested_jobs  : jobs,           // jsonb[ {id,score,reason} ]
      updated_at      : new Date().toISOString(),
    })
    .eq('user_id', uid);

  if (upErr) {
    console.error(upErr);
    return NextResponse.json({ error: 'DB_UPDATE' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
