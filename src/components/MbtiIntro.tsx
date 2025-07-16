/* src/app/mbti/MbtiIntro.tsx
   – Intro MBTI (free) – chuyển thẳng sang /mbti/quiz sau khi đã “paid”
-------------------------------------------------------------------- */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* —— cấu hình cố định —— */
const PRICE = 0;
const STAT = [
  { value: '60',  label: 'Câu hỏi' },
  { value: '2',   label: 'Lựa chọn/câu' },
  { value: 'Free', label: 'Phí' },
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
  const [paid,    setPaid]    = useState(false);
  const [code,    setCode]    = useState<string | null>(null);  // null = chưa làm

  /* —— gọi API lấy trạng thái —— */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/mbti/status', { cache: 'no-store' });
        const data = await res.json();          // { paid, finished, code }
        setPaid(Boolean(data.paid));
        setCode(data.finished ? data.code : null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* —— điều hướng —— */
  const handleClick = () => {
    if (code) {
      router.push('/profile?step=trait');       // xem kết quả
    } else if (paid) {
      /* 🔹 ĐÃ SỬA: chuyển sang trang làm bài đúng route */
      router.push('/mbti/quiz');
    } else {
      router.push('/payment?product=mbti');     // (dù free, giữ luồng đồng nhất)
    }
  };

  /* —— nhãn nút —— */
  const buttonLabel = loading
    ? 'Đang kiểm tra…'
    : code
        ? 'Xem lại kết quả'
        : paid
            ? 'Bắt đầu Quiz MBTI'
            : `Thanh toán ${PRICE.toLocaleString()} đ`;

  return (
    <main className="mx-auto max-w-lg px-6 py-12 space-y-10 text-center">
      {/* ── tiêu đề & mô tả ── */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Bộ câu hỏi MBTI</h1>
        <p className="text-gray-600">
          Đây là bộ câu hỏi đánh giá tính&nbsp;cách của&nbsp;bạn,
          giúp&nbsp;bạn hiểu rõ hơn về điểm mạnh, điểm yếu.
        </p>
      </header>

      {/* ── thống kê ── */}
      <section className="grid grid-cols-3 gap-4">
        {STAT.map(s => (
          <StatCard key={s.label} value={s.value} label={s.label} />
        ))}
      </section>

      {/* ── quy trình ── */}
      <section className="rounded-xl border border-dashed p-6 text-left leading-6">
        <h2 className="font-semibold mb-2">Quy trình:</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Thanh&nbsp;toán</strong> {PRICE.toLocaleString()} đ phí
            (bằng QR tại trang thanh toán)
          </li>
          <li>
            <strong>Hoàn&nbsp;thành</strong> 60 câu hỏi – đừng suy nghĩ quá lâu,
            hãy&nbsp;chọn đáp&nbsp;án đúng nhất với bạn
          </li>
          <li>
            <strong>Kết&nbsp;quả</strong> sẽ được gửi về email, chatbot
            và hiển thị trong Hồ&nbsp;sơ của&nbsp;bạn
          </li>
        </ol>
      </section>

      {/* ── nút hành động ── */}
      <button
        disabled={loading}
        onClick={handleClick}
        className="
          w-full rounded-xl border-2 border-brandYellow bg-brandYellow/90
          px-6 py-3 font-medium text-black transition
          hover:bg-brandYellow disabled:opacity-60
        "
      >
        {buttonLabel}
      </button>
    </main>
  );
}
