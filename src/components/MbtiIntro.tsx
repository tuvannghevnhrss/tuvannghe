'use client';

import { useRouter } from 'next/navigation';

const StatCard = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <div className="rounded-xl border p-6 shadow-sm">
    <div className="text-3xl font-extrabold">{value}</div>
    <p className="mt-1 text-sm text-gray-500">{label}</p>
  </div>
);

export default function MbtiIntro() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md space-y-8 py-12 text-center">
      {/* Tiêu đề & mô tả */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Bộ câu hỏi MBTI
        </h1>
        <p className="text-gray-600">
          Đây là bộ câu hỏi đánh giá tính cách của bạn, giúp bạn
          hiểu rõ hơn về điểm mạnh, điểm yếu.
        </p>
      </header>

      {/* Thông số nhanh */}
      <section className="grid grid-cols-3 gap-4">
        <StatCard value="60" label="Câu hỏi" />
        <StatCard value="2" label="Lựa chọn/câu" />
        <StatCard value="10K" label="Phí" />
      </section>

      {/* Nút bắt đầu */}
      <button
        onClick={() => router.push('/mbti?start=1')}
        className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white transition hover:bg-gray-800"
      >
        Bắt đầu Quiz MBTI
      </button>

      {/* Quy trình gợi ý (tuỳ thích) */}
      {/* <ol className="text-left text-sm leading-6 text-gray-600">
        <li>1. Hoàn thành 60 câu hỏi MBTI</li>
        <li>2. Thanh toán 10 000 đ để nhận kết quả</li>
        <li>3. Báo cáo chi tiết gửi về email</li>
      </ol> */}
    </main>
  );
}
