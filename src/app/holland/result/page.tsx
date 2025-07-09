export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props {
  searchParams: { code?: string };
}

/* ── MÔ TẢ 3 CHỮ HOLLAND ─────────────────────────────── */
const TRAITS: Record<string, string> = {
  R: "Realistic – Ưa hành động, thao tác với vật thể.",
  I: "Investigative – Phân tích, khám phá, thích nghiên cứu.",
  A: "Artistic – Sáng tạo, trực giác, biểu đạt ý tưởng.",
  S: "Social – Hỗ trợ, hợp tác, giúp đỡ người khác.",
  E: "Enterprising – Thuyết phục, lãnh đạo, kinh doanh.",
  C: "Conventional – Tỉ mỉ, dữ liệu, quy trình, tổ chức.",
};

function explain(code: string) {
  return code
    .split("")
    .map((c) => TRAITS[c] ?? c)
    .join(" | ");
}

export default async function HollandResultPage({ searchParams }: Props) {
  const code = (searchParams.code ?? "").toUpperCase();

  /* Validate mã Holland: 3 chữ từ [RIASEC] */
  if (!/^[RIASEC]{3}$/.test(code)) redirect("/holland");

  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  /* 1. Lưu bảng holland_results */
  await supabase.from("holland_results").insert({
    user_id: user.id,
    code,
  });

  /* 2. Cập nhật career_profiles.holland */
  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: user.id, holland: { code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  /* 3. Hiển thị */
  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
      <h1 className="text-3xl font-bold">Kết quả Holland: {code}</h1>

      <div className="text-left bg-white shadow p-6 rounded-lg">
        <p>{explain(code)}</p>
      </div>
    </div>
  );
}
