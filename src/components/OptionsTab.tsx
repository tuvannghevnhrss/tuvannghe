/* -----------------------------------------------------------------
   Tab 2 – LỰA CHỌN
   Hiển thị ngay AnalysisCard nếu DB đã có kết quả; chỉ bấm nút
   “Phân tích kết hợp” khi CHƯA phân tích lần nào.
 * ----------------------------------------------------------------- */
"use client"

import { useState } from "react"
import AnalysisCard from "./AnalysisCard"

export default function OptionsTab ({
  canAnalyse ,          // = đã có dữ liệu traits (Holland + Knowdell)
  hasAnalysed,          // = career_profiles.knowdell_summary != null
}: {
  canAnalyse : boolean
  hasAnalysed: boolean
}) {
  /* ---------------------------- local state --------------------------- */
  const [loading , setLoading ] = useState(false)
  const [err     , setErr      ] = useState<string | null>(null)
  const [analysed, setAnalysed ] = useState(hasAnalysed)   // ← flag chính

  /* ---------------------- gọi API /api/career/analyse ---------------- */
  const runAnalyse = async () => {
    if (!canAnalyse || loading || analysed) return

    setLoading(true); setErr(null)
    try {
      const res = await fetch("/api/career/analyse", { method: "POST" })
      const js  = await res.json()
      if (!res.ok) throw new Error(js?.error || "ERROR")

      setAnalysed(true)                                  // ✅ đã có kết quả
    } catch (e: any) {
      console.error(e)
      setErr("Phân tích thất bại – thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------- UI render ----------------------------- */
  if (!canAnalyse)
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Hoàn tất <b>Holland</b> và <b>Knowdell</b> trước khi phân tích.
      </p>
    )

  return (
    <div className="space-y-6">
      {/* Nút chạy phân tích – ẩn / disable khi đã có kết quả */}
      <button
        onClick={runAnalyse}
        disabled={loading || analysed}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {analysed ? "Đã phân tích" : loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {err && <p className="text-red-600">{err}</p>}

      {/* Hiển thị kết quả nếu đã phân tích */}
      {analysed && <AnalysisCard />}
    </div>
  )
}
