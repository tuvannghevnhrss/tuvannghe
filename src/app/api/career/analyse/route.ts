import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseRouteServerClient,
  createSupabaseServerClient,
} from '@/lib/supabaseServer';
import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { matchJobs }      from '@/lib/career/matchJobs';

export const dynamic = 'force-dynamic';           // tránh bị SSG

/* -------------------------------------------------------------------------- */
/*  POST  –  chạy GPT + tính 5 nghề, lưu DB & trả kết quả                      */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const sbRoute = createSupabaseRouteServerClient();

  /* 1. Lấy user hiện tại --------------------------------------------------- */
  const {
    data: { user },
    error: authErr,
  } = await sbRoute.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'AUTH' }, { status: 401 });
  }

  /* 2. Lấy profile (MBTI, Holland, Knowdell) ------------------------------- */
  const { data: profile } = await sbRoute
    .from('profiles')
    .select('id, mbti, holland, values, skills, interests')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 400 });
  }

  /* 3. Gọi GPT + tính nghề ------------------------------------------------- */
  const markdown = await analyseKnowdell(profile);
  const jobs     = await matchJobs(profile);

  /* 4. Lưu kết quả (service-role để upsert) -------------------------------- */
  const sbSrv = createSupabaseServerClient();
  await sbSrv.from('career_analysis').upsert({
    user_id : user.id,
    markdown,
    jobs,                // lưu dạng JSON
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ markdown, jobs });
}

/* -------------------------------------------------------------------------- */
/*  GET  –  trả lại markdown đã lưu (dùng cho <AnalysisCard>)                 */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  const sbRoute = createSupabaseRouteServerClient();
  const { data: { user } } = await sbRoute.auth.getUser();
  if (!user) return NextResponse.json({ markdown: '' });

  const { data } = await sbRoute
    .from('career_analysis')
    .select('markdown')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ markdown: data?.markdown ?? '' });
}
