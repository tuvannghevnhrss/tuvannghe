/* ------------------------------------------------------------------
   src/app/payment/PaymentContent.tsx
   - Hiển thị giá / mã giảm / QR
   - Logic mới: nếu user đã trả tiền Knowdell thì Holland auto “paid”
------------------------------------------------------------------ */
"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import Image from "next/image";
import type { ServiceKey } from "@/lib/constants";

const START_PATH: Partial<Record<ServiceKey, string>> = {
  mbti              : "/mbti/quiz",
  holland           : "/holland/quiz",
  knowdell          : "/knowdell",
  interview_starter : "/interview",
  interview_pro     : "/interview",
  interview_premium : "/interview",
};

type Props = { product: ServiceKey };

type Quote =
  | { error: string }
  | {
      listPrice : number;
      amount_due: number;
      discount  : number;
      amount    : number;
      paid?     : boolean;
    };

export default function PaymentContent({ product }: Props) {
  /* ------------------------------ state ------------------------------ */
  const [coupon,   setCoupon] = useState("");
  const [amount,   setAmount] = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr,       setQr]     = useState<string | null>(null);
  const [error,    setErr]    = useState("");
  const [busy,     setBusy]   = useState(false);

  const [justPaid,     setJustPaid]     = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  // Định danh GIAO DỊCH hiện tại (khác với "product") — dùng để poll đúng
  // payment này, không bị nhầm với 1 payment khác cùng product đã paid từ
  // trước. orderCode chỉ giữ để hiển thị/debug khi cần, không dùng để poll.
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  const destURL  = START_PATH[product] ?? "/profile";
  const onceFlag = useRef(false);               // auto-checkout đúng 1 lần

  /* --------------------------- utils --------------------------- */
  /** gọi quote 1 sản phẩm — luôn trả về Quote hợp lệ, không throw, để không
      bao giờ làm treo state ở "Đang tải…" khi network/API lỗi. */
  async function fetchQuote(prod: string, code?: string): Promise<Quote> {
    const qs = new URLSearchParams({ product: prod, ts: Date.now().toString() });
    if (code) qs.append("coupon", code);
    try {
      const res = await fetch(`/api/payments/quote?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) return { error: json?.error ?? `HTTP_${res.status}` };
      return json as Quote;
    } catch (err) {
      console.error("fetchQuote failed:", err);
      return { error: "NETWORK_ERROR" };
    }
  }

  /** nếu X==holland & knowdell đã paid → redirect */
  async function maybeSkipForHolland() {
    if (product !== "holland") return false;
    const knowdell = await fetchQuote("knowdell");
    if ("paid" in knowdell && knowdell.paid) {
      // ghi “đã thanh toán” vào DB cho holland (1 request nhẹ, không blocking)
      fetch("/api/payments/checkout", {
        method : "POST",
        body   : JSON.stringify({ product: "holland", freeByBundle: true }),
        cache  : "no-store",
      }).finally(() => {
        window.location.replace(destURL);
      });
      return true;
    }
    return false;
  }

  /* ---------------------- 1. lấy quote đầu ---------------------- */
  useEffect(() => {
    (async () => {
      try {
        // 👉 nếu holland được bundle bởi knowdell
        if (await maybeSkipForHolland()) return;

        const res = await fetchQuote(product);
        if ("error" in res) { setAmount(-1); return; }

        setAmount(res.amount);
        setDisc  (res.discount);

        if (res.paid) {                       // đã ghi PAID
          window.location.replace(destURL);
        } else if (res.amount === 0 && !onceFlag.current) {
          onceFlag.current = true;
          doCheckout(true);
        }
      } catch (err) {
        // Không để lỗi bất ngờ (network, JSON hỏng...) làm treo mãi ở "Đang tải…"
        console.error("Payment quote flow failed:", err);
        setAmount(-1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  /* ------------------- 2. polling khi có QR -------------------- */
  useEffect(() => {
    if (!qr || paymentId == null) return;
    setPollTimedOut(false);
    const startedAt = Date.now();
    const MAX_POLL_MS = 15 * 60 * 1000; // dừng poll sau 15 phút không xác nhận
    const id = setInterval(() => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        clearInterval(id);
        setPollTimedOut(true);
        return;
      }
      // Poll đúng GIAO DỊCH hiện tại (payment_id), không phải "product" —
      // nếu poll theo product, 1 payment khác cùng product đã paid từ trước
      // sẽ khiến giao dịch pending hiện tại bị báo nhầm là đã thanh toán.
      fetch(`/api/payments/status?payment_id=${paymentId}`, { cache: "no-store" })
        .then(r => r.json())
        .then(res => {
          if (res.paid) {
            clearInterval(id);
            setJustPaid(true);
            setTimeout(() => window.location.replace(destURL), 1200);
          }
        })
        .catch(err => console.error("Payment status poll failed:", err));
    }, 3000);
    return () => clearInterval(id);
  }, [qr, paymentId, destURL]);

  /* -------------------- 3. áp mã giảm --------------------------- */
  async function applyCoupon() {
    setErr("");
    const code = coupon.trim();
    if (!code) return;
    const res = await fetchQuote(product, code);
    if ("error" in res) { setErr(res.error); return; }

    setAmount(res.amount);
    setDisc  (res.discount);

    if (res.amount === 0 && !onceFlag.current) {
      onceFlag.current = true;
      doCheckout(true);
    }
  }

  /* ---------------------- 4. checkout --------------------------- */
  async function doCheckout(auto = false) {
    if (busy) return;
    setBusy(true); setErr("");

    try {
      const body: Record<string, any> = { product, coupon: coupon.trim() || undefined };
      const httpRes = await fetch("/api/payments/checkout", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(body),
        cache  : "no-store",
      });
      const res = await httpRes.json();

      if (!httpRes.ok || res.error) {
        setErr(res.error ?? `Không thể thanh toán (HTTP ${httpRes.status}).`);
        return;
      }

      if (res.free) {
        window.location.replace(destURL);
        return;
      }
      if (!auto) {
        setQr(res.qr_url);
        setAmount(res.amount);
        setPaymentId(typeof res.payment_id === "number" ? res.payment_id : null);
        setOrderCode(typeof res.order_code === "string" ? res.order_code : null);
      }
    } catch (err) {
      console.error("doCheckout failed:", err);
      setErr("Không thể kết nối tới máy chủ thanh toán. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------- render ----------------------------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  return (
    <div className="mx-auto max-w-sm space-y-6 text-center">
      <h2 className="mt-9 text-xl font-semibold">
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

      {/* coupon */}
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
          disabled={busy}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
        >
          Áp dụng
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* QR hoặc nút */}
      {qr ? (
        <div className="space-y-3">
          <Image
            src={qr}
            alt="QR thanh toán"
            width={256}
            height={256}
            className="mx-auto h-64 w-64 rounded border"
          />
          {justPaid ? (
            <p className="font-medium text-green-600">
              ✓ Thanh toán thành công! Đang chuyển trang…
            </p>
          ) : pollTimedOut ? (
            <p className="text-sm text-amber-600">
              Chưa nhận được xác nhận thanh toán tự động. Nếu bạn đã chuyển khoản,
              vui lòng chờ thêm ít phút — hệ thống sẽ tiếp tục kiểm tra khi bạn tải
              lại trang, hoặc liên hệ hỗ trợ để được xác nhận thủ công
              {orderCode ? ` (mã đơn: ${orderCode})` : ""}.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Đang chờ thanh toán… Sau khi chuyển khoản thành công, hệ thống sẽ tự
              động xác nhận.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => doCheckout(false)}
          disabled={busy}
          className="w-full rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {amount === 0
            ? "Xác nhận & kích hoạt"
            : `Thanh toán ${amount.toLocaleString("vi-VN")} đ`}
        </button>
      )}
    </div>
  );
}
