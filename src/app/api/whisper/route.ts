import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // ① lấy file gửi lên
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  // ② Chuẩn bị gọi OpenAI
  const body = new FormData();
  body.append('file', file, file.name);
  body.append('model', 'whisper-1');

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: text }, { status: resp.status });
  }

  const json = await resp.json();
  return NextResponse.json(json);      // { text: '…' }
}
