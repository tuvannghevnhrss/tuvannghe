"use client";

import Link from "next/link";
import {
  ArrowRightCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export default function MbtiLanding() {
  return (
    <main className="pb-24 bg-white text-gray-800">
      {/* ====== Hero + CTA ====== */}
      <section className="relative bg-gradient-to-br from-indigo-50 to-white py-28">
        <div className="container mx-auto flex flex-col items-center px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Khám phá tính cách MBTI của bạn
          </h1>
          <p className="max-w-xl mb-8 text-lg text-gray-600">
            60 câu hỏi • 2 phút • Báo cáo cá nhân hoá hoàn toàn
            <br />
            <span className="font-medium">Miễn phí</span> – bắt đầu ngay!
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Đăng nhập & bắt đầu
            <ArrowRightCircleIcon className="h-6 w-6" />
          </Link>
        </div>
      </section>

      {/* ====== MBTI là gì + lợi ích ====== */}
      <section className="container mx-auto px-6 mt-20 space-y-16">
        <article className="space-y-6">
          <h2 className="text-3xl font-bold">MBTI là gì?</h2>
          <p className="text-gray-700">
            MBTI (Myers-Briggs Type Indicator) phân loại tính cách thành{" "}
            <strong>16 nhóm</strong> dựa trên 4 cặp khuynh hướng:{" "}
            <strong>E–I, S–N, T–F, J–P</strong>. Biết “mã tính cách” giúp bạn:
          </p>
          <ul className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: <UserGroupIcon className="h-6 w-6 text-indigo-600" />,
                title: "Hiểu bản thân & giao tiếp tốt hơn",
              },
              {
                icon: <SparklesIcon className="h-6 w-6 text-indigo-600" />,
                title: "Chọn nghề & môi trường làm việc phù hợp",
              },
              {
                icon: <AcademicCapIcon className="h-6 w-6 text-indigo-600" />,
                title: "Tối ưu lộ trình học tập – phát triển",
              },
              {
                icon: <ArrowRightCircleIcon className="h-6 w-6 text-indigo-600" />,
                title: "Tăng sức cạnh tranh khi phỏng vấn",
              },
            ].map(({ icon, title }) => (
              <li key={title} className="flex items-start gap-3 rounded-lg bg-indigo-50 p-4">
                {icon}
                <span className="font-medium text-gray-800">{title}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* ====== Quy trình 3 bước ====== */}
      <section className="container mx-auto px-6 mt-20 text-center space-y-6">
        <h2 className="text-3xl font-bold">Tham gia chỉ trong 3 bước</h2>
        <ol className="mx-auto grid gap-6 md:grid-cols-3 max-w-4xl">
          {[
            "Đăng nhập tài khoản",
            "Trả lời 60 câu hỏi",
            "Nhận báo cáo về tính cách của bạn",
          ].map((step, idx) => (
            <li
              key={step}
              className="relative rounded-xl border p-6 pt-10"
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                {idx + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
