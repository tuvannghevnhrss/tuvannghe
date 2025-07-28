/* ------------------------------------------------------------------------- *
   /api/career/analyse – Phân tích Knowdell + gợi ý nghề + lưu Supabase
 * ------------------------------------------------------------------------- */
import { cookies           } from 'next/headers';
import { NextResponse      } from 'next/server';
import { analyseKnowdell   } from '@/lib/career/analyseKnowdell';
import { suggestJobs       } from '@/lib/career/matchJobs';
import { createSupabaseRouteServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';   // chạy Edge/Node tuỳ Vercel
export const runtime  = 'nodejs';         // để dùng Service-Role key

export async function POST () {
  /* 1. Lấy session & user -------------------------------------------------- */
  const supabase = createSupabaseRouteServerClient(cookies);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error:'AUTH'},{status:401});
  const uid = session.user.id;

  /* 2. Lấy (hoặc tạo) career_profile -------------------------------------- */
  let { data: profile } = await supabase
    .from('career_profiles')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (!profile) {
    /* ----- Lấy dữ liệu gốc MBTI / Holland / Knowdell --------------------- */
    const [{ data: mbti }, { data: holland }, { data: knowdell }] =
      await Promise.all([
        supabase.from('mbti_results'   ).select('*')
          .eq('user_id',uid).order('created_at',{ascending:false}).limit(1).single(),
        supabase.from('holland_results').select('*')
          .eq('user_id',uid).order('created_at',{ascending:false}).limit(1).single(),
        supabase.from('knowdell_interests').select('*').eq('user_id',uid),
      ]);
    if (!mbti || !holland || !knowdell?.length)
      return NextResponse.json({ error:'INCOMPLETE_TRAITS'},{status:400});

    /* ----- Chèn dòng mới -------------------------------------------------- */
    const { data: inserted, error: insErr } = await supabase
      .from('career_profiles')
      .insert({
        user_id          : uid,
        mbti_type        : mbti.type,
        holland_profile  : holland.profile,          // JSONB
        knowdell : { interests: knowdell }, // JSONB
      })
      .select('*')
      .single();
    if (insErr) {
      console.error(insErr);
      return NextResponse.json({ error:'DB_INSERT'},{status:500});
    }
    profile = inserted;
  }

  /* 3. Đã có phân tích? -> trả cached để khỏi tốn token ------------------- */
  if (profile.knowdell_summary && profile.suggested_jobs?.length)
    return NextResponse.json({ ok:true, cached:true });

  /* 4. Gọi GPT + Match jobs ---------------------------------------------- */
  const summaryMD = await analyseKnowdell(profile);
  const jobs      = await suggestJobs    (profile);

  /* 5. Cập nhật dòng profile --------------------------------------------- */
  const { error: upErr } = await supabase
    .from('career_profiles')
    .update({
      knowdell_summary : summaryMD,
      suggested_jobs   : jobs,         // jsonb[]
      updated_at       : new Date().toISOString(),
    })
    .eq('user_id', uid);
  if (upErr) {
    console.error(upErr);
    return NextResponse.json({ error:'DB_UPDATE'},{status:500});
  }
  return NextResponse.json({ ok:true });
}
