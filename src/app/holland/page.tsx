// src/app/holland/page.tsx
import Link from "next/link";
import formatVND from "@/lib/formatVND";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

const PRICE = 20_000;

export const dynamic = "force-dynamic";

export default async function HollandIntro() {
  /* Nếu đã thanh toán → chuyển thẳng sang làm bài */
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

  return (
    <section className="max-w-xl mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold mb-3">Bộ câu hỏi Holland</h1>
      <p className="text-gray-600 mb-8">
        Khám phá nhóm nghề nghiệp phù hợp nhất với bạn thông qua
        trắc nghiệm Holland RIASEC.
      </p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-4xl font-bold">54</p>
          <p className="text-gray-500">Câu hỏi</p>
        </div>
        <div>
          <p className="text-4xl font-bold">2</p>
          <p className="text-gray-500">Lựa chọn/câu</p>
        </div>
        <div>
          <p className="text-4xl font-bold">
            {formatVND(PRICE).replace(",00 ₫", "")}
          </p>
          <p className="text-gray-500">Phí</p>
        </div>
      </div>

      <ol className="text-left inline-block mb-10 leading-8">
        <li><b>Thanh toán</b> {formatVND(PRICE)} (bằng QR ở trang thanh toán)</li>
        <li><b>Hoàn thành</b> 54 câu hỏi – chọn đáp án đúng nhất với bạn</li>
        <li><b>Kết quả</b> sẽ được gửi về email &amp; hiển thị trên chatbot</li>
      </ol>

      {/* nút tới trang thanh toán */}
      <Link
        href="/payment?product=holland"
        className="block bg-brandYellow hover:bg-yellow-500 text-black font-medium px-8 py-3 rounded"
      >
        Thanh toán {formatVND(PRICE)}
      </Link>
    </section>
  );
}
