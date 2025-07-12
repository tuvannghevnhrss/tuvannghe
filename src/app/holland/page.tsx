// src/app/holland/page.tsx
import Link from "next/link";
import formatVND from "@/lib/formatVND";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
const PRICE = 20_000;

export default async function HollandIntro() {
  /* 1. Đã thanh toán? ---------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("payments")
      .select("status")
      .eq("user_id", user.id)
      .eq("product", "holland")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.status === "paid") redirect("/holland/quiz");
  }

  /* 2. Trang giới thiệu -------------------------------------------------- */
  return (
    <section className="max-w-2xl mx-auto py-20 text-center">
      <h1 className="text-2xl sm:text-2xl font-bold mb-3">Bộ câu hỏi Holland</h1>

      <p className="text-gray-600 max-w-md mx-auto mb-12">
        Khám phá nhóm nghề nghiệp phù hợp nhất với bạn thông qua trắc nghiệm
        Holland RIASEC.
      </p>

      {/* 3 ô thống kê */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: "Câu hỏi", value: 54 },
          { label: "Lựa chọn/câu", value: 2 },
          { label: "Phí", value: "20K" },
        ].map((box) => (
          <div
            key={box.label}
            className="border rounded-2xl py-6 flex flex-col items-center shadow-sm"
          >
            <p className="text-3xl font-extrabold">{box.value}</p>
            <p className="text-gray-500 mt-1">{box.label}</p>
          </div>
        ))}
      </div>

      {/* Quy trình */}
      <div className="border border-dashed rounded-xl p-6 mb-12 inline-block text-left leading-8">
        <p>
          <b>Quy trình:</b>
        </p>
        <p>
          1.&nbsp;
          <b>Thanh toán</b>&nbsp;{formatVND(PRICE)} (bằng&nbsp;QR tại trang
          thanh&nbsp;toán)
        </p>
        <p>
          2.&nbsp;
          <b>Hoàn thành</b> 54&nbsp;câu hỏi – chọn đáp án đúng nhất với bạn
        </p>
        <p>
          3.&nbsp;
          <b>Kết quả</b> sẽ được gửi về email &amp; chatbot của bạn
        </p>
      </div>

      {/* Nút thanh toán */}
      <Link
        href="/payment?product=holland"
        className="block w-full sm:w-auto bg-brandYellow hover:bg-yellow-500 text-black font-medium px-6 py-3 rounded-full transition"
      >
        Thanh toán {formatVND(PRICE)}
      </Link>
    </section>
  );
}
