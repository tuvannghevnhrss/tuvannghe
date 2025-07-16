/* src/app/payment/PaymentContent.tsx
   – Hiển thị giá / mã giảm / QR, xử lý coupon 0 đ không “văng” trang
---------------------------------------------------------------- */

"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { SERVICE } from "@/lib/constants";

const START_PATH: Record<keyof typeof SERVICE, string> = {
  mbti    : "/mbti/quiz",
  holland : "/holland/quiz",
  knowdell: "/knowdell",          // drag-drop ngay tại /knowdell
};

type Props = { product: keyof typeof SERVICE };

type Quote =
  | { error: string }
  | {
      listPrice : number;
      amount_due: number;
      discount  : number;
      amount    : number;  // còn phải trả
      paid?     : boolean; // server báo đã kích hoạt
    };

export default function PaymentContent({ product }: Props) {
  /* ---------------- state ---------------- */
  const [coupon  , setCoupon] = useState("");
  const [amount  , setAmount] = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr      , setQr]     = useState<string | null>(null);
  const [error   , setErr]    = useState("");

  const router   = useRouter();
  const destURL  = START_PATH[product];

  /* ---------- helpers ---------- */
  /** Điều hướng tới trang làm bài (không reload) */
  const gotoQuiz = () => router.replace(destURL);

  /** Gửi checkout tới server (dùng cho free hoặc tạo QR) */
  const doCheckout = async (skipQR: boolean) => {
    const body = { product, coupon: coupon.trim() || undefined };

    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      body  : JSON.stringify(body),
      cache : "no-store",
    }).then(r => r.json());

    if (res.error) { setErr(res.error); return false; }

    if (res.free) {           // server đã set PAID
      gotoQuiz();
      return true;
    }

    if (!skipQR) {
      setQr    (res.qr_url);
      setAmount(res.amount);  // số tiền còn phải trả (sau mã)
    }
    return true;
  };

  /* 1 ▸ Lấy quote ban đầu ------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const ts   = Date.now();
        const res  = await fetch(
          `/api/payments/quote?product=${product}&ts=${ts}`,
          { cache: "no-store" }
        ).then(r => r.json()) as Quote;

        if ("error" in res) throw new Error(res.error);

        setAmount(res.amount);
        setDisc  (res.discount);

        if (res.paid) {
          gotoQuiz();               // đã kích hoạt từ trước
        } else if (res.amount === 0) {
          await doCheckout(true);   // free ngay từ đầu
        }
      } catch {
        setAmount(-1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  /* 2 ▸ Poll 3 s khi đang hiển thị QR ------------------------------- */
  useEffect(() => {
    if (!qr || !amount || amount === 0) return;

    const id = setInterval(() => {
      fetch(`/api/payments/status?product=${product}`, { cache:"no-store" })
        .then(r => r.json())
        .then(res => {
          if (res.paid) {
            clearInterval(id);
            gotoQuiz();
          }
        });
    }, 3_000);
    return () => clearInterval(id);
  }, [qr, amount, product]);

  /* 3 ▸ Áp mã giảm giá --------------------------------------------- */
  const applyCoupon = async () => {
    setErr("");
    const code = coupon.trim();
    if (!code) return;

    const ts  = Date.now();
    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}&ts=${ts}`,
      { cache:"no-store" }
    ).then(r => r.json()) as Quote;

    if ("error" in res) { setErr(res.error); return; }

    setAmount(res.amount);
    setDisc  (res.discount);

    // nếu mã khiến số tiền = 0 → ghi PAID & chuyển trang
    if (res.amount === 0) await doCheckout(true);
  };

  /* 4 ▸ User nhấn nút “Thanh toán / Xác nhận” ----------------------- */
  const handleCheckoutClick = () => doCheckout(false);

  /* ---------------- render ---------------- */
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
          onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && applyCoupon()}
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
          onClick={handleCheckoutClick}
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
