/* ------------------------------------------------------------------------- *
   OptionsTab – nút “Phân tích kết hợp” & hiển thị kết quả GPT               *
 * ------------------------------------------------------------------------- */
"use client";
import { useState } from "react";

interface TopCareer {
  career       : string;
  salaryMedian : number;
  roadmap?     : { stage:string; skills:string }[];
}

interface ResultJSON {
  summary       : string;
  topCareers    : TopCareer[];
  careerRatings?: { career:string; fitLevel:string; reason:string }[];
}

export default function OptionsTab(){
  const [loading,setLoading]   = useState(false);
  const [data   ,setData   ]   = useState<ResultJSON|null>(null);
  const [error  ,setError  ]   = useState<string|null>(null);

  const run = async ()=>{
    if(loading) return;
    setLoading(true); setError(null);
    try{
      const r = await fetch("/api/career/analyse",{method:"POST"});
      if(!r.ok) throw new Error(await r.text());
      setData(await r.json());
    }catch(e:any){
      console.error(e); setError("Phân tích thất bại – thử lại sau.");
    }finally{ setLoading(false); }
  };

  return(
    <div className="space-y-6">
      <button
        onClick={run}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <>
          {/* 1. Summary */}
          <p className="p-4 rounded bg-gray-50 border">{data.summary}</p>

          {/* 3. TOP 5 nghề */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Nghề</th>
                  <th className="p-2 text-left whitespace-nowrap">Lương (triệu₫)</th>
                  <th className="p-2 text-left">Roadmap (rút gọn)</th>
                </tr>
              </thead>
              <tbody>
                {data.topCareers.map(c=>(
                  <tr key={c.career} className="border-b">
                    <td className="p-2">{c.career}</td>
                    <td className="p-2">{c.salaryMedian}</td>
                    <td className="p-2 text-xs">
                      {c.roadmap?.map(r=>`${r.stage}: ${r.skills}`).join(" | ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
