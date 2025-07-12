"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import formatVND from "@/lib/formatVND";

type Props = {
  hasPaid: boolean;
  hasResult: boolean;
};

const PRICE = 20_000;

export default function HollandIntro({ hasPaid, hasResult }: Props) {
  const router = useRouter();

  const onStart = () => {
    if (hasResult) {
      router.push("/holland/result");          // đã có kết quả
    } else if (hasPaid) {
      router.push("/holland/quiz");            // đã trả tiền nhưng chưa làm
    } else {
      router.push("/payment?product=holland"); // chưa trả tiền
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-3">Bộ câu hỏi Holland</h1>
      <p className="text-gray-600 mb-10">
        Khám phá nhóm nghề nghiệp phù hợp nhất với bạn thông qua trắc nghiệm Holland RIASEC.
      </p>

      {/* 3 ô thống kê */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox label="Câu hỏi" value="54" />
        <StatBox label="Lựa chọn/câu" value="2" />
        <StatBox label="Phí" value="20K" />
      </div>

      {/* Quy trình */}
      <div className="border border-dashed rounded-2xl p-6 mb-10 text-left inline-block">
        <p className="font-semibold mb-2">Quy trình:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <b>Thanh toán</b> {formatVND(PRICE)} (bằng QR tại trang thanh toán)
          </li>
          <li>
            <b>Hoàn thành</b> 54 câu hỏi – chọn đáp án đúng nhất với bạn
          </li>
          <li>
            <b>Kết quả</b> sẽ được gửi về email & hiển thị trên chatbot
          </li>
        </ol>
      </div>

      {/* Nút hành động */}
      <button
        onClick={onStart}
        className="w-full max-w-md border rounded-xl py-4 font-semibold
                   hover:bg-blue-600 hover:text-white transition"
      >
        {hasResult
          ? "Xem kết quả Holland"
          : hasPaid
          ? "Bắt đầu Quiz Holland"
          : `Thanh toán ${formatVND(PRICE)}`}
      </button>
    </section>
  );
}

/* --- small helper --- */
function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="border rounded-2xl py-6">
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}
