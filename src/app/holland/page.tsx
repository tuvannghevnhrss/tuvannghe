// src/app/holland/page.tsx
import Link from "next/link";
import formatVND from "@/lib/formatVND";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

const PRICE = 20_000;
export const dynamic = "force-dynamic";

export default async function HollandIntro() {
  /* 1. Nếu user đã thanh toán → chuyển thẳng Quiz */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

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

  /* 2. Render Intro */
  return (
    <section className="max-w-2xl mx-auto py-20 text-center">
      {/* headline */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        Bộ câu hỏi Holland
      </h1>
      <p className="text-gray-600 max-w-md mx-auto mb-12">
        Khám phá nhóm nghề nghiệp phù hợp nhất với bạn thông qua trắc nghiệm
        Holland&nbsp;RIASEC.
      </p>

      {/* stats box */}
      <div className="grid grid-cols-3 gap-5 mb-12">
        {[
          { label: "Câu hỏi", value: 54 },
          { label: "Lựa chọn/câu", value: 2 },
          { label: "Phí", value: formatVND(PRICE).replace(",00 ₫", "") },
        ].map((b) => (
          <div
            key={b.label}
            className="border rounded-2xl py-8 flex flex-col items-center shadow-sm"
          >
            <p className="text-4xl font-extrabold">{b.value}</p>
            <p className="text-gray-500 mt-1">{b.label}</p>
          </div>
        ))}
      </div>

      {/* dashed process box */}
      <div className="border border-dashed rounded-xl p-8 mb-12 inline-block text-left leading-8">
        <p>
          1. <b>Thanh toán</b> {formatVND(PRICE)} phí (bằng QR tại trang thanh
          toán)
        </p>
        <p>
          2. <b>Hoàn thành</b> 54&nbsp;câu hỏi – chọn đáp án đúng nhất với bạn
        </p>
        <p>
          3. <b>Kết&nbsp;quả</b> sẽ được gửi về email &amp; chatbot của bạn
        </p>
      </div>

      {/* button */}
      <Link
        href="/payment?product=holland"
        className="
          block w-full sm:w-auto bg-brandYellow hover:bg-yellow-500
          text-black font-medium px-10 py-4 rounded-full transition
        "
      >
        Thanh toán {formatVND(PRICE)}
      </Link>
    </section>
  );
}
