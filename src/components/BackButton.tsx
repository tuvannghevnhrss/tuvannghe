"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}             // quay lại trang trước
      className="mt-6 inline-block rounded border px-4 py-2 hover:bg-gray-50"
    >
      ← Quay lại
    </button>
  );
}
