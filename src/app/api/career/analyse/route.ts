// src/app/api/career/analyse/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';      // 👈 thay dòng import cũ

import { analyseKnowdell } from '@/lib/career/analyseKnowdell';
import { matchJobs } from '@/lib/career/matchJobs';            // ⚠ dùng named-export

export async function POST(req: Request) {
  const supa = createAdminClient();                           // 👈 dùng admin-client
  const profile = await req.json();                           // dữ liệu profile gửi lên

  /* 1. Phân tích Knowdell / Holland / v.v. */
  const analysis = analyseKnowdell(profile);

  /* 2. Tính điểm gợi ý nghề */
  const jobs = await matchJobs(profile);

  /* 3. Lưu & trả về */
  await supa.from('career_options').insert({
    user_id: profile.userId,
    analysis,
    suggested_jobs: jobs,
  });

  return NextResponse.json({ analysis, jobs });
}
