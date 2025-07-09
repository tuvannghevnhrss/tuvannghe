// POST audio blob từ client, forward cho OpenAI
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();          // file từ client
  const file     = formData.get('file') as File;   // <-- audio blob

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp   = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });

  return NextResponse.json(resp);
}
