"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewForm() {
  // ──────────────────────────────── state
  const [cv,  setCv]  = useState("");
  const [jd,  setJd]  = useState("");
  const [req, setReq] = useState("");   // NEW: yêu cầu công việc
  const router = useRouter();

  // ──────────────────────────────── handler
  async function handleStart() {
    const res = await fetch("/api/interview/generateQuestions", {
    method: "POST",
    body: JSON.stringify({ cv, jd, req }),
  });
  const data = await res.json();

  if (!res.ok) {
    alert("Lỗi: " + (data.error || "Máy chủ không phản hồi"));
    return;
  }
  router.push(`/interview/room/${data.roomId}`);
}

  // ──────────────────────────────── UI
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Thực hành phỏng vấn
      </h1>

      <div className="flex flex-col gap-6">
        {/* CV textarea */}
        <div className="flex flex-col gap-2">
          <label className="font-medium" htmlFor="cv">
            Kinh nghiệm &amp; thành tựu nổi bật<span className="text-red-500">*</span>
          </label>
          <textarea
            id="cv"
            required
            className="textarea textarea-bordered h-40 resize-none"
            placeholder="VD: 2 năm làm Marketing, tăng 30% traffic web..."
            onChange={(e) => setCv(e.target.value)}
          />
        </div>

        {/* JD textarea */}
        <div className="flex flex-col gap-2">
          <label className="font-medium" htmlFor="jd">
            JD vị trí mơ ước<span className="text-red-500">*</span>
          </label>
          <textarea
            id="jd"
            required
            className="textarea textarea-bordered h-40 resize-none"
            placeholder="Dán / mô tả JD của công việc mong muốn..."
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {/* NEW – Job requirements textarea */}
        <div className="flex flex-col gap-2">
          <label className="font-medium" htmlFor="req">
            Yêu cầu công việc<span className="text-red-500">*</span>
          </label>
          <textarea
            id="req"
            required
            className="textarea textarea-bordered h-40 resize-none"
            placeholder="VD: kỹ năng, chứng chỉ, ngoại ngữ… mà công việc yêu cầu"
            onChange={(e) => setReq(e.target.value)}
          />
        </div>

        {/* Start button */}
        <button
          disabled={!cv || !jd || !req}
          onClick={handleStart}
          className="w-full rounded-lg border
                     bg-indigo-600 py-3 text-white font-medium
                     transition-colors duration-200
                     hover:bg-indigo-700 active:bg-indigo-800
                     disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bắt đầu phỏng vấn
        </button>
      </div>
    </main>
  );
}
