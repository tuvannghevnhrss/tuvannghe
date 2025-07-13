// PaymentContent.tsx  (rút gọn phần giá tĩnh)
import useSWR from 'swr';
import { SERVICE } from '@/lib/constants';
import { Loader } from 'lucide-react';

export default function PaymentContent({ product }: { product: keyof typeof SERVICE }) {
  // Hỏi API quote để lấy số tiền thực
  const { data, isLoading } = useSWR(`/api/payments/quote?product=${product}`);
  if (isLoading) return <p>Đang tải…</p>;

  const amount = data.amount as number;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Thanh toán gói {product.toUpperCase()}</h2>
      <p>Phí cần trả: <b>{amount.toLocaleString('vi-VN')} đ</b></p>

      {amount === 0 ? (
        <button
          onClick={() => fetch('/api/payments/checkout', { method: 'POST', body: JSON.stringify({ product }) })
            .then(() => location.reload())}
          className="px-6 py-3 bg-green-600 text-white rounded"
        >
          Xác nhận & kích hoạt
        </button>
      ) : (
        <button
          onClick={() => fetch('/api/payments/checkout', { method: 'POST', body: JSON.stringify({ product }) })
            .then(res => res.json())
            .then(({ qr_url }) => window.open(qr_url, '_blank'))}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          Thanh toán {amount.toLocaleString('vi-VN')} đ
        </button>
      )}
    </div>
  );
}
