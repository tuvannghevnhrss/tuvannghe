/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
   ------------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime  = "edge";          // khai báo 1 lần duy nhất
export const dynamic  = "force-dynamic";

/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    /* 1 ▸ khởi tạo Supabase (Edge không có cookies → truyền mảng rỗng) */
    const supabase = createRouteHandlerClient<Database>({ cookies: [] });

    /* 2 ▸ kiểm tra đăng nhập */
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 3 ▸ truy xuất hồ sơ gốc: chỉ cần holland_profile + knowdell_summary */
    const { data: rawProfile, error } = await supabase
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!rawProfile) {
      return NextResponse.json({ error: "Chưa có dữ liệu hồ sơ." }, { status: 404 });
    }

    /* 4 ▸ đảm bảo có danh sách SỞ THÍCH (knowdell_interests) ------------- */
    let interests = rawProfile.knowdell_summary?.interests ?? [];

    if (interests.length === 0) {
      /* lấy TOP sở thích đã lưu ở bảng knowdell_interests (nếu có) */
      const { data: intRows } = await supabase
        .from("knowdell_interests")
        .select("interest_key")
        .eq("user_id", user.id)
        .order("rank", { ascending: true });

      interests = (intRows ?? []).map((r) => ({ interest_key: r.interest_key }));
    }

    /* 5 ▸ ráp profile tối thiểu để phân tích ----------------------------- */
    const profile = {
      holland_profile   : rawProfile.holland_profile,
      knowdell_summary  : {
        ...(rawProfile.knowdell_summary ?? {}),
        interests,                           // đã đảm bảo ≠ []
      },
    };

    /* 6 ▸ gọi GPT phân tích (chỉ dựa trên Holland + Knowdell) ------------ */
    const suggestions = await analyseCareer(profile);

    /* 7 ▸ lưu lại gợi ý & phản hồi cho client ---------------------------- */
    await supabase
      .from("career_profiles")
      .update({ suggested_jobs: suggestions })
      .eq("user_id", user.id);

    return NextResponse.json({ jobs: suggestions });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Analyse failed" },
      { status: 500 },
    );
  }
}
