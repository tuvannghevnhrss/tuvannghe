"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Goal = {
  job        : string | null
  goals      : string | null
  activities : string | null
  start_date : string | null
  end_date   : string | null
  supporters : string | null
}

export default function FocusTab ({ existing }: { existing: Goal | null }) {
  const router                      = useRouter()
  const [pending, startTransition ] = useTransition()

  /* ---------- state (init từ prop) ---------- */
  const [job       , setJob       ] = useState(existing?.job        ?? "")
  const [goals     , setGoals     ] = useState(existing?.goals      ?? "")
  const [activities, setActivities] = useState(existing?.activities ?? "")
  const [startDate , setStartDate ] = useState(existing?.start_date ?? "")
  const [endDate   , setEndDate   ] = useState(existing?.end_date   ?? "")
  const [supporter , setSupporter ] = useState(existing?.supporters ?? "")

  /* ---------- fallback: fetch nếu prop rỗng ---------- */
  useEffect(() => {
    if (existing) return            // đã có prop → khỏi fetch

    fetch("/api/career/goal")
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        const g: Goal | null = json?.data ?? null
        if (!g) return
        setJob        (g.job        ?? "")
        setGoals      (g.goals      ?? "")
        setActivities (g.activities ?? "")
        setStartDate  (g.start_date ?? "")
        setEndDate    (g.end_date   ?? "")
        setSupporter  (g.supporters ?? "")
      })
      .catch(() => {/* ignore */})
  }, [existing])

  /* ---------- save handler ---------- */
  const handleSave = () => {
    if (!job.trim() || !goals.trim()) {
      return alert("Vui lòng nhập Nghề nghiệp & Mục tiêu ưu tiên.")
    }

    startTransition(async () => {
      await fetch("/api/career/focus", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          job, goals, activities,
          start_date : startDate || null,
          end_date   : endDate   || null,
          supporters : supporter,
        }),
      })
      router.push("/profile?step=plan")
      router.refresh()
    })
  }

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ... (các input giống bản mock-up trước) */}
      <div>
        <label className="font-medium block">Nghề nghiệp lựa chọn</label>
        <input
          value={job}
          onChange={e => setJob(e.target.value)}
          className="mt-1 w-full rounded border p-2"
          placeholder="VD: Chuyên viên nhân sự"
        />
      </div>
      {/* ... (các field Goals, Activities, Dates, Supporters) */}
      <button
        onClick={handleSave}
        disabled={pending}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-6 py-2 disabled:opacity-50"
      >
        {pending ? "Đang lưu…" : "Lưu & sang bước kế"}
      </button>
    </div>
  )
}
