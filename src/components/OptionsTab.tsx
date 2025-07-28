/* ----------------------------------------------------------------- *
   Tab 2 – LỰA CHỌN
 * ----------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import AnalysisCard from './AnalysisCard';

export default function OptionsTab ({
  canAnalyse ,          // = đã có dữ liệu traits
  hasAnalysed,          // = career_profiles.knowdell_summary != null
}: { canAnalyse:boolean; hasAnalysed:boolean })
{
  const [loading,setLoading] = useState(false);
  const [err    ,setErr    ] = useState<string|null>(null);
  const [show   ,setShow   ] = useState(hasAnalysed);

  async function runAnalyse () {
    if (!canAnalyse || loading || hasAnalysed) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/career/analyse',{ method:'POST' });
      const js  = await res.json();
      if (!res.ok) throw new Error(js?.error || 'ERROR');
      setShow(true);
    } catch (e:any){
      console.error(e); setErr('Phân tích thất bại – thử lại sau.');
    } finally { setLoading(false); }
  }

  if (!canAnalyse)
    return <p className="rounded border bg-yellow-50 p-4 text-center">
      Hoàn tất <b>Holland</b> và <b>Knowdell</b> trước khi phân tích.
    </p>;

  return (
    <div className="space-y-6">
      <button
        onClick={runAnalyse}
        disabled={loading || hasAnalysed}
        className="rounded bg-indigo-600 px-6 py-2 text-white
                   disabled:opacity-50">
        {hasAnalysed ? 'Đã phân tích' :
         loading      ? 'Đang phân tích…' : 'Phân tích kết hợp'}
      </button>

      {err && <p className="text-red-600">{err}</p>}
      {show && <AnalysisCard />}
    </div>
  );
}
