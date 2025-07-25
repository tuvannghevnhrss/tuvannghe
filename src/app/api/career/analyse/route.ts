// route.ts (API POST /api/career/analyse)
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { analyseKnowdell }            from '@/lib/career/analyseKnowdell';
import { suggestJobs }                from '@/lib/career/matchJobs';

export const runtime = 'edge';          // nếu bạn muốn chạy Edge
export const POST = async (req: Request) => {
  /* 1. Auth & DB --------------------------------------------------------- */
  const supabase = createRouteHandlerClient({ cookies });   // <—  helper mới
  const {
    data: { session },
    error: authErr,
  } = await supabase.auth.getSession();

  if (authErr || !session)
    return Response.json({ error: 'AUTH' }, { status: 401 });

  const { user } = session;

  /* 2. Lấy profile ------------------------------------------------------- */
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      id,
      mbti,
      holland,
      values,
      skills,
      interests
    `
    )
    .eq('id', user.id)
    .single();

  if (!profile)
    return Response.json({ error: 'PROFILE_NOT_FOUND' }, { status: 400 });

  /* 3. Chạy GPT & gợi ý nghề -------------------------------------------- */
  const [md, jobs] = await Promise.all([
    analyseKnowdell(profile),
    suggestJobs(profile),
  ]);

  /* 4. Lưu kết quả & trả OK --------------------------------------------- */
  await supabase
    .from('profiles')
    .update({
      analysis_markdown: md,
      suggested_jobs:   jobs,
    })
    .eq('id', user.id);

  return Response.json({ ok: true });
};
