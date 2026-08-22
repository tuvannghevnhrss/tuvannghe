"use client";

import { useEffect, useState } from "react";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch("/api/interview/questions")
      .then((res) => res.json())
      .then(setQuestions);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ngân hàng câu hỏi</h1>

      <div className="grid gap-4">
        {questions.map((q: any) => (
          <div key={q.id} className="p-4 border rounded-xl">
            <p className="font-semibold">{q.content}</p>
            <p className="text-sm text-gray-500">
              {q.job_title} - {q.level}
            </p>

            <button className="mt-2 bg-purple-500 text-white px-4 py-2 rounded">
              Luyện tập
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}