// app/api/chat/route.ts
import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Lấy user (nếu đăng nhập) - KHÔNG quan trọng nhưng có thể log
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý hướng nghiệp.' },
        ...(session ? [{ role: 'system', content: `User ID: ${session.user.id}` }] : []),
        { role: 'user', content: message },
      ],
    })

    return NextResponse.json({
      reply: completion.choices[0].message?.content ?? 'Xin lỗi, tôi chưa hiểu.',
    })
  } catch (err) {
    console.error('API /chat error:', err)
    return NextResponse.json(
      { reply: 'Xin lỗi, hiện tôi không trả lời được, bạn thử lại sau nhé.' },
      { status: 500 },
    )
  }
}
