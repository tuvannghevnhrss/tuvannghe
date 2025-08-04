/* ---------------------------------------------------------------
   Tab 3 – Mục tiêu (WHAT / WHY / HOW)
   Bổ sung thêm các trường theo yêu cầu layout mới
---------------------------------------------------------------- */
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export default function FocusTab ({
  existing,
}: {
  existing: {
    job?       : string | null
    goals?     : string | null
    activities?: string | null
    start_date?: string | null   // ISO-8601
    end_date?  : string | null
    supporters?: string | null
  } | null
}) {
  const router                      = useRouter()
  const [pending, startTransition ] = useTransition()

  /* ---------------------- local state ---------------------- */
  const [job       , setJob       ] = useState(existing?.job        ?? "")
  const [goals     , setGoals     ] = useState(existing?.goals      ?? "")
  const [activities, setActivities] = useState(existing?.activities ?? "")
  const [startDate , setStartDate ] = useState(existing?.start_date ?? "")
  const [endDate   , setEndDate   ] = useState(existing?.end_date   ?? "")
  const [supporter , setSupporter ] = useState(existing?.supporters ?? "")

  /* ----------------------- handlers ------------------------ */
  const handleSave = () => {
    if (!job.trim())   return alert("Vui lòng nhập Nghề nghiệp lựa chọn.")
    if (!goals.trim()) return alert("Vui lòng nhập Mục tiêu ưu tiên.")

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

  /* ------------------------- UI --------------------------- */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Nghề nghiệp */}
      <div>
        <label className="font-medium block">Nghề nghiệp lựa chọn</label>
        <input
          type="text"
          className="mt-1 w-full rounded border p-2"
          value={job}
          onChange={e => setJob(e.target.value)}
          placeholder="VD: Chuyên viên nhân sự"
        />
      </div>

      {/* Mục tiêu ưu tiên */}
      <div>
        <label className="font-medium block">
          Những mục tiêu ưu tiên và quan trọng nhất để đạt được nghề nghiệp yêu thích
        </label>
        <textarea
          className="mt-1 w-full rounded border p-2 h-24"
          value={goals}
          onChange={e => setGoals(e.target.value)}
          placeholder="VD: Hoàn thành chứng chỉ HRBP trong 6 tháng…"
        />
      </div>

      {/* Hoạt động ưu tiên */}
      <div>
        <label className="font-medium block">
          Hoạt động ưu tiên và quan trọng để đạt được nghề nghiệp yêu thích
        </label>
        <textarea
          className="mt-1 w-full rounded border p-2 h-24"
          value={activities}
          onChange={e => setActivities(e.target.value)}
          placeholder="VD: Tham gia khoá HR Analytics, networking nhóm HR Friday…"
        />
      </div>

      {/* Ngày bắt đầu / hoàn thành */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium block">Thời gian bắt đầu</label>
          <input
            type="date"
            className="mt-1 w-full rounded border p-2"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="font-medium block">Thời gian hoàn thành</label>
          <input
            type="date"
            className="mt-1 w-full rounded border p-2"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Người hỗ trợ */}
      <div>
        <label className="font-medium block">Người hỗ trợ / đồng hành</label>
        <input
          type="text"
          className="mt-1 w-full rounded border p-2"
          value={supporter}
          onChange={e => setSupporter(e.target.value)}
          placeholder="VD: Anh A (Mentor), Chị B (Leader)…"
        />
      </div>

      {/* Save button */}
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
