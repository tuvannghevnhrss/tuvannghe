'use client';

import { useEffect, useState } from 'react';
import { useQuiz } from '@/context/quiz';
import { supabaseClient } from '@/lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';
import Link from 'next/link';

export default function ResultPage() {
  const { answers } = useQuiz();
  const session = useSession();
  const [mbtiType, setMbtiType] = useState<string>('');

  // Giả sử bạn đã có hàm tính MBTI:
  function calculateMbti(answers: Record<number, 'A'|'B'>): string {
    // ... logic của bạn ...
    return 'INTJ';
  }

  useEffect(() => {
    // 1) Tính loại MBTI
    const type = calculateMbti(answers);
    setMbtiType(type);

    // 2) Nếu đã login, lưu vào Supabase
    if (session?.user) {
      const supabase = supabaseClient();
      supabase
        .from('career_profiles')
        .upsert(
          { user_id: session.user.id, mbti_type: type },
          { onConflict: ['user_id'] }
        )
        .then(({ error }) => {
          if (error) console.error('Lưu MBTI lỗi:', error.message);
        });
    }
  }, [answers, session]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Kết quả MBTI của bạn</h2>
      <p className="text-xl mb-6">Bạn thuộc nhóm: <span className="font-mono text-2xl">{mbtiType}</span></p>
      <Link
        href="/chat"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Tiếp tục chat với AI
      </Link>
    </div>
  );
}
