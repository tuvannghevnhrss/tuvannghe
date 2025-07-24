import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { suggestJobs } from '@/lib/career/matchJobs';

export const runtime = 'edge';

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH' }, { status: 401 });

  /* 1. lấy (hoặc tạo) profile */
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile)
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 400 });

  /* 2. GPT + gợi ý nghề */
  const [analysis, jobs] = await Promise.all([
    analyseKnowdell(profile),
    suggestJobs(profile),
  ]);

  /* 3. update DB */
  const { error } = await supabase
    .from('profiles')
    .update({
      knowdell_analysis: analysis,
      suggested_jobs: jobs,
    })
    .eq('id', profile.id);

  if (error)
    return NextResponse.json({ error: 'DB_UPDATE' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
