import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const { type_code } = await req.json();         // { type_code:"ESFJ" }
  const supabase     = createRouteHandlerClient({ cookies });

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  /* 1. Lưu bảng mbti_results */
  await supabase.from("mbti_results").insert({ user_id: uid, type_code });

  /* 2. Ghi vào career_profiles.mbti */
  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: uid, mbti: { type: type_code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
