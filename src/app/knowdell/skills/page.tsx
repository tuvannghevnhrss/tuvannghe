"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

type Skill = { skill_key: string; vi: string };
const LIMIT = 15;

export default function KnowdellSkills() {
  const supabase = createClientComponentClient();
  const router   = useRouter();

  const [list,   setList]   = useState<Skill[]>([]);
  const [picked, setPicked] = useState<Record<string,{ love:number; pro:number }>>({});

  useEffect(() => {
    supabase.from("lookup_skills").select("*").order("vi")
      .then(({ data }) => setList(data as Skill[]));
  }, []);

  const toggle = (k:string)=>
    setPicked(o =>
      k in o           ? (()=>{const c={...o};delete c[k];return c;})()
      : Object.keys(o).length < LIMIT ? { ...o, [k]:{ love:5,pro:3 } }
      : o
    );

  function next() {
    if (Object.keys(picked).length !== LIMIT) return alert(`Chọn đủ ${LIMIT} kỹ năng`);
    localStorage.setItem("kv_skills", JSON.stringify(
      Object.entries(picked).map(([key,val])=>({ key,...val }))
    ));
    router.push("/knowdell/interests");
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Chọn 15 kỹ năng bạn THÍCH & GIỎI nhất</h1>
      <p className="text-sm text-gray-600">Đã chọn <b>{Object.keys(picked).length}</b>/{LIMIT}</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1">
          {list.filter(s=>!(s.skill_key in picked)).map(s=>(
            <button key={s.skill_key}
              onClick={()=>toggle(s.skill_key)}
              disabled={Object.keys(picked).length===LIMIT}
              className="w-full text-left px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-30">
              {s.vi}
            </button>
          ))}
        </div>

        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1 bg-teal-50">
          {Object.keys(picked).map(k=>(
            <button key={k}
              onClick={()=>toggle(k)}
              className="w-full text-left px-3 py-1 rounded hover:bg-teal-100">
              {list.find(s=>s.skill_key===k)?.vi}
            </button>
          ))}
          {Object.keys(picked).length===0 && <p className="italic text-gray-500">Chưa chọn</p>}
        </div>
      </div>

      <button onClick={next}
        disabled={Object.keys(picked).length!==LIMIT}
        className="mt-6 px-6 py-2 rounded bg-teal-600 text-white disabled:opacity-50">
        Tiếp tục
      </button>
    </div>
  );
}
