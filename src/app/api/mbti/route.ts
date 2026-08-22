import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const { code } = await req.json();          // EX: "INFJ"
  const supabase = await createSupabaseRouteServerClient();
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
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ code });
}
