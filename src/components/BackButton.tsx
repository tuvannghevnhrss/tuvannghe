"use client";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
    >
      Quay lại
    </button>
  );
}
