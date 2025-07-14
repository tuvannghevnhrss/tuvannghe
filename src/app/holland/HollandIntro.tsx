'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PRICE = 20_000;
const STAT = [
  { value: '54',  label: 'Câu hỏi' },
  { value: '2',   label: 'Lựa chọn/câu' },
  { value: '20K', label: 'Phí' },
];

const StatBox = ({ value, label }: { value: string; label: string }) => (
  <div className="border rounded-2xl py-6">
    <p className="text-4xl font-bold">{value}</p>
    <p className="text-gray-500">{label}</p>
  </div>
);

export default function HollandIntro() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paid,    setPaid]    = useState(false);
  const [code,    setCode]    = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/holland/status');
        const data = await res.json();          // {paid, finished, code}
        setPaid(!!data.paid);
        setCode(data.finished ? data.code : null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handle = () => {
    if (code) router.push('/profile?step=trait');
    else if (paid) router.push('/holland/quiz?start=1');
    else router.push('/payment?product=holland');
  };

  const label = loading
    ? 'Đang kiểm tra…'
    : code
      ? 'Xem lại kết quả'
      : paid
        ? 'Bắt đầu Quiz Holland'
        : `Thanh toán ${PRICE.toLocaleString()} đ`;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 text-center space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Bộ câu hỏi Holland</h1>
        <p className="text-gray-600">
          Khám phá nhóm nghề nghiệp phù hợp nhất với bạn thông qua trắc nghiệm Holland RIASEC.
        </p>
      </header>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        {STAT.map(s => <StatBox key={s.label} {...s} />)}
      </div>

      {/* quy trình */}
      <div className="border border-dashed rounded-2xl p-6 text-left leading-6 inline-block">
        <p className="font-semibold mb-2">Quy trình:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li><b>Thanh&nbsp;toán</b> {PRICE.toLocaleString()} đ (QR trên trang thanh toán)</li>
          <li><b>Hoàn thành</b> 54 câu hỏi – chọn đáp án đúng nhất với bạn</li>
          <li><b>Kết quả</b> sẽ gửi email &amp; hiển thị chatbot của bạn</li>
        </ol>
      </div>

      <button
        disabled={loading}
        onClick={handle}
        className="w-full max-w-md border rounded-xl py-4 font-semibold
                   hover:bg-blue-600 hover:text-white transition disabled:opacity-60"
      >
        {label}
      </button>
    </section>
  );
}
