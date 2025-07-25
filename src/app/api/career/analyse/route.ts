// src/app/api/career/analyse/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseRouteServerClient } from '@/lib/supabaseServer';
import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { suggestJobs     } from '@/lib/career/matchJobs';

export async function POST() {
  const supabase = createSupabaseRouteServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user)
    return NextResponse.json({ error: 'AUTH' }, { status: 401 });

  /* ------------------------------------------------------------------ */
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile)
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 400 });

  /* 1. Phân tích Knowdell (GPT) -------------------------------------- */
  const markdown = await analyseKnowdell(profile);

  /* 2. Gợi ý 5 nghề --------------------------------------------------- */
  const jobs = await suggestJobs(profile);

  /* 3. Lưu lại vào bảng profiles ------------------------------------- */
  await supabase
    .from('profiles')
    .update({
      analysis_md   : markdown,
      suggested_jobs: jobs,
    })
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
