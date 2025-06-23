// src/pages/holland.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';

type Question = { id: number; question: string; category: string };

export default function HollandPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/holland/questions')
      .then(res => res.json())
      .then(setQuestions)
      .catch(console.error);
  }, []);

  const handleAnswer = (id: number, score: number) => {
    setResponses(prev => ({ ...prev, [id]: score }));
  };

  const handleSubmit = async () => {
    if (!session) {
      alert(
        'Bạn chưa đăng nhập. Kết quả sẽ không lưu vào hệ thống, nhưng bạn có thể tiếp tục chat.'
      );
      router.push('/chat');
      return;
    }

    const payload = {
      user_id: session.user.id,
      responses: Object.entries(responses).map(([qid, score]) => ({
        question_id: Number(qid),
        score
      }))
    };

    try {
      const res = await fetch('/api/holland/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const { profile } = await res.json();
        alert('Xong! Điểm Holland của bạn:\n' + JSON.stringify(profile));
        router.push('/chat');
      } else {
        const err = await res.json();
        alert('Lỗi: ' + (err.error || 'Không xác định'));
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-center">Trắc nghiệm Holland</h1>
      </header>

      {/* Nội dung chính có scroll */}
      <main className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full space-y-6">
        {questions.map(q => {
          const sel = responses[q.id];
          return (
            <div key={q.id} className="bg-white rounded-lg p-4 shadow">
              <p className="font-medium text-gray-800">
                {q.id}. {q.question}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: '32px',
                  marginTop: 12,
                  marginLeft: 40
                }}
              >
                <button
                  onClick={() => handleAnswer(q.id, 1)}
                  style={{
                    minWidth: 120,
                    padding: '8px 24px',
                    borderRadius: 8,
                    backgroundColor: sel === 1 ? '#2563EB' : '#E5E7EB',
                    color: sel === 1 ? '#FFFFFF' : '#1F2937',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Rất thích
                </button>
                <button
                  onClick={() => handleAnswer(q.id, 0)}
                  style={{
                    minWidth: 120,
                    padding: '8px 24px',
                    borderRadius: 8,
                    backgroundColor: sel === 0 ? '#2563EB' : '#E5E7EB',
                    color: sel === 0 ? '#FFFFFF' : '#1F2937',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Không thích
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Nút Hoàn thành cố định ở dưới */}
      <footer style={{ marginTop: '40px' }} className="pb-4 px-4 bg-white shadow">
        <button
          disabled={
            questions.length === 0 ||
            Object.keys(responses).length !== questions.length
          }
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 24,
            backgroundColor:
              questions.length > 0 &&
              Object.keys(responses).length === questions.length
                ? '#16A34A'
                : '#6B7280',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            opacity:
              questions.length > 0 &&
              Object.keys(responses).length === questions.length
                ? 1
                : 0.5
          }}
        >
          Hoàn thành
        </button>
      </footer>
    </div>
  );
}
