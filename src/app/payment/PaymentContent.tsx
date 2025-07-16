/* src/app/payment/PaymentContent.tsx
   – Hiển thị giá / mã giảm / QR
   – Xử lý free-checkout & polling
---------------------------------------------------------------- */

"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { SERVICE } from "@/lib/constants";

const START_PATH: Record<keyof typeof SERVICE, string> = {
  mbti    : "/mbti/quiz",       // ← đường dẫn trang làm bài
  holland : "/holland/quiz",
  knowdell: "/knowdell",        // knowdell vẫn là drag-drop ngay tại /knowdell
};

type Props = { product: keyof typeof SERVICE };

type Quote =
  | { error: string }
  | {
      listPrice   : number;
      amount_due  : number;
      discount    : number;
      amount      : number;   // còn phải trả
      paid?       : boolean;  // server gửi true khi đã kích hoạt
    };

export default function PaymentContent({ product }: Props) {
  /* ---------- state ---------- */
  const [coupon  , setCoupon] = useState("");
  const [amount  , setAmount] = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr      , setQr]     = useState<string | null>(null);
  const [error   , setErr]    = useState("");

  const destURL = START_PATH[product];               // đích sau khi kích hoạt

  /* 1 ▸ Lấy quote gốc ---------------------------------------------------- */
  useEffect(() => {
    const ts = Date.now();
    fetch(`/api/payments/quote?product=${product}&ts=${ts}`, {
      cache: "no-store",
    })
      .then(r => r.json() as Promise<Quote>)
      .then(res => {
        if ("error" in res) throw new Error(res.error);
        setAmount  (res.amount);
        setDisc    (res.discount);

        // server cho biết đã kích hoạt hoặc số tiền còn 0
        if (res.paid || res.amount === 0) {
          window.location.replace(destURL);
        }
      })
      .catch(() => setAmount(-1));
  }, [product, destURL]);

  /* 2 ▸ Poll 3 s nếu đã có QR & còn phải trả ----------------------------- */
  useEffect(() => {
    if (!qr || !amount || amount === 0) return;

    const id = setInterval(() => {
      fetch(`/api/payments/status?product=${product}`, { cache: "no-store" })
        .then(r => r.json())
        .then(res => {
          if (res.paid) {
            clearInterval(id);
            window.location.replace(destURL);
          }
        });
    }, 3_000);

    return () => clearInterval(id);
  }, [qr, amount, product, destURL]);

  /* 3 ▸ Áp mã giảm ------------------------------------------------------ */
  async function applyCoupon() {
    setErr("");
    const code = coupon.trim();
    if (!code) return;

    const ts  = Date.now();
    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}&ts=${ts}`,
      { cache: "no-store" }
    ).then(r => r.json() as Promise<Quote>);

    if ("error" in res) { setErr(res.error); return; }

    setAmount(res.amount);
    setDisc  (res.discount);

    // mã coupon khiến số tiền = 0  → tự kích hoạt
    if (res.amount === 0) window.location.replace(destURL);
  }

  /* 4 ▸ Thanh toán / kích hoạt ----------------------------------------- */
  async function checkout() {
    setErr("");
    const body = { product, coupon: coupon.trim() || undefined };

    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      body  : JSON.stringify(body),
      cache : "no-store",
    }).then(r => r.json());

    if (res.error) { setErr(res.error); return; }

    if (res.free) {
      window.location.replace(destURL);        // không cần QR
      return;
    }

    // nhận QR
    setQr    (res.qr_url);
    setAmount(res.amount);                     // số tiền thực phải trả (sau mã)
  }

  /* ---------- render ---------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  return (
    <div className="mx-auto max-w-sm space-y-6 text-center">
      <h2 className="text-xl font-semibold">
        Thanh&nbsp;toán gói {product.toUpperCase()}
      </h2>

      <p>
        Phí cần trả:&nbsp;
        <b>{amount.toLocaleString("vi-VN")} đ</b>
        {discount > 0 && (
          <span className="text-sm text-green-600">
            &nbsp;(đã giảm {discount.toLocaleString("vi-VN")} đ)
          </span>
        )}
      </p>

      {/* ô coupon */}
      <div className="flex justify-center gap-2">
        <input
          value={coupon}
          onChange={e => setCoupon(e.target.value)}
          onKeyDown={(e: KeyboardEvent) =>
            e.key === "Enter" && applyCoupon()}
          placeholder="Mã giảm giá"
          className="w-36 rounded border px-3 py-2 text-center"
        />
        <button
          onClick={applyCoupon}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Áp dụng
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* QR hoặc nút checkout */}
      {qr ? (
        <img
          src={qr}
          alt="QR thanh toán"
          className="mx-auto h-64 w-64 rounded border"
        />
      ) : (
        <button
          onClick={checkout}
          className="w-full rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          {amount === 0
            ? "Xác nhận & kích hoạt"
            : `Thanh toán ${amount.toLocaleString("vi-VN")} đ`}
        </button>
      )}
    </div>
  );
}
