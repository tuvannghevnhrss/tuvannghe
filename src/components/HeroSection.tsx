// src/components/HeroSection.tsx
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-32">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-5xl font-extrabold mb-6">
          Tự tin khai phá bản thân với AI
        </h1>
        <p className="text-xl mb-8">
          MBTI, Holland, trò chơi Giá trị bản thân và Chat AI – tất cả trong một nền tảng
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/mbti">
            <button className="bg-white text-blue-600 px-8 py-3 rounded font-semibold hover:shadow-lg transition">
              Bắt đầu MBTI
            </button>
          </Link>
          <Link href="/holland">
            <button className="border border-white px-8 py-3 rounded font-semibold hover:bg-white hover:text-blue-600 transition">
              Bắt đầu Holland
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
