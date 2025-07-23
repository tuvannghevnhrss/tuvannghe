/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
 * ------------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime = "edge";           // ❗ chỉ Khai báo 1 lần, tránh lỗi build
export const dynamic = "force-dynamic";  // (có thể giữ, không ảnh hưởng)

export async function POST(req: Request) {
  try {
    /* ----------- Lấy body ----------- */
    const { holland, knowdell, topN = 5, salary = "high" } = await req.json();

    /** ❶ Validate tối thiểu – chỉ cần Holland & danh sách HỨNG THÚ  */
    const interests =
      knowdell?.interests ??
      knowdell?.careers ??           // phòng trường hợp mảng tên careers
      [];

    if (!holland || interests.length === 0)
      /* thông điệp ngắn gọn để client hiển thị */
      return NextResponse.json(
        { error: "Thiếu Holland hoặc sở thích nghề nghiệp." },
        { status: 400 },
      );

    /* ----------- Gọi hàm phân tích ----------- */
    const suggestions = await analyseCareer({
      holland,            // chuỗi 3-ký-tự (ECR, ISR…)
      knowdell: {         // chỉ truyền 3 nhóm cần thiết
        values:     knowdell.values     ?? [],
        skills:     knowdell.skills     ?? [],
        interests,                         // vừa lấy ở trên
      },
      topN,
      salary,
    });

    /* ----------- Lưu & trả kết quả ----------- */
    const supabase = createRouteHandlerClient<Database>({ cookies: [] });
    await supabase
      .from("career_profiles")
      .update({ suggested_jobs: suggestions })
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

    return NextResponse.json({ jobs: suggestions });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Analyse failed" },
      { status: 500 },
    );
  }
}
