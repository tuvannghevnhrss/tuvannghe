import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET')
    return res.status(405).setHeader('Allow', ['GET']).end('Method Not Allowed');

  const { data, error } = await supabaseClient
    .from('holland_questions')
    .select('id, question, category')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
