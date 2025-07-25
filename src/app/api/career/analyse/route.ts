/* ------------------------------------------------------------------------- *
   /api/career/analyse
   POST → GPT phân tích + gợi ý nghề, lưu vào career_profiles
   GET  → Client (SWR) lấy markdown + 5 nghề đã lưu
 * ------------------------------------------------------------------------- */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { suggestJobs   }   from '@/lib/career/matchJobs';
import { createSupabaseRouteServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';   // luôn chạy server-side
export const runtime  = 'nodejs';         // để dùng service-role key

/* ------------------------------------------------------------------ */
/* 1. POST – chạy GPT, tính điểm, lưu DB                              */
/* ------------------------------------------------------------------ */
export async function POST() {
  /* 1.1 Supabase auth */
  const supabase = createSupabaseRouteServerClient(cookies);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'AUTH' }, { status: 401 });
  }
  const uid = session.user.id;

  /* 1.2 Tìm (hoặc tạo) career_profile */
  let { data: profile } = await supabase
    .from('career_profiles')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (!profile) {
    // Lấy dữ liệu gốc
    const [{ data: mbti }, { data: holland }, { data: knowdell }] =
      await Promise.all([
        supabase
          .from('mbti_results')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('holland_results')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase.from('knowdell_values').select('*').eq('user_id', uid),
      ]);

    if (!mbti || !holland || !knowdell?.length) {
      return NextResponse.json(
        { error: 'INCOMPLETE_TRAITS' },
        { status: 400 },
      );
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('career_profiles')
      .insert({
        user_id         : uid,
        mbti_code       : mbti.type,
        holland_profile : holland.profile,
        knowdell_profile: { values: knowdell }, // jsonb
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error(insertErr);
      return NextResponse.json({ error: 'DB_INSERT' }, { status: 500 });
    }
    profile = inserted;
  }

  /* 1.3 GPT & gợi ý nghề */
  const analysisMD = await analyseKnowdell(profile);
  const jobs       = await suggestJobs(profile);

  /* 1.4 Lưu */
  const { error: upErr } = await supabase
    .from('career_profiles')
    .update({
      knowdell_summary: analysisMD,
      suggested_jobs  : jobs,              // jsonb
      updated_at      : new Date().toISOString(),
    })
    .eq('user_id', uid);

  if (upErr) {
    console.error(upErr);
    return NextResponse.json({ error: 'DB_UPDATE' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* 2. GET – front-end SWR lấy markdown + 5 nghề đã lưu                */
/* ------------------------------------------------------------------ */
export async function GET() {
  const supabase = createSupabaseRouteServerClient(cookies);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'AUTH' }, { status: 401 });
  }
  const uid = session.user.id;

  const { data: profile, error } = await supabase
    .from('career_profiles')
    .select('knowdell_summary, suggested_jobs')
    .eq('user_id', uid)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB_READ' }, { status: 500 });
  }

  if (!profile?.knowdell_summary) {
    return NextResponse.json(
      { error: 'PROFILE_NOT_READY' },
      { status: 404 },
    );
  }

  return NextResponse.json(profile); // { knowdell_summary, suggested_jobs }
}
