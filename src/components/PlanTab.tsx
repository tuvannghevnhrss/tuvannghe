"use client";

import { useState, useTransition } from "react";
import GanttMini, { Action } from "@/components/GanttMini";

type SortKey = "what" | "who" | "deadline" | "status";

export default function PlanTab({ actions }: { actions: Action[] }) {
  const [acts, setActs] = useState<Action[]>(actions);   // ← state cục bộ
  const [sort, setSort] = useState<SortKey>("deadline");
  const [dir , setDir ] = useState<1 | -1>(1);
  const [pending, start] = useTransition();

  /* ---------- sắp xếp ---------- */
  const sorted = [...acts].sort((a, b) => {
    const m = dir;
    switch (sort) {
      case "what":   return m * a.what.localeCompare(b.what);
      case "who":    return m * (a.who ?? "").localeCompare(b.who ?? "");
      case "status": return m * (Number(a.done) - Number(b.done));
      default:       return m * (new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
  });

  const toggleSort = (k: SortKey) => {
    if (k === sort) setDir(dir * -1 as 1 | -1);
    else { setSort(k); setDir(1); }
  };

  /* ---------- đổi trạng thái (optimistic) ---------- */
  const toggleDone = (id: string, cur: boolean) => {
    // 1. Optimistic update
    setActs(prev => prev.map(a => a.id === id ? { ...a, done: !cur } : a));

    // 2. Gửi server
    fetch("/api/career/action/done", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ id, done: !cur }),
    }).then(res => {
      if (!res.ok) throw new Error("update failed");
    }).catch(err => {
      console.error(err);
      // 3. Rollback khi lỗi
      setActs(prev => prev.map(a => a.id === id ? { ...a, done: cur } : a));
    });
  };

  /* ---------- thêm nhanh ---------- */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd   = new FormData(form);
    const what = (fd.get("what") as string)?.trim();
    const who  = (fd.get("who")  as string)?.trim();
    const deadline = fd.get("deadline") as string;
    if (!what || !who || !deadline) return;

    start(async () => {
      const res = await fetch("/api/career/action", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ what, who, deadline }),
      });
      if (res.ok) {
        // Lấy id mới từ header (Supabase trả location) hoặc re-fetch; ở đây đơn giản push giả id.
        setActs(prev => [...prev, {
          id: crypto.randomUUID(),
          what,
          who,
          deadline,
          done: false,
        }]);
        form.reset();
      }
    });
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-8">

      {/* Form thêm nhanh */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center">
        <input name="what"     placeholder="Việc cần làm"        className="flex-1 min-w-[160px] border rounded p-2" />
        <input name="who"      placeholder="Ai chịu trách nhiệm" className="flex-1 min-w-[140px] border rounded p-2" />
        <input name="deadline" type="date"                       className="border rounded p-2" />
        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-5 py-2 disabled:opacity-50"
        >
          {pending ? "Đang lưu…" : "Thêm"}
        </button>
      </form>

      {/* Bảng nhiệm vụ */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-50 select-none">
            <tr className="whitespace-nowrap">
              <th className="p-2 cursor-pointer" onClick={()=>toggleSort("what")}   >Việc {sort==="what"   && (dir===1?"▲":"▼")}</th>
              <th className="p-2 cursor-pointer" onClick={()=>toggleSort("who")}    >Ai   {sort==="who"    && (dir===1?"▲":"▼")}</th>
              <th className="p-2 cursor-pointer" onClick={()=>toggleSort("deadline")}>Deadline {sort==="deadline"&&(dir===1?"▲":"▼")}</th>
              <th className="p-2 cursor-pointer" onClick={()=>toggleSort("status")} >Trạng&nbsp;thái {sort==="status" && (dir===1?"▲":"▼")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? sorted.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.what}</td>
                <td className="p-2 text-center">{a.who}</td>
                <td className="p-2 text-center">
                  {new Date(a.deadline).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={a.done}
                    onChange={() => toggleDone(a.id, a.done)}
                  />
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-4 italic text-center text-gray-500">Chưa có hành động nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lược đồ tiến độ */}
      <section>
        <h3 className="font-semibold mb-2">Lược đồ tiến độ</h3>
        <GanttMini actions={acts}/>
      </section>
    </div>
  );
}
