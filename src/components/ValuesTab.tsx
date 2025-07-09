/* ------------- Tab 2 : Giá trị cốt lõi (client component) ------------- */
"use client";

import { useEffect, useState } from "react";
import { Combobox }             from "@headlessui/react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { createClientComponentClient }
        from "@supabase/auth-helpers-nextjs";

const MAX = 10;                           // chọn tối đa 10 giá trị

export default function ValuesTab() {
  const supa = createClientComponentClient();

  /* ------------------- state ------------------- */
  const [suggest, setSuggest] = useState<string[]>([]);
  const [chosen , setChosen ] = useState<string[]>([]);
  const [query  , setQuery  ] = useState("");

  /* ------------------- load data ------------------- */
  useEffect(() => {
    (async () => {
      // ① gợi ý tiếng Việt
      const { data } = await supa
        .from("lookup_values")
        .select("vi")
        .order("vi");
      setSuggest(Array.from(new Set((data ?? []).map(r => r.vi))));

      // ② giá trị đã lưu
      const saved: string[] =
        await fetch("/api/knowdell?part=values").then(r => r.json());
      setChosen(saved);
    })();
  }, []);

  /* ------------------- helper add / remove ------------------- */
  const add = (v?: string) => {
    const val = v?.trim();
    if (!val || chosen.includes(val) || chosen.length >= MAX) return;
    setChosen(c => [...c, val]);
    setQuery("");
  };

  const remove = (v: string) =>
    setChosen(c => c.filter(x => x !== v));

  const filtered =
    query === ""
      ? suggest.filter(s => !chosen.includes(s))
      : suggest.filter(
          s =>
            !chosen.includes(s) &&
            s.toLowerCase().includes(query.toLowerCase())
        );

  /* ------------------- save ------------------- */
  async function save() {
    const ok = await fetch("/api/knowdell", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ values: chosen }),
    }).then(r => r.ok);

    alert(ok ? "Đã lưu thành công!" : "Có lỗi, thử lại.");
  }

  /* ------------------- JSX ------------------- */
  return (
    <div className="space-y-6">
      <p>
        Đã chọn <b>{chosen.length}/{MAX}</b> giá trị / TOP&nbsp;10.
      </p>

      {/* ô tìm kiếm */}
      <Combobox
        value={query}
        onChange={add}
        disabled={chosen.length >= MAX}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full border rounded px-3 py-2"
            placeholder={
              chosen.length >= MAX ? "Đã đủ 10 giá trị" : "Gõ để tìm…"
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

      {/* tag đã chọn */}
      <ul className="flex flex-wrap gap-2">
        {chosen.map(v => (
          <li
            key={v}
            className="flex items-center bg-indigo-100 px-3 py-1 rounded"
          >
            {v}
            <button onClick={() => remove(v)} className="ml-1">
              <XMarkIcon
                className="w-4 h-4 text-indigo-700 hover:text-red-600"
              />
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
