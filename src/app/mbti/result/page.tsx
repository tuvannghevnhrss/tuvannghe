export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props {
  searchParams: { code?: string };
}

/* ── MÔ TẢ TÍNH CÁCH ─────────────────────────────────── */
const DESCS: Record<string, string> = {
  ISTJ: "Thực tế, cẩn trọng, tôn trọng truyền thống và có tổ chức.",
  ISFJ: "Ân cần, trách nhiệm, trung thành, hướng về phục vụ người khác.",
  INFJ: "Trực giác mạnh mẽ, lý tưởng cao, hướng về mục đích sâu sắc.",
  INTJ: "Sáng tạo, phân tích, lập kế hoạch dài hạn, độc lập.",
  ISTP: "Thực tế, khéo tay, thích giải quyết vấn đề trước mắt.",
  ISFP: "Hòa nhã, linh hoạt, trân trọng vẻ đẹp và giá trị cá nhân.",
  INFP: "Đa cảm, lý tưởng, tìm kiếm ý nghĩa cá nhân sâu sắc.",
  INTP: "Phân tích, tò mò, đam mê nghiên cứu lý thuyết.",
  ESTP: "Thực tế, ưa mạo hiểm, thích hành động ngay lập tức.",
  ESFP: "Sôi nổi, thích tương tác, trân trọng niềm vui hiện tại.",
  ENFP: "Sáng tạo, nhiệt huyết, khám phá khả năng và ý tưởng mới.",
  ENTP: "Nhạy bén, thích tranh luận, tìm kiếm giải pháp sáng tạo.",
  ESTJ: "Thực tế, quyết đoán, giỏi tổ chức và điều hành.",
  ESFJ: "Hòa nhập, chu đáo, quan tâm đến người khác.",
  ENFJ: "Dẫn dắt, truyền cảm hứng, quan tâm đến sự phát triển của người khác.",
  ENTJ: "Quyết đoán, chiến lược, giỏi lãnh đạo và quản lý.",
};

export default async function MBTIResultPage({ searchParams }: Props) {
  const code = (searchParams.code ?? "").toUpperCase();

  /* Validate mã MBTI: 4 kí tự E/I S/N T/F J/P */
  if (!/^[EI][SN][FT][JP]$/.test(code)) redirect("/mbti");

  /* Supabase server-side */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  /* 1. Lưu bảng mbti_results */
  await supabase.from("mbti_results").insert({
    user_id: user.id,
    type_code: code,
  });

  /* 2. Cập nhật career_profiles.mbti */
  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: user.id, mbti: { type: code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  /* 3. Hiển thị */
  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
      <h1 className="text-3xl font-bold">Kết quả MBTI: {code}</h1>

      <div className="text-left bg-white shadow p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Mô tả tính cách</h2>
        <p>{DESCS[code] ?? "Đang cập nhật mô tả."}</p>
      </div>
    </div>
  );
}
