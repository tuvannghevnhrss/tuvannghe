import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { analyseKnowdell }           from '@/lib/career/analyseKnowdell';
import { suggestJobs }               from '@/lib/career/matchJobs';   // Hàm đã export sẵn trong matchJobs.ts

export const runtime = 'edge';       // giữ nguyên nếu bạn đang chạy Edge-Function

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  /* 1️⃣  lấy profile hiện tại */
  const { data: profile, error } =
    await supabase.from('profiles').select('*').single();

  if (error || !profile)
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 400 });

  /* 2️⃣  GPT phân tích Knowdell + gợi ý nghề */
  const knowdellAnalysis = await analyseKnowdell(profile);
  const jobsSuggestion   = await suggestJobs(profile);

  /* 3️⃣  lưu lại DB */
  const { error: upErr } = await supabase
    .from('profiles')
    .update({
      knowdell_analysis: knowdellAnalysis,
      suggested_jobs   : jobsSuggestion,
    })
    .eq('id', profile.id);

  if (upErr)
    return NextResponse.json({ error: 'DB_UPDATE_FAILED' }, { status: 500 });

  /* 4️⃣  OK */
  return NextResponse.json({ ok: true });
}
