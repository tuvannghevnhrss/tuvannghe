import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient }
  from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const runtime = "edge";

export async function POST(req: Request) {
  const { code } = await req.json();          // EX: "INFJ"
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Upsert: nếu user đã có record thì update, ngược lại tạo mới
  const { error } = await supabase
    .from("career_profiles")
    .upsert(
      {
        user_id: user.id,
        mbti_type: code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("MBTI upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code });
}
