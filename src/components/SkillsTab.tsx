/* ------------- Tab “Kỹ năng động lực” ------------- */
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Combobox } from "@headlessui/react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const MAX = 15;          // Strong Skills chọn 12-15

export default function SkillsTab() {
  const supa = createClientComponentClient();

  const [suggest, setSuggest] = useState<string[]>([]);
  const [chosen , setChosen ] = useState<string[]>([]);
  const [query  , setQuery  ] = useState("");

  /* load lookup + dữ liệu đã lưu */
  useEffect(() => {
    (async () => {
      const { data } = await supa
        .from("lookup_skills")
        .select("vi")
        .order("vi");
      setSuggest(Array.from(new Set((data ?? []).map(r => r.vi))));

      const saved: string[] =
        await fetch("/api/knowdell?part=skills").then(r => r.json());
      setChosen(saved);
    })();
  }, []);

  /* thêm / xoá */
  const add = (v?: string) => {
    const val = v?.trim();
    if (!val || chosen.includes(val) || chosen.length >= MAX) return;
    setChosen(c => [...c, val]);
    setQuery("");
  };
  const remove = (v: string) => setChosen(c => c.filter(x => x !== v));

  const filtered =
    query === ""
      ? suggest.filter(s => !chosen.includes(s))
      : suggest.filter(
          s =>
            !chosen.includes(s) &&
            s.toLowerCase().includes(query.toLowerCase())
        );

  /* save */
  async function save() {
    const ok = await fetch("/api/knowdell", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({
        skills: chosen.map(k => ({
          key  : k,
          love : 5,     // tạm cho 5/5 (thích)
          pro  : 3      // tạm 3/5 (giỏi)
        }))
      }),
    }).then(r => r.ok);

    alert(ok ? "Đã lưu!" : "Lỗi, thử lại");
  }

  return (
    <div className="space-y-6">
      <p>
        Đã chọn <b>{chosen.length}/{MAX}</b> kỹ năng động lực (TOP&nbsp;15).
      </p>

      {/* search box */}
      <Combobox
        value={query}
        onChange={add}
        disabled={chosen.length >= MAX}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full border rounded px-3 py-2"
            placeholder={
              chosen.length >= MAX ? "Đã đủ 15 kỹ năng" : "Gõ để tìm…"
            }
            onChange={e => setQuery(e.target.value)}
          />
          {filtered.length > 0 && (
            <Combobox.Options
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto
                         bg-white rounded shadow"
            >
              {filtered.map(opt => (
                <Combobox.Option
                  key={opt}
                  value={opt}
                  className={({ active }) =>
                    `cursor-pointer px-3 py-2 flex items-center gap-2 ${
                      active ? "bg-indigo-600 text-white" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      {selected && <CheckIcon className="w-4" />} {opt}
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
      </Combobox>

      {/* tag list */}
      <ul className="flex flex-wrap gap-2">
        {chosen.map(v => (
          <li
            key={v}
            className="flex items-center bg-indigo-100 px-3 py-1 rounded"
          >
            {v}
            <button onClick={() => remove(v)} className="ml-1">
              <XMarkIcon className="w-4 h-4 text-indigo-700 hover:text-red-600"/>
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={save}
        disabled={chosen.length === 0}
        className="px-6 py-2 bg-emerald-600 text-white rounded
                   disabled:opacity-40"
      >
        Lưu &amp; tiếp tục
      </button>
    </div>
  );
}
