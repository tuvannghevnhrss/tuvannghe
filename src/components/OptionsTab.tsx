"use client";
import { useState } from "react";

export default function OptionsTab({ initialJobs }:{initialJobs:string[]}) {
  const [loading,setLoading]=useState(false);
  const [jobs,setJobs]      =useState(initialJobs);
  const [error,setError]    =useState<string|null>(null);

  const run = async()=>{
    if(loading) return;
    setLoading(true); setError(null);
    try{
      const r = await fetch("/api/career/analyse",{method:"POST"});
      const json = await r.json();
      if(!r.ok) throw new Error(json.error||"Fail");
      setJobs(json.jobs||[]);
      if((json.jobs||[]).length===0) setError("GPT không đề xuất nghề.");
    }catch(e:any){
      setError(e.message||"Phân tích thất bại.");
    }finally{ setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <button onClick={run} disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50">
        {loading?"Đang phân tích…":"Phân tích kết hợp"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      {jobs.length>0 && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {jobs.map(j=><li key={j}>{j}</li>)}
        </ul>
      )}
    </div>
  );
}
