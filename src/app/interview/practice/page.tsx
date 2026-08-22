"use client";

import { useState } from "react";

export default function PracticePage() {
  const [level, setLevel] = useState("medium");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Luyện tập phỏng vấn</h1>

      <select onChange={(e) => setLevel(e.target.value)}>
        <option value="easy">Dễ</option>
        <option value="medium">Trung bình</option>
        <option value="hard">Khó</option>
      </select>

      <button className="ml-4 bg-purple-600 text-white px-4 py-2 rounded">
        Bắt đầu
      </button>
    </div>
  );
}