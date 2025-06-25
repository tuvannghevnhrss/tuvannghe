// src/components/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-16">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Tư vấn nghề nghiệp AI – Khai phá tiềm năng của bạn
        </h1>
        <p className="mb-8 text-lg md:text-xl">
          Trắc nghiệm MBTI, Holland, khám phá giá trị bản thân, và chat với AI –
          tất cả trong một nền tảng.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/mbti">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">
              Bắt đầu MBTI
            </button>
          </Link>
          <Link href="/holland">
            <button className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Bắt đầu Holland
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
