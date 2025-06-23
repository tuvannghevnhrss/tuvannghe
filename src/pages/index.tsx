// src/pages/index.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default function Home() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const session = useSession();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow p-4 flex items-center justify-between max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Hướng nghiệp AI</h1>
        <nav className="space-x-6">
          <Link href="/mbti-test" className="text-blue-600 hover:underline">MBTI</Link>
          <Link href="/holland" className="text-blue-600 hover:underline">Holland</Link>
          <Link href="/knowdell" className="text-blue-600 hover:underline">Giá trị bản thân</Link>
          <Link href="/news" className="text-blue-600 hover:underline">Tin tức</Link>
          <Link href="/chat" className="text-blue-600 hover:underline">Chatbot/FAQ</Link>
        </nav>
        {session?.user && (
          <div className="flex items-center space-x-2">
            {session.user.user_metadata.avatar_url && (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <button
              onClick={signOut}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-12">
        {/* MBTI */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Trắc nghiệm MBTI</h2>
          <p className="text-gray-600 mb-4">
            Khám phá tính cách của bạn qua 60 câu hỏi trắc nghiệm MBTI.
          </p>
          <Link href="/mbti-test" className="text-blue-600 hover:underline">
            Bắt đầu làm bài →
          </Link>
        </section>

        {/* Holland */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Trắc nghiệm Holland</h2>
          <p className="text-gray-600 mb-4">
            Khám phá nhóm nghề nghiệp phù hợp với bạn qua trắc nghiệm Holland RIASEC.
          </p>
          <Link href="/holland" className="text-blue-600 hover:underline">
            Bắt đầu trắc nghiệm →
          </Link>
        </section>

        {/* Các section khác y hệt cũ… */}
      </main>
    </div>
  );
}
