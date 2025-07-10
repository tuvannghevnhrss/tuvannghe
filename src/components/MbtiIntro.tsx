'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* —— cấu hình cố định —— */
const PRICE = 10_000;
const STAT = [
  { value: '60',  label: 'Câu hỏi' },
  { value: '2',   label: 'Lựa chọn/câu' },
  { value: '10K', label: 'Phí' },
];

/* —— component nhỏ hiển thị 1 ô thống kê —— */
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center rounded-xl border p-6 shadow-sm">
    <span className="text-3xl font-extrabold">{value}</span>
    <span className="mt-1 text-sm text-gray-500">{label}</span>
  </div>
);

export default function MbtiIntro() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);

  /* hỏi API xem user đã thanh toán MBTI hay chưa */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payments/status?product=mbti');
        const { paid } = await res.json();   // { paid: true/false }
        setHasPaid(Boolean(paid));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* —— hàm điều hướng —— */
  const handleClick = () => {
    if (hasPaid) {
      router.push('/mbti?start=1');
    } else {
      router.push('/payment?product=mbti');
    }
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-12 text-center space-y-10">
      {/* tiêu đề & mô tả */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Bộ câu hỏi MBTI</h1>
        <p className="text-gray-600">
          Đây là bộ câu hỏi đánh giá tính&nbsp;cách của&nbsp;bạn, giúp&nbsp;bạn hiểu rõ
          hơn về điểm mạnh, điểm yếu.
        </p>
      </header>

      {/* 3 ô thống kê */}
      <section className="grid grid-cols-3 gap-4">
        {STAT.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} />
        ))}
      </section>

      {/* khung Quy trình */}
      <section className="rounded-xl border border-dashed p-6 text-left leading-6">
        <h2 className="font-semibold mb-2">Quy trình:</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Thanh&nbsp;toán</strong> {PRICE.toLocaleString()} đ phí
            (bằng&nbsp;QR tại trang thanh&nbsp;toán)
          </li>
          <li>
            <strong>Hoàn thành</strong> 60 câu hỏi – đừng suy nghĩ quá lâu,
            hãy&nbsp;chọn đáp&nbsp;án đúng nhất về&nbsp;bạn
          </li>
          <li>
            <strong>Kết quả</strong> sẽ được gửi về email và chatbot của&nbsp;bạn
          </li>
        </ol>
      </section>

      {/* nút hành động */}
      <button
        disabled={loading}
        onClick={handleClick}
        className="
          w-full rounded-xl border-2 border-brandYellow bg-brandYellow/90
          px-6 py-3 font-medium text-black transition
          hover:bg-brandYellow disabled:opacity-60
        "
      >
        {loading
          ? 'Đang kiểm tra…'
          : hasPaid
              ? 'Bắt đầu Quiz MBTI'
              : `Thanh toán ${PRICE.toLocaleString()} đ`}
      </button>
    </main>
  );
}
