// src/app/api/mbti/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// ép chạy dynamic trên Node.js
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  // khởi tạo Supabase client cho route handler
  const supabase = createRouteHandlerClient({ cookies, headers });

  // 1) Xác thực user
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Lấy payload từ body
  const { code } = (await req.json()) as { code: string };

  // 3) Lưu kết quả (upsert để tránh duplicate)
  const { error: dbErr } = await supabase
    .from("mbti_results")
    .upsert({ user_id: user.id, mbti_code: code });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // 4) Trả về thành công
  return NextResponse.json({ ok: true });
}
