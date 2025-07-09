"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatClient() {
  const params = useSearchParams();
  const [input, setInput] = useState("");

  /* ví dụ nhỏ – tuỳ logic thực tế của anh/chị */
  useEffect(() => {
    const q = params.get("q");
    if (q) setInput(q);
  }, [params]);

  return (
    <section className="p-4">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 w-full"
        placeholder="Nhập tin nhắn…"
      />
    </section>
  );
}
