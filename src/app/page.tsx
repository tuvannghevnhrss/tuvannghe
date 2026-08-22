"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const journeySteps = [
  {
    title: "Hiểu rõ bản thân",
    text: "Bắt đầu với MBTI, Holland và Giá trị bản thân để nhìn rõ điểm mạnh, xu hướng nghề nghiệp và điều bạn thực sự ưu tiên khi chọn việc.",
  },
  {
    title: "Chọn hướng đi phù hợp",
    text: "Từ kết quả đã có, bạn dễ xác định ngành nghề, môi trường làm việc và lộ trình phát triển phù hợp hơn thay vì chọn theo cảm tính.",
  },
  {
    title: "Luyện phỏng vấn với AI",
    text: "Khi đã biết mình muốn gì, bạn có thể luyện trả lời thực tế hơn, nhận phản hồi ngay và tự tin hơn trước buổi phỏng vấn thật.",
  },
];

const careerTools = [
  {
    title: "MBTI",
    href: "/mbti",
    desc: "Bài test phù hợp để bắt đầu hiểu tính cách, cách làm việc và môi trường bạn dễ phát huy tốt nhất.",
  },
  {
    title: "Holland",
    href: "/holland",
    desc: "Giúp bạn nhìn rõ nhóm nghề phù hợp theo sở thích, xu hướng hành động và kiểu công việc dễ gắn bó lâu dài.",
  },
  {
    title: "Giá trị bản thân",
    href: "/knowdell",
    desc: "Làm rõ điều bạn ưu tiên khi chọn nghề, chọn công ty và xây dựng một lộ trình sự nghiệp bền hơn.",
  },
];

const interviewHighlights = [
  "Luyện trả lời theo nhiều cấp độ, từ câu hỏi cơ bản đến mô phỏng gần với phỏng vấn thật",
  "Câu hỏi có thể cá nhân hóa theo vị trí ứng tuyển và mô tả công việc",
  "AI feedback rõ ràng để bạn biết nên sửa phần nào trước",
  "Theo dõi tiến bộ qua từng buổi để luyện có định hướng hơn",
];

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const redirectedFrom = searchParams.get("redirectedFrom") || "/";
    router.replace(
      `/auth/callback?code=${encodeURIComponent(code)}&redirectedFrom=${encodeURIComponent(
        redirectedFrom
      )}`
    );
  }, [router, searchParams]);

  return (
    <main className="bg-[linear-gradient(180deg,#f6f8f2_0%,#ffffff_24%,#f8fafc_100%)] text-slate-900">
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <SparklesIcon className="h-4 w-4" />
              Hiểu mình rõ hơn và chuẩn bị tốt hơn cho công việc phù hợp
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Hiểu bản thân, chọn đúng hướng đi và <span className="text-emerald-600">tự tin hơn khi phỏng vấn</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              TuVanNghe giúp bạn đi từ giai đoạn còn mơ hồ về bản thân đến lúc có định hướng nghề nghiệp rõ hơn,
              rồi tiếp tục luyện phỏng vấn với AI để nói tốt hơn, chắc hơn và thuyết phục hơn trước nhà tuyển dụng.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/career"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Bắt đầu với hướng nghiệp
              </Link>
              <Link
                href="/interview"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Xem cách luyện phỏng vấn AI
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { value: "3", label: "Công cụ khám phá bản thân" },
                { value: "3", label: "Mức luyện phỏng vấn AI" },
                { value: "1", label: "Lộ trình rõ ràng để bắt đầu" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-3">
                  <BriefcaseIcon className="h-6 w-6 text-emerald-300" />
                  <p className="text-lg font-semibold">Hướng nghiệp</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Không chỉ dừng ở một bài test riêng lẻ. Các công cụ được kết nối để giúp bạn hiểu mình và chọn
                  hướng đi hợp lý hơn.
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <MicrophoneIcon className="h-6 w-6 text-emerald-700" />
                  <p className="text-lg font-semibold text-slate-950">Phỏng vấn AI</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Luyện trả lời, nhận góp ý ngay và theo dõi tiến bộ để chuẩn bị tốt hơn cho buổi phỏng vấn thật.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Vì sao người dùng chọn TuVanNghe
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Giúp bạn hiểu bản thân trước khi chọn ngành, chọn nghề hoặc chuyển hướng công việc",
                    "Biến kết quả hướng nghiệp thành hành động cụ thể, thay vì chỉ dừng ở đọc kết quả",
                    "Phù hợp cho học sinh, sinh viên, người mới đi làm và cả người đang chuẩn bị đổi việc",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Hành trình rõ ràng</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Từ khám phá bản thân đến chuẩn bị cho buổi phỏng vấn thật
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {journeySteps.map((step, index) => (
              <article key={step.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Bước {index + 1}</div>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="career" className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Hướng nghiệp</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Bắt đầu từ những câu hỏi căn bản: bạn hợp môi trường nào, hợp kiểu công việc nào, và muốn gì ở sự nghiệp
              </h2>
            </div>
            <Link href="/career" className="text-sm font-semibold text-emerald-700">
              Xem toàn bộ khu vực hướng nghiệp
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {careerTools.map((tool) => (
              <article
                key={tool.title}
                className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-2xl font-bold text-slate-950">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{tool.desc}</p>
                <Link href={tool.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  Xem {tool.title}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Phỏng vấn AI</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Khi đã biết mình muốn ứng tuyển vị trí nào, bước tiếp theo là luyện cách trả lời để được chọn
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Đây là khu vực giúp bạn chuyển từ “biết mình phù hợp với nghề gì” sang “biết cách trình bày bản thân
              sao cho thuyết phục hơn trước nhà tuyển dụng”.
            </p>

            <div className="mt-8 space-y-3">
              {interviewHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/interview"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Khám phá khu vực phỏng vấn AI
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Module 1",
                text: "Ghi âm câu trả lời để luyện nói rõ ý, súc tích và dễ nghe hơn.",
              },
              {
                title: "Module 2",
                text: "Thực hành theo lượt hỏi đáp để quen nhịp phản xạ khi trả lời.",
              },
              {
                title: "Module 3",
                text: "Mô phỏng gần với buổi phỏng vấn thật để tăng sự tự tin trước khi ứng tuyển.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] bg-white/8 p-5 backdrop-blur">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-8 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Bảng giá</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Xem nhanh các lựa chọn để bắt đầu đúng với nhu cầu hiện tại của bạn
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Nếu bạn đang cần hiểu bản thân và định hướng nghề nghiệp, hãy bắt đầu từ nhóm hướng nghiệp.
                Nếu bạn đã có mục tiêu ứng tuyển rõ hơn, bạn có thể xem ngay các gói luyện phỏng vấn với AI.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/pricing"
                className="rounded-2xl bg-slate-950 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Xem bảng giá
              </Link>
              <Link
                href="/mbti"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Bắt đầu miễn phí với MBTI
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
