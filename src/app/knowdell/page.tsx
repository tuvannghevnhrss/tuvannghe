/*  src/app/knowdell/page.tsx  */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import PaymentContent from "@/app/payment/PaymentContent";
import { SERVICE, STATUS } from "@/lib/constants";          // 👈 thêm STATUS

/* 👉  Nếu đã có StatBox thì giữ, chưa có thì comment 3 dòng dưới */
import StatBox from "@/components/StatBox";

export default async function KnowdellIntro() {
  /* 1 ▸ lấy session */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/signup");

  /* 2 ▸ đã thanh toán Knowdell? */
  const { data: paid } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("product", SERVICE.KNOWDELL)
    .eq("status", STATUS.PAID)             // dùng hằng status chữ thường
    .maybeSingle();

  /* 3 ▸ nếu đã thanh toán, kiểm tra làm quiz chưa */
  if (paid) {
    const { data: done } = await supabase
      .from("knowdell_results")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!done) redirect("/knowdell/quiz");
    redirect("/profile");
  }

  /* 4 ▸ trang giới thiệu + hộp thanh toán */
  return (
    <section className="max-w-xl mx-auto space-y-6 p-6">
      <h1 className="text-3xl font-bold">Bộ thẻ Giá trị Bản thân Knowdell</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatBox label="54 thẻ" value="54" />
        <StatBox label="Chọn"  value="10"  />
        <StatBox label="Phí"   value="100K" />
      </div>

      <ol className="list-decimal ml-6 text-sm space-y-1">
        <li>Thanh toán 100.000 đ (QR bên dưới)</li>
        <li>Kéo–thả <b>10 thẻ giá trị</b> quan trọng nhất</li>
        <li>Nhận báo cáo PDF &amp; lưu vào hồ sơ</li>
      </ol>

      {/* hộp giá + QR */}
      <PaymentContent product={SERVICE.KNOWDELL} />
    </section>
  );
}
