'use client'

import Link from 'next/link'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export default function HomePage() {
  const session = useSession()
  const supabase = useSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const user = session?.user
  const name = user?.user_metadata?.full_name || user?.email
  const avatar = user?.user_metadata?.avatar_url

  return (
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Hướng nghiệp AI</h1>
          <nav className="space-x-4 flex items-center">
            <a href="#mbti" className="text-gray-700 hover:text-indigo-600">MBTI</a>
            <a href="#holland" className="text-gray-700 hover:text-indigo-600">Holland</a>
            <a href="#gia-tri" className="text-gray-700 hover:text-indigo-600">Giá trị bản thân</a>
            <a href="#news" className="text-gray-700 hover:text-indigo-600">Tin tức</a>
            <a href="#faq" className="text-gray-700 hover:text-indigo-600">Chatbot/FAQ</a>

            {user ? (
              <div className="flex items-center space-x-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                    {name?.[0].toUpperCase()}
                  </div>
                )}

                <span className="text-gray-800">{name}</span>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Nội dung trang chủ (giữ nguyên 6 section cũ) */}
      <main>
        {/* Section MBTI */}
        <section id="mbti" className="py-16 px-4 bg-white text-center">
          <h2 className="text-3xl font-semibold mb-4">Trắc nghiệm MBTI</h2>
          <p className="text-gray-600 mb-6">Khám phá tính cách của bạn qua 60 câu hỏi trắc nghiệm MBTI.</p>
          <Link href="/mbti-test" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700">Bắt đầu làm bài</Link>
        </section>

        {/* Section Holland */}
        <section id="holland" className="py-16 px-4 bg-gray-100 text-center">
          <h2 className="text-3xl font-semibold mb-4">Trắc nghiệm Holland</h2>
          <p className="text-gray-600 mb-6">Khám phá nhóm nghề nghiệp phù hợp với bạn qua trắc nghiệm Holland RIASEC.</p>
          <Link href="/holland-test" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700">Bắt đầu trắc nghiệm</Link>
        </section>

        {/* Section Giá trị bản thân */}
        <section id="gia-tri" className="py-16 px-4 bg-white text-center">
          <h2 className="text-3xl font-semibold mb-4">Bạn đang mông lung?</h2>
          <p className="text-gray-600 mb-6">Khám phá giá trị bản thân để tìm ra hướng đi phù hợp nhất với bạn.</p>
          <Link href="/tim-gia-tri" className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700">Tìm giá trị bản thân</Link>
        </section>

        {/* Section Tin tức */}
        <section id="news" className="py-16 px-4 bg-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6 text-center">Tin tức nghề nghiệp & phát triển bản thân</h2>
            <ul className="space-y-4">
              <li className="bg-white p-4 rounded shadow">
                <a href="#" className="text-lg font-bold text-indigo-700 hover:underline">
                  MBTI: 16 nhóm tính cách và ứng dụng trong định hướng nghề
                </a>
              </li>
              <li className="bg-white p-4 rounded shadow">
                <a href="#" className="text-lg font-bold text-indigo-700 hover:underline">
                  Khám phá sở thích nghề nghiệp với Holland RIASEC
                </a>
              </li>
              <li className="bg-white p-4 rounded shadow">
                <a href="#" className="text-lg font-bold text-indigo-700 hover:underline">
                  Làm thế nào để tìm ra giá trị cốt lõi trong cuộc sống?
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* Section Chatbot/FAQ */}
        <section id="faq" className="py-16 px-4 bg-white text-center">
          <h2 className="text-3xl font-semibold mb-6">Cần được tư vấn?</h2>
          <p className="text-gray-600 mb-6">Trò chuyện với chatbot của chúng tôi để được hỗ trợ cá nhân hóa.</p>
          <Link href="/chat" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700">Bắt đầu trò chuyện</Link>
        </section>
      </main>
    </div>
  )
}
