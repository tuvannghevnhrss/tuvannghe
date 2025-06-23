// src/pages/api/holland/save.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseClient } from '@/lib/supabaseClient';

type Body = {
  user_id: string;
  responses: { question_id: number; score: number }[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { user_id, responses } = req.body as Body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Missing responses' });
  }

  const supabase = supabaseClient();

  // 1) Chèn holland_responses
  const entries = responses.map(r => ({
    user_id,
    question_id: r.question_id,
    score: r.score
  }));
  const { error: insertErr } = await supabase
    .from('holland_responses')
    .insert(entries);
  if (insertErr) {
    return res.status(500).json({ error: insertErr.message });
  }

  // 2) Tính tổng score
  const { data: summary, error: sumErr } = await supabase
    .from('holland_responses')
    .select('question_id, score')
    .eq('user_id', user_id);
  if (sumErr) {
    return res.status(500).json({ error: sumErr.message });
  }

  // 3) Lấy mapping question→category
  const { data: qs, error: qErr } = await supabase
    .from('holland_questions')
    .select('id, category');
  if (qErr) {
    return res.status(500).json({ error: qErr.message });
  }

  // 4) Tính profile Holland
  const profile: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  summary.forEach(r => {
    const cat = qs.find(q => q.id === r.question_id)?.category;
    if (cat) profile[cat] += r.score;
  });

  // 5) Lưu vào career_profiles
  const { error: upsertErr } = await supabase
    .from('career_profiles')
    .upsert(
      { user_id, holland_profile: profile },
      { onConflict: ['user_id'] }
    );
  if (upsertErr) {
    return res.status(500).json({ error: upsertErr.message });
  }

  return res.status(200).json({ profile });
}
