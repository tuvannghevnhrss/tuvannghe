"use client";

import { useState } from "react";

export default function SessionPage() {
  const [recording, setRecording] = useState(false);

  const startRecording = () => {
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Câu hỏi:</h2>
      <p className="my-4">Hãy giới thiệu bản thân</p>

      {!recording ? (
        <button onClick={startRecording} className="bg-green-500 px-4 py-2">
          🎤 Ghi âm
        </button>
      ) : (
        <button onClick={stopRecording} className="bg-red-500 px-4 py-2">
          ⏹ Dừng
        </button>
      )}

      <button className="ml-4 bg-purple-500 px-4 py-2">
        Next →
      </button>
    </div>
  );
}