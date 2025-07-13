"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import useSWR from "swr";

/* ——————————————————————— CẤU HÌNH ——————————————————————— */
const LIMIT    = 10;              // số thẻ phải chọn
const PRODUCT  = "knowdell";      // product id dùng cho API payments

type Value = {
  value_key: string;
  vi: string;
};

export default function KnowdellValuesPage() {
  const supabase = createClientComponentClient();
  const router   = useRouter();

  /* 1️⃣  Kiểm tra Đã thanh toán hay chưa
         (nếu chưa → đá về trang giới thiệu /knowdell) */
  const { data: payStatus, isLoading: checkingPay } = useSWR(
    `/api/payments/status?product=${PRODUCT}`,
    (url: string) => fetch(url).then(r => r.json()),
  );

  useEffect(() => {
    if (!checkingPay && payStatus && !payStatus.paid) {
      router.replace("/knowdell");      // quay lại trang giới thiệu + thanh toán
    }
  }, [checkingPay, payStatus, router]);

  /* 2️⃣  Lấy danh sách 54 thẻ giá trị */
  const [list, setList] = useState<Value[]>([]);
  useEffect(() => {
    supabase
      .from("lookup_values")
      .select("*")
      .order("vi")
      .then(({ data }) => setList(data as Value[] ?? []));
  }, [supabase]);

  /* 3️⃣  State các thẻ đã chọn (đọc lại từ localStorage nếu có) */
  const [picked, setPicked] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("kv_values") ?? "[]");
    } catch {
      return [];
    }
  });

  const toggle = (k: string) =>
    setPicked(prev =>
      prev.includes(k)
        ? prev.filter(x => x !== k)          // bỏ chọn
        : prev.length < LIMIT                // thêm nếu chưa đủ 10
        ? [...prev, k]
        : prev
    );

  /* 4️⃣  Chuyển sang bước /knowdell/skills */
  function next() {
    if (picked.length !== LIMIT) {
      alert(`Hãy chọn đúng ${LIMIT} giá trị`);
      return;
    }
    localStorage.setItem("kv_values", JSON.stringify(picked));
    router.push("/knowdell/skills");
  }

  /* ——————— Loading khi đang kiểm tra thanh toán ——————— */
  if (checkingPay) return null;   // có thể thay bằng spinner

  /* ———————————————————— UI ———————————————————— */
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold">
        Chọn {LIMIT} giá trị nghề nghiệp quan trọng nhất
      </h1>
      <p className="text-sm text-gray-600">
        Đã chọn <b>{picked.length}</b>/{LIMIT}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* —— Cột bên trái: CHƯA chọn —— */}
        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1">
          {list
            .filter(v => !picked.includes(v.value_key))
            .map(v => (
              <button
                key={v.value_key}
                onClick={() => toggle(v.value_key)}
                disabled={picked.length === LIMIT}
                className="w-full text-left px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                {v.vi}
              </button>
            ))}
        </div>

        {/* —— Cột bên phải: ĐÃ chọn —— */}
        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1 bg-indigo-50">
          {picked.map(k => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className="w-full text-left px-3 py-1 rounded hover:bg-indigo-100"
            >
              {list.find(v => v.value_key === k)?.vi}
            </button>
          ))}
          {picked.length === 0 && (
            <p className="italic text-gray-500">Chưa chọn</p>
          )}
        </div>
      </div>

      <button
        onClick={next}
        disabled={picked.length !== LIMIT}
        className="mt-6 px-6 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
      >
        Tiếp tục
      </button>
    </div>
  );
}
