/* --------------------------------------------------------------------------
   src/components/PlanTab.tsx   –  Tab 4 · Kế hoạch
   Gating: đọc duy nhất từ /api/profile/summary
   - Knowdell: cần có knowdell_summary
   - Holland: ưu tiên các khóa phổ biến; fallback = hasKnowdell
-------------------------------------------------------------------------- */
"use client"

import { useEffect, useState, useTransition } from "react"
import GanttMini, { Action } from "@/components/GanttMini"

type SortKey = "what" | "who" | "deadline" | "status"

export default function PlanTab({ actions }: { actions: Action[] }) {
  /* ----------------------------- local state ----------------------------- */
  const [acts, setActs]  = useState<Action[]>(actions)
  const [sort, setSort]  = useState<SortKey>("deadline")
  const [dir, setDir]    = useState<1 | -1>(1)
  const [pending, start] = useTransition()

  /* ----------------------------- GATING --------------------------------- */
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/profile/summary", {
          cache: "no-store",
          credentials: "include",
        })
        if (!res.ok) throw new Error("bad response")
        const json = await res.json()
        const p = json?.profile ?? json ?? {}

        // Knowdell: phải có
        const hasKnowdell =
          typeof p?.knowdell_summary === "string" &&
          p.knowdell_summary.trim().length > 0

        // Holland: lấy từ các key phổ biến; nếu không bắt được → fallback theo OptionTab (đã có Knowdell summary thì coi như đã đủ điều kiện)
        const hasHolland =
          (typeof p?.holland_code === "string" && p.holland_code.trim().length > 0) ||
          (typeof p?.holland_summary === "string" && p.holland_summary.trim().length > 0) ||
          (typeof p?.holland?.letters === "string" && p.holland.letters.trim().length > 0) ||
          Array.isArray(p?.holland_scores) || // có field ⇒ đã chạy Holland
          hasKnowdell // fallback an toàn cho case summary không expose Holland

        if (alive) setOk(Boolean(hasKnowdell && hasHolland))
      } catch {
        if (alive) setOk(false)
      }
    })()
    return () => { alive = false }
  }, [])

  /* ------------------------ helper: format date ------------------------- */
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })

  /* ------------------------------ sorting ------------------------------- */
  const sorted = [...acts].sort((a, b) => {
    const m = dir
    switch (sort) {
      case "what":   return m * a.what.localeCompare(b.what)
      case "who":    return m * (a.who ?? "").localeCompare(b.who ?? "")
      case "status": return m * (Number(a.done) - Number(b.done))
      default:       return m * (new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    }
  })
  const toggleSort = (k: SortKey) => {
    if (k === sort) setDir((dir * -1) as 1 | -1)
    else { setSort(k); setDir(1) }
  }

  /* ------------------------- optimistic toggle -------------------------- */
  const toggleDone = (id: string, cur: boolean) => {
    setActs((prev) => prev.map((a) => (a.id === id ? { ...a, done: !cur } : a)))
    fetch("/api/career/action/done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !cur }),
    })
      .then((r) => { if (!r.ok) throw 0 })
      .catch(() => {
        setActs((prev) => prev.map((a) => (a.id === id ? { ...a, done: cur } : a)))
      })
  }

  /* ----------------------------- quick add ------------------------------ */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const what = (fd.get("what") as string)?.trim()
    const who = (fd.get("who") as string)?.trim()
    const deadline = fd.get("deadline") as string
    if (!what || !who || !deadline) return

    start(async () => {
      try {
        const res = await fetch("/api/career/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ what, who, deadline }),
        })
        if (!res.ok) throw 0

        setActs((prev) => [
          ...prev,
          { id: crypto.randomUUID(), what, who, deadline, done: false },
        ])

        form.reset()
        form.querySelector<HTMLInputElement>('[name="what"]')?.focus()
      } catch (err) {
        console.error(err)
      }
    })
  }

  /* ------------------------------- UI ----------------------------------- */
  if (ok === null) {
    return <p className="rounded border bg-gray-50 p-4 text-center">Đang kiểm tra điều kiện…</p>
  }
  if (!ok) {
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Hoàn tất <b>Holland</b> và <b>Knowdell</b> trước khi lập <b>Kế hoạch</b>.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-orange-600 font-semibold text-lg text-center">
        Sau khi xác định được mục tiêu, hãy chia nhỏ ra từng việc nhỏ và hoàn thành
      </p>

      {/* Quick-add form --------------------------------------------------- */}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input name="what" placeholder="Việc cần làm để đạt được mục tiêu" className="min-w-[160px] flex-1 rounded border p-2" />
        <input name="who"  placeholder="Phần thưởng nếu bạn đạt được?"        className="min-w-[140px] flex-1 rounded border p-2" />
        <input name="deadline" type="date" lang="vi" className="rounded border p-2" />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Đang lưu…" : "Thêm"}
        </button>
      </form>

      {/* Tasks table ------------------------------------------------------ */}
      <div className="overflow-x-auto">
        <table className="w-full rounded border text-sm">
          <thead className="select-none bg-gray-50">
            <tr className="whitespace-nowrap">
              <Th label="Việc cần làm" sortKey="what" />
              <Th label="Phần thưởng"  sortKey="who" />
              <Th label="Deadline"     sortKey="deadline" />
              <Th label="Trạng thái"   sortKey="status" />
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{a.what}</td>
                  <td className="p-2 text-center">{a.who}</td>
                  <td className="p-2 text-center">{fmt(a.deadline)}</td>
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={a.done} onChange={() => toggleDone(a.id, a.done)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center italic text-gray-500">Chưa có hành động nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Progress chart --------------------------------------------------- */}
      <section>
        <h3 className="mb-2 font-semibold">Lược đồ tiến độ</h3>
        <GanttMini actions={acts} />
      </section>
    </div>
  )

  /* ---------- small helper ------------ */
  function Th({ label, sortKey }: { label: string; sortKey: SortKey }) {
    return (
      <th className="cursor-pointer p-2" onClick={() => toggleSort(sortKey)}>
        {label}{sort === sortKey && (dir === 1 ? " ▲" : " ▼")}
      </th>
    )
  }
}
