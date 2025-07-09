'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface GoalFormProps {
  initialWhat?: string;
  initialWhy?: string;
}

export default function GoalForm({ initialWhat = '', initialWhy = '' }: GoalFormProps) {
  const [what, setWhat] = useState(initialWhat);
  const [why, setWhy] = useState(initialWhy);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ what, why }),
    });
    if (res.ok) {
      // advance to the “plan” step
      router.push(`/profile?step=plan`);
    } else {
      console.error('Failed to save goal', await res.json());
      // you may want to show a UI error here
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow">
      <div>
        <label htmlFor="what" className="block font-medium">
          Mục tiêu (WHAT)
        </label>
        <textarea
          id="what"
          name="what"
          className="mt-1 w-full border rounded p-2"
          rows={3}
          value={what}
          onChange={(e) => setWhat(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="why" className="block font-medium">
          Lý do (WHY)
        </label>
        <textarea
          id="why"
          name="why"
          className="mt-1 w-full border rounded p-2"
          rows={3}
          value={why}
          onChange={(e) => setWhy(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Lưu &amp; sang bước kế
      </button>
    </form>
  );
}
