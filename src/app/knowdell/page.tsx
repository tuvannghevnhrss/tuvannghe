"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

type Value = { value_key: string; vi: string };
const LIMIT = 10;

export default function KnowdellValues() {
  const supabase = createClientComponentClient();
  const router   = useRouter();

  const [list,   setList]   = useState<Value[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("lookup_values").select("*").order("vi")
      .then(({ data }) => setList(data as Value[]));
  }, []);

  const toggle = (k: string) =>
    setPicked(p =>
      p.includes(k) ? p.filter(x => x !== k)
                    : p.length < LIMIT ? [...p, k] : p
    );

  function next() {
    if (picked.length !== LIMIT) return alert(`Hãy chọn đúng ${LIMIT}`);
    localStorage.setItem("kv_values", JSON.stringify(picked));
    router.push("/knowdell/skills");
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Chọn 10 giá trị nghề nghiệp quan trọng nhất</h1>
      <p className="text-sm text-gray-600">Đã chọn <b>{picked.length}</b>/{LIMIT}</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* chưa chọn */}
        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1">
          {list.filter(v=>!picked.includes(v.value_key)).map(v=>(
            <button key={v.value_key}
              onClick={()=>toggle(v.value_key)}
              disabled={picked.length===LIMIT}
              className="w-full text-left px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-30">
              {v.vi}
            </button>
          ))}
        </div>
        {/* đã chọn */}
        <div className="border rounded p-3 h-[420px] overflow-y-auto space-y-1 bg-indigo-50">
          {picked.map(k=>(
            <button key={k}
              onClick={()=>toggle(k)}
              className="w-full text-left px-3 py-1 rounded hover:bg-indigo-100">
              {list.find(v=>v.value_key===k)?.vi}
            </button>
          ))}
          {picked.length===0 && <p className="italic text-gray-500">Chưa chọn</p>}
        </div>
      </div>

      <button onClick={next}
        disabled={picked.length!==LIMIT}
        className="mt-6 px-6 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
        Tiếp tục
      </button>
    </div>
  );
}
