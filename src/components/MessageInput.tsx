"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!value.trim() || loading) return;
    setLoading(true);
    await onSend(value.trim());
    setValue("");
    setLoading(false);
  }

  return (
    <div className="border-t p-3 flex gap-2">
      <input
        className="flex-1 rounded-md border px-4 py-2 text-sm"
        placeholder="Hỏi huongnghiep.ai"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button
        onClick={submit}
        disabled={loading}
        className={cn(
          "h-8 w-8 rounded-full grid place-items-center text-white transition-colors",
          loading ? "bg-muted" : "bg-primary hover:bg-primary/90"
        )}
      >
        →
      </button>
    </div>
  );
}
