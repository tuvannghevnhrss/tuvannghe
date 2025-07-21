import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { STATUS } from "@/lib/constants";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  /* 1. Đã thanh toán hay chưa? */
  const { data: pay } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .eq("product", "mbti")
    .eq("status", STATUS.PAID)
    .maybeSingle();

  const paid = Boolean(pay);

  /* 2. Đã có kết quả MBTI chưa? (lưu ở career_profiles hoặc mbti_results) */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const code =
    typeof profile?.mbti === "string"
      ? profile.mbti                                // cột text
      : profile?.mbti?.type ?? null;                // kiểu JSON {type:"ENFP"}

  return NextResponse.json({
    paid,
    finished: Boolean(code),
    code,
  });
}
