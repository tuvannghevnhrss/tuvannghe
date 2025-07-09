"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function FocusTab({
  existingGoal,
}: {
  existingGoal: { what: string | null; why: string | null } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [what, setWhat] = useState(existingGoal?.what ?? "");
  const [why , setWhy ] = useState(existingGoal?.why  ?? "");

  const handleSave = () => {
    if (!what.trim()) return alert("Vui lòng nhập Mục tiêu (WHAT).");
    startTransition(async () => {
      await fetch("/api/career/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ what, why }),
      });
      router.push("/profile?step=plan");      // sang bước kế
      router.refresh();                       // nạp lại dữ liệu server-component
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <label className="font-medium">Mục tiêu (WHAT)</label>
        <textarea
          className="mt-1 w-full rounded border p-2 h-28"
          value={what}
          onChange={e=>setWhat(e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Lý do (WHY)</label>
        <textarea
          className="mt-1 w-full rounded border p-2 h-28"
          value={why}
          onChange={e=>setWhy(e.target.value)}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={pending}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {pending ? "Đang lưu…" : "Lưu & sang bước kế"}
      </button>
    </div>
  );
}
