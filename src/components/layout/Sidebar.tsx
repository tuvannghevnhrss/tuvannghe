"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-white border-r p-4">
      <h1 className="text-xl font-bold mb-6">X-Interview</h1>

      <nav className="space-y-3">
        <Link href="/dashboard">Trang chủ</Link>
        <Link href="/questions">Ngân hàng câu hỏi</Link>
        <Link href="/practice">Luyện tập</Link>
        <Link href="/result">Kết quả</Link>
      </nav>
    </div>
  );
}