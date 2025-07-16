/* src/app/payment/PaymentContent.tsx
   – Hiển thị giá / mã giảm / QR
   – Xử lý free-checkout không bị lặp trang
---------------------------------------------------------------- */

"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { SERVICE } from "@/lib/constants";

type Props = { product: keyof typeof SERVICE };

type Quote =
  | { error: string }
  | {
      listPrice: number;
      amount_due: number;
      discount: number;
      amount: number;
    };

export default function PaymentContent({ product }: Props) {
  /* ---------- state ---------- */
  const [coupon, setCoupon]   = useState("");
  const [amount, setAmount]   = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr, setQr]           = useState<string | null>(null);
  const [error, setErr]       = useState("");

  const destURL = `/${product}`;          // nơi sẽ chuyển đến khi đã kích hoạt

  /* 1 ▸ Lấy giá mặc định hoặc đã PAID ------------------------------------ */
  useEffect(() => {
    const ts = Date.now();
    fetch(`/api/payments/quote?product=${product}&ts=${ts}`, {
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<Quote>)
      .then((res) => {
        if ("error" in res) throw new Error(res.error);
        setAmount(res.amount);
        setDisc(res.discount);

        // ĐÃ THANH TOÁN ➜ vào thẳng trang sản phẩm
        if (res.amount === 0 && res.discount === 0) {
          window.location.replace(destURL);
        }
      })
      .catch(() => setAmount(-1));
  }, [product, destURL]);

  /* 2 ▸ Poll 3 giây nếu đã có QR ---------------------------------------- */
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      fetch(`/api/payments/status?product=${product}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((res) => {
          if (res.paid) {
            clearInterval(id);
            window.location.replace(destURL);
          }
        });
    }, 3000);
    return () => clearInterval(id);
  }, [qr, product, destURL]);

  /* 3 ▸ Áp mã giảm giá --------------------------------------------------- */
  async function applyCoupon() {
    setErr("");
    const code = coupon.trim();
    if (!code) return;

    const ts = Date.now();
    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}&ts=${ts}`,
      { cache: "no-store" }
    ).then((r) => r.json() as Promise<Quote>);

    if ("error" in res) {
      setErr(res.error);
      return;
    }
    setAmount(res.amount);
    setDisc(res.discount);
  }

  /* 4 ▸ Thanh toán / Kích hoạt ------------------------------------------ */
  async function checkout() {
    setErr("");
    const body = { product, coupon: coupon.trim() || undefined };

    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    }).then((r) => r.json());

    if (res.error) {
      setErr(res.error);
      return;
    }

    // free → chuyển về trang sản phẩm
    if (res.free) {
      window.location.replace(destURL);
      return;
    }

    // trả QR
    setQr(res.qr_url);
  }

  /* ---------- render ---------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1) return <p className="text-red-600">Không lấy được giá.</p>;

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
            {" "}
            (đã giảm {discount.toLocaleString("vi-VN")} đ)
          </span>
        )}
      </p>

      {/* ô coupon */}
      <div className="flex justify-center gap-2">
        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
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
