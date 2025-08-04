/* -----------------------------------------------------------------
   Tab 2 – LỰA CHỌN (Options)
   Nếu DB đã có knowdell_summary + suggested_jobs ⇒ show ngay AnalysisCard
 * ----------------------------------------------------------------- */
"use client"

import { useEffect, useState } from "react"
import AnalysisCard from "./AnalysisCard"

export default function OptionsTab ({
  canAnalyse,      // = true khi user đã hoàn tất Holland + Knowdell
  hasAnalysed,     // giá trị server-side (có thể = false ở lần đầu)
}: {
  canAnalyse : boolean
  hasAnalysed: boolean
}) {
  /* ------------------------- state -------------------------- */
  const [analysed, setAnalysed] = useState(hasAnalysed)
  const [loading , setLoading ] = useState(false)
  const [error   , setError   ] = useState<string | null>(null)

  /* ---------------------------------------------------------- *
   * 1. Khi component mount, nếu chưa analysed  →  gọi API GET
   *    /api/profile/summary để kiểm tra lại (trung thực)
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!canAnalyse || analysed) return

    fetch("/api/profile/summary")
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.knowdell_summary && json?.suggested_jobs?.length) {
          setAnalysed(true)                    // ✅ có sẵn kết quả
        }
      })
      .catch(() => {/* bỏ qua lỗi */})
  }, [canAnalyse, analysed])

  /* ---------------------------------------------------------- *
   * 2. Gọi POST /api/career/analyse khi nhấn nút
   * ---------------------------------------------------------- */
  const runAnalyse = async () => {
    if (!canAnalyse || analysed || loading) return
    setLoading(true); setError(null)

    try {
      const res = await fetch("/api/career/analyse", { method: "POST" })
      const js  = await res.json()
      if (!res.ok) throw new Error(js?.error || "ERROR")

      setAnalysed(true)
    } catch (e: any) {
      console.error(e)
      setError("Phân tích thất bại – thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  /* --------------------------- UI --------------------------- */
  if (!canAnalyse)
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Hoàn tất <b>Holland</b> và <b>Knowdell</b> trước khi phân tích.
      </p>
    )

  return (
    <div className="space-y-6">
      {/* Nút phân tích – ẩn khi đã có kết quả */}
      {!analysed && (
        <button
          onClick={runAnalyse}
          disabled={loading}
          className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
        </button>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {/* Card kết quả */}
      {analysed && <AnalysisCard />}
    </div>
  )
}
