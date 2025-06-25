export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props { searchParams: { code?: string } }

export default async function HollandResultPage({ searchParams }: Props) {
  const code = searchParams.code;
  if (!code) redirect("/mbti");

  /* Supabase server-side */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: result } = await supabase
    .from("mbti_results")
    .select("mbti_code, created_at")
    .eq("user_id", user.id)
    .single();
  if (!result) redirect("/mbti");

  /* mô tả MBTI */
  const descriptions: Record<string, string> = {
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
  const desc = descriptions[result.mbti_code] ?? "Đang cập nhật mô tả.";

  /* ---------- JSX ---------- */
  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
      <h1 className="text-3xl font-bold">
        Kết quả MBTI: {result.mbti_code}
      </h1>

      <p className="italic text-gray-600">
        Thực hiện lúc{" "}
        {new Date(result.created_at).toLocaleString("vi-VN")}
      </p>

      <div className="text-left bg-white shadow p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Mô tả tính cách</h2>
        <p>{desc}</p>
      </div>

      {/* nút quay lại là client component nên không lỗi event-handler */}
      <BackButton />

      {/* nếu muốn link làm lại bài */}
      <Link
        href="/mbti"
        className="ml-4 text-blue-600 underline hover:text-blue-800"
      >
        Làm lại bài MBTI
      </Link>
    </div>
  );
}
