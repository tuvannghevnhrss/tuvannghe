import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  PlayCircleIcon,
  SignalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { INTERVIEW_PACKAGES } from "@/lib/constants";
import ContinuePracticeCard from "@/components/interview/ContinuePracticeCard";
import ModuleQuotaBadge from "@/components/interview/ModuleQuotaBadge";

export const metadata: Metadata = {
  title: "Luyện phỏng vấn AI | Mock interview, live AI, realtime",
  description:
    "Luyện phỏng vấn AI theo từng mức độ: ghi âm, live AI theo lượt hỏi đáp và realtime. Có feedback, lịch sử và lộ trình luyện tập rõ ràng.",
};

const modules = [
  {
    title: "Module 1",
    subtitle: "Ghi âm và nhận feedback AI",
    href: "/interview/module-1",
    icon: MicrophoneIcon,
    text: "Phù hợp để luyện câu trả lời ngắn, sửa mở đầu, chỉnh cấu trúc và tăng độ rõ ý trước khi đi sâu hơn.",
    moduleKey: "module1" as const,
  },
  {
    title: "Module 2",
    subtitle: "Live AI theo lượt hỏi đáp",
    href: "/interview/module-2",
    icon: SignalIcon,
    text: "Tạo cảm giác gần hơn với phỏng vấn thật: AI đặt câu hỏi, bạn trả lời từng lượt và được dẫn dắt theo ngữ cảnh.",
    moduleKey: "module2" as const,
  },
  {
    title: "Module 3",
    subtitle: "Giả lập thực tiễn",
    href: "/interview/module-3",
    icon: PlayCircleIcon,
    text: "Dành cho giai đoạn cần luyện cường độ cao trước buổi phỏng vấn thật, đặc biệt khi đang vào vòng tuyển dụng.",
    moduleKey: "module3" as const,
  },
];

const faqs = [
  {
    q: "Module 1, 2 và 3 khác nhau như thế nào?",
    a: "Module 1 tập trung ghi âm và feedback nhanh. Module 2 cho trải nghiệm hỏi đáp theo lượt với AI. Module 3 là bản mô phỏng thực tiễn hơn, dành cho giai đoạn cần luyện cường độ cao trước buổi phỏng vấn thật.",
  },
  {
    q: "Tôi nên bắt đầu từ module nào?",
    a: "Nếu mới bắt đầu, nên đi từ Module 1 để chỉnh cách trả lời. Nếu đã có nền tảng và muốn giống buổi phỏng vấn hơn, hãy sang Module 2. Khi cần luyện sát vòng tuyển dụng, chọn Module 3.",
  },
  {
    q: "Có cần chuẩn bị CV hoặc JD trước không?",
    a: "Không bắt buộc, nhưng có JD và tóm tắt CV sẽ giúp AI cá nhân hóa câu hỏi sát với vị trí ứng tuyển hơn.",
  },
  {
    q: "Phỏng vấn AI có dùng được trên điện thoại không?",
    a: "Có. Trang này được thiết kế để chạy trên desktop và mobile, nhưng trải nghiệm tốt nhất vẫn là desktop khi bạn cần nhìn video và transcript cùng lúc.",
  },
  {
    q: "Sau khi luyện xong tôi xem lại kết quả ở đâu?",
    a: "Bạn có thể xem ở trang kết quả và dashboard phỏng vấn AI để theo dõi điểm số, transcript và tiến trình cải thiện qua từng buổi.",
  },
];

const interviewFaqJsonLd = {
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

export default function InterviewHubPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f5f7fb_0%,#ffffff_20%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <SparklesIcon className="h-4 w-4" />
              Trung tâm Phỏng vấn AI
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Luyện phỏng vấn AI theo từng module rõ ràng
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Khu vực này được thiết kế để giúp bạn chuyển từ “biết mình hợp nghề gì” sang “biết
              cách trả lời để được chọn”. Bắt đầu từ ghi âm, lên live AI, rồi tới giả lập gần với
              phỏng vấn thật nhất.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/interview/module-1"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Bắt đầu luyện ngay
              </Link>
              <Link
                href="/interview/dashboard"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xem tiến độ
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <ContinuePracticeCard />

            <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Lộ trình đề xuất
              </p>
              <div className="mt-5 space-y-4">
                {[
                  "1. Bắt đầu với Module 1 để sửa cách trả lời và tăng độ rõ ý.",
                  "2. Chuyển sang Module 2 để làm quen nhịp hỏi đáp như buổi phỏng vấn thật.",
                  "3. Dùng Module 3 khi cần luyện gấp trước vòng tuyển dụng quan trọng.",
                  "4. Theo dõi kết quả tại trang Tiến độ để biết mình đang cải thiện ở đâu.",
                ].map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Module</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Mỗi module giải quyết một giai đoạn khác nhau của việc luyện phỏng vấn
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-950">{module.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{module.subtitle}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{module.text}</p>
                  <div className="mt-4">
                    <ModuleQuotaBadge moduleKey={module.moduleKey} />
                  </div>
                  <Link
                    href={module.href}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Bắt đầu {module.title}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Giá trị</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Không chỉ luyện nói, mà còn luyện cách thể hiện đúng điều nhà tuyển dụng muốn nghe
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              "AI feedback tức thì sau từng buổi để bạn biết điểm mạnh và điểm nghẽn cụ thể.",
              "Câu hỏi có thể cá nhân hóa theo vị trí ứng tuyển, JD và bối cảnh thật của bạn.",
              "Kết quả được lưu lại theo thời gian để dễ nhìn ra xu hướng tiến bộ trước buổi phỏng vấn thật.",
            ].map((item) => (
              <div key={item} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                  <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Gói phù hợp</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Bắt đầu từ gói thấp, nâng cấp khi bạn cần luyện sâu hơn
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Hệ thống giá được thiết kế để người dùng dễ bắt đầu, sau đó nâng cấp khi đã vào giai
            đoạn ứng tuyển thật hoặc cần luyện cường độ cao hơn.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {INTERVIEW_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="rounded-[24px] bg-white/8 p-5">
                <p className="text-lg font-semibold">{pkg.name}</p>
                <p className="mt-2 text-sm text-emerald-300">{pkg.tagline}</p>
                <p className="mt-4 text-3xl font-bold">{pkg.price.toLocaleString("vi-VN")} đ</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {pkg.limits.module1} buổi Module 1 • {pkg.limits.module2} buổi Module 2 •{" "}
                  {pkg.limits.module3 === 0 ? "chưa gồm Module 3" : `${pkg.limits.module3} buổi Module 3`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Xem bảng giá
            </Link>
            <Link
              href="/interview/dashboard"
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Xem tiến độ
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Câu hỏi thường gặp về luyện phỏng vấn AI
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
            Chọn đúng gói rồi bắt đầu luyện ngay
          </h2>
          <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
            Nếu bạn muốn biết chi phí trước khi luyện, hãy xem bảng giá để chọn đúng module theo mức độ
            sẵn sàng của mình. Nếu đang ở giai đoạn định hướng, quay lại hub hướng nghiệp trước.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pricing" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Xem bảng giá
            </Link>
            <Link href="/career" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Quay lại hướng nghiệp
            </Link>
            <Link href="/interview/module-1" className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Bắt đầu Module 1
            </Link>
          </div>
        </section>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(interviewFaqJsonLd) }}
      />
    </div>
  );
}
