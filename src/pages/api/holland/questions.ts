// pages/api/holland/questions.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ hỗ trợ GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = supabaseClient();
  const { data, error } = await supabase
    .from('holland_questions')
    .select('id, question, category')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
