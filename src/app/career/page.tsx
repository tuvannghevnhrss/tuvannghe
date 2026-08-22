import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Hướng nghiệp AI, MBTI, Holland, Knowdell | Chọn nghề phù hợp",
  description:
    "Khám phá bản thân với MBTI, Holland, Giá trị bản thân và hồ sơ tổng hợp để chọn nghề phù hợp, định hướng học tập và phát triển sự nghiệp rõ ràng hơn.",
};

const tools = [
  {
    title: "MBTI",
    href: "/mbti",
    eyebrow: "Bắt đầu miễn phí",
    description:
      "Hiểu xu hướng tính cách, cách ra quyết định và môi trường làm việc dễ phát huy hơn.",
    bullets: [
      "Phù hợp để bắt đầu hành trình hướng nghiệp",
      "Nhanh, dễ tiếp cận, không cần thanh toán",
      "Tạo nền cho các phân tích tiếp theo",
    ],
  },
  {
    title: "Holland",
    href: "/holland",
    eyebrow: "Nhóm nghề phù hợp",
    description:
      "Đi sâu vào sở thích nghề nghiệp để nhìn rõ kiểu công việc và nhóm ngành phù hợp hơn.",
    bullets: [
      "Mô hình RIASEC quen thuộc",
      "Tốt khi đang phân vân giữa nhiều nhóm nghề",
      "Có thể kết hợp với Knowdell để quyết định sâu hơn",
    ],
  },
  {
    title: "Giá trị bản thân",
    href: "/knowdell",
    eyebrow: "Điều gì quan trọng với bạn",
    description:
      "Hiểu động lực nghề nghiệp cốt lõi để tránh chọn việc chỉ vì xu hướng hoặc áp lực xung quanh.",
    bullets: [
      "Làm rõ điều kiện làm việc phù hợp",
      "Hữu ích khi chọn nghề lâu dài",
      "Đặc biệt quan trọng với người muốn chuyển hướng",
    ],
  },
];

const faqs = [
  {
    q: "Nên bắt đầu từ MBTI, Holland hay Knowdell?",
    a: "Nếu bạn chưa rõ mình hợp kiểu môi trường nào, hãy bắt đầu từ MBTI để có điểm khởi đầu nhanh. Sau đó làm Holland để xem nhóm nghề phù hợp, rồi dùng Knowdell để chốt giá trị ưu tiên khi chọn nghề.",
  },
  {
    q: "Trang hướng nghiệp này phù hợp với ai?",
    a: "Phù hợp với học sinh, sinh viên, người mới đi làm và cả người đang muốn chuyển hướng nghề nghiệp nhưng chưa chắc chắn về điểm mạnh của mình.",
  },
  {
    q: "Làm xong MBTI có đủ để chọn nghề chưa?",
    a: "MBTI giúp bạn hiểu xu hướng tính cách và cách làm việc, nhưng nên kết hợp thêm Holland và Knowdell để có quyết định sát thực tế hơn.",
  },
  {
    q: "Tôi đã có kinh nghiệm đi làm rồi, có cần làm hướng nghiệp nữa không?",
    a: "Có. Hướng nghiệp không chỉ dành cho người mới bắt đầu mà còn hữu ích khi bạn muốn đổi ngành, đổi môi trường hoặc xác định lộ trình phát triển rõ hơn.",
  },
  {
    q: "Sau khi xem kết quả, tôi nên làm gì tiếp?",
    a: "Bạn có thể chuyển sang luyện phỏng vấn AI để biến định hướng thành kỹ năng trả lời cụ thể khi ứng tuyển.",
  },
];

const careerFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function CareerHubPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f6f8f2_0%,#ffffff_20%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <SparklesIcon className="h-4 w-4" />
              Hub hướng nghiệp
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Hướng nghiệp AI để hiểu bản thân và chọn nghề phù hợp
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Đây là nơi gom toàn bộ các công cụ hướng nghiệp của website vào một hành trình logic:
              hiểu tính cách, xác định nhóm nghề phù hợp, làm rõ giá trị bản thân và kết nối kết
              quả đó với hồ sơ phát triển cá nhân.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mbti"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Bắt đầu với MBTI
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xem bảng giá tổng
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Hành trình đề xuất
            </p>
            <div className="mt-5 space-y-4">
              {[
                "1. Làm MBTI để có ảnh chụp ban đầu về tính cách.",
                "2. Làm Holland để nhìn rõ nhóm nghề phù hợp.",
                "3. Làm Giá trị bản thân để biết điều gì cần ưu tiên khi chọn việc.",
                "4. Xem hồ sơ tổng hợp và chuyển sang luyện phỏng vấn AI khi đã xác định mục tiêu.",
              ].map((step) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Công cụ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Mỗi công cụ trả lời một câu hỏi khác nhau về nghề nghiệp
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {tools.map((tool) => (
              <article key={tool.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {tool.eyebrow}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{tool.description}</p>
                <ul className="mt-5 space-y-3">
                  {tool.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link href={tool.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Đi tới {tool.title}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Bước tiếp theo</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Khi đã rõ mục tiêu, hãy chuyển sang luyện phỏng vấn với AI
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Phần hướng nghiệp giúp bạn chọn đúng đích đến. Phần phỏng vấn AI giúp bạn thể hiện bản
            thân tốt hơn khi ứng tuyển thật. Hai phần này nên đi liền với nhau.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/interview"
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Mở Interview Suite
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Xem bảng giá
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Câu hỏi thường gặp về hướng nghiệp AI
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-950">
                  <span>{faq.q}</span>
                  <span className="text-2xl leading-none text-emerald-600">+</span>
                </summary>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-emerald-200 bg-emerald-50 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Đi tiếp</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">
            Chọn công cụ phù hợp rồi quay lại luyện phỏng vấn AI
          </h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
            MBTI, Holland và Knowdell giúp bạn hiểu bản thân trước. Khi đã rõ hướng đi, hãy chuyển sang
            khu luyện phỏng vấn để biến định hướng thành câu trả lời thuyết phục hơn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mbti" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Đi tới MBTI
            </Link>
            <Link href="/holland" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Đi tới Holland
            </Link>
            <Link href="/interview" className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Luyện phỏng vấn AI
            </Link>
          </div>
        </section>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(careerFaqJsonLd) }}
      />
    </div>
  );
}
