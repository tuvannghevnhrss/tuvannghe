import Link from "next/link";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { INTERVIEW_PACKAGES, PRICES, type InterviewPackageMeta } from "@/lib/constants";

function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}

const careerPlans = [
  {
    name: "MBTI",
    price: PRICES.mbti,
    href: "/mbti",
    cta: "Bắt đầu miễn phí",
    badge: "Miễn phí",
    description: "Bài test đầu vào để hiểu tính cách và phong cách làm việc của bạn.",
    features: [
      "60 câu hỏi, hoàn thành nhanh",
      "Kết quả dùng làm nền cho hồ sơ hướng nghiệp",
      "Phù hợp để bắt đầu trước khi đi sâu hơn",
    ],
  },
  {
    name: "Holland",
    price: PRICES.holland,
    href: "/payment?product=holland",
    cta: "Mua Holland",
    badge: "Định hướng nghề",
    description: "Khám phá nhóm nghề phù hợp theo mô hình RIASEC và sở thích nghề nghiệp.",
    features: [
      "54 câu hỏi Holland",
      "Hiểu nhóm nghề phù hợp trước khi chọn ngành",
      "Tự động mở nếu mua Knowdell",
    ],
  },
  {
    name: "Giá trị bản thân",
    price: PRICES.knowdell,
    href: "/payment?product=knowdell",
    cta: "Mua Knowdell",
    badge: "Đi sâu động lực",
    description: "Xác định điều bạn coi trọng khi chọn nghề, môi trường và lộ trình phát triển.",
    features: [
      "Card sort theo logic Knowdell",
      "Đã bao gồm Holland — nếu đã mua Holland lẻ, bạn chỉ trả phần chênh lệch",
      "Phù hợp để ra quyết định nghề nghiệp rõ hơn",
    ],
  },
  {
    name: "Combo hướng nghiệp",
    price: PRICES.combo,
    href: "/payment?product=knowdell",
    cta: "Chọn combo",
    badge: "Tối ưu chi phí",
    description: "Lộ trình gọn để đi từ hiểu bản thân đến chọn hướng đi phù hợp hơn.",
    features: [
      "MBTI miễn phí",
      "Holland + Knowdell trọn bộ",
      "Tiết kiệm hơn mua lẻ",
    ],
  },
];

const pricingFaqs = [
  {
    q: "Gói nào phù hợp nếu tôi mới bắt đầu?",
    a: "Nếu chưa rõ nghề phù hợp: làm MBTI miễn phí, sau đó chọn combo Holland + Knowdell (90.000đ). Nếu đã có mục tiêu ứng tuyển: bắt đầu với gói Khởi động (89.000đ, 5 buổi Module 1 và 2 buổi Module 2).",
  },
  {
    q: "Module 2 và Module 3 khác nhau ra sao?",
    a: "Module 2 phù hợp cho luyện hỏi đáp theo lượt. Module 3 mô phỏng thực tiễn hơn và dành cho người cần chuẩn bị sát vòng phỏng vấn thật.",
  },
  {
    q: "Mua gói hướng nghiệp có cần mua thêm phỏng vấn AI không?",
    a: "Không bắt buộc. Nếu bạn đang ở giai đoạn chưa rõ hướng đi, hãy ưu tiên hướng nghiệp trước. Khi đã rõ mục tiêu, hãy chuyển sang luyện phỏng vấn AI.",
  },
  {
    q: "Có thể nâng cấp sau không?",
    a: "Có. Bạn có thể mua thêm gói cao hơn bất cứ lúc nào. Gói Khởi động còn kèm voucher nâng cấp 50.000đ trong 7 ngày. Nếu đã mua Holland lẻ, bạn chỉ trả phần chênh lệch khi mua Knowdell.",
  },
  {
    q: "Tôi nên xem trang nào trước khi quyết định mua?",
    a: "Hãy xem trang Hướng nghiệp nếu bạn chưa rõ nghề phù hợp. Nếu đã có mục tiêu ứng tuyển, chuyển sang trang Phỏng vấn AI để chọn module phù hợp.",
  },
];

const pricingFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

const colorMap: Record<
  InterviewPackageMeta["color"],
  {
    card: string;
    badge: string;
    button: string;
    ring: string;
    icon: string;
    pill: string;
  }
> = {
  slate: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
    button: "bg-slate-900 text-white hover:bg-slate-800",
    ring: "bg-slate-100",
    icon: "text-slate-600",
    pill: "",
  },
  emerald: {
    card: "border-emerald-400 bg-white ring-2 ring-emerald-400 shadow-xl shadow-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    ring: "bg-emerald-50",
    icon: "text-emerald-600",
    pill: "bg-emerald-600 text-white",
  },
  teal: {
    card: "border-teal-200 bg-white",
    badge: "bg-teal-50 text-teal-700",
    button: "bg-teal-600 text-white hover:bg-teal-700",
    ring: "bg-teal-50",
    icon: "text-teal-600",
    pill: "",
  },
};

function InterviewCard({ pkg }: { pkg: InterviewPackageMeta }) {
  const color = colorMap[pkg.color];
  const savings = Math.max(0, pkg.originalPrice - pkg.price);

  return (
    <article className={`relative flex flex-col rounded-[28px] border p-7 transition hover:-translate-y-1 ${color.card}`}>
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color.pill}`}>
            Phổ biến nhất
          </span>
        </div>
      )}

      <div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color.badge}`}>
          {pkg.duration} ngày
        </span>
        <h3 className="mt-4 text-2xl font-bold text-slate-950">{pkg.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{pkg.tagline}</p>
      </div>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-extrabold text-slate-950">{formatVND(pkg.price)}</span>
          <span className="pb-1 text-sm text-slate-400 line-through">{formatVND(pkg.originalPrice)}</span>
        </div>
        {savings > 0 && (
          <p className="mt-2 text-sm font-medium text-emerald-700">Tiết kiệm {formatVND(savings)} so với giá niêm yết</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Quyền sử dụng</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span>Module 1</span>
            <span className="font-semibold">
              {pkg.limits.module1 === 0 ? "—" : `${pkg.limits.module1} buổi`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Module 2</span>
            <span className="font-semibold">
              {pkg.limits.module2 === 0 ? "—" : `${pkg.limits.module2} buổi`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Module 3</span>
            <span className="font-semibold">
              {pkg.limits.module3 === 0 ? "—" : `${pkg.limits.module3} buổi`}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span>Trắc nghiệm</span>
            <span className="font-semibold">{pkg.limits.assessments}</span>
          </div>
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${color.ring}`}>
              <CheckIcon className={`h-3 w-3 ${color.icon}`} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={`/payment?product=${pkg.id}`}
        className={`mt-8 block rounded-2xl px-5 py-3 text-center text-sm font-semibold transition ${color.button}`}
      >
        Chọn gói {pkg.name}
      </Link>
    </article>
  );
}

export default function PricingOverview({ reason }: { reason?: string }) {
  return (
    <div className="space-y-16">
      {reason === "quota" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Bạn đã dùng hết lượt ở gói hiện tại</p>
            <p className="mt-1 text-sm text-amber-800">
              Chọn gói phù hợp hơn để tiếp tục luyện phỏng vấn mà không bị ngắt nhịp.
            </p>
          </div>
        </div>
      )}

      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
          <SparklesIcon className="h-4 w-4" />
          Các lựa chọn hiện có
        </div>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
          Bảng giá rõ ràng cho hướng nghiệp và phỏng vấn AI
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Trang này tổng hợp các lựa chọn hiện có trên TuVanNghe, từ những công cụ hỗ trợ khám phá
          bản thân và định hướng nghề nghiệp đến các gói luyện phỏng vấn với AI. Bạn có thể xem
          nhanh từng nhóm, so sánh mức độ phù hợp và chọn đúng dịch vụ cho mục tiêu hiện tại của mình.
        </p>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Hướng nghiệp</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Các công cụ giúp bạn hiểu bản thân và chọn hướng đi</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            MBTI là điểm bắt đầu, Holland giúp định hình nhóm nghề phù hợp, còn Giá trị bản thân
            giúp bạn chọn môi trường và hướng đi bền hơn.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          {careerPlans.map((plan) => (
            <article key={plan.name} className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {plan.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>
              </div>

              <div className="mt-6 text-4xl font-extrabold text-slate-950">{formatVND(plan.price)}</div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <CheckIcon className="h-3 w-3 text-slate-600" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="mt-8 block rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Phỏng vấn AI</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Các gói luyện phỏng vấn theo mức độ cam kết</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Chọn gói theo số buổi luyện và mục tiêu ứng tuyển của bạn. Bạn có thể bắt đầu
            từ gói nhỏ và nâng cấp bất cứ lúc nào.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {INTERVIEW_PACKAGES.map((pkg) => (
            <InterviewCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-amber-200 bg-amber-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Chính sách nâng cấp</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-950">Mua gói thấp trước, nâng cấp sau vẫn hợp lý</h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-slate-700">
          Trong 7 ngày đầu sau khi mua gói phỏng vấn, người dùng có thể nâng cấp lên gói cao hơn
          theo nguyên tắc chỉ trả phần chênh lệch. Cách này giúp họ bắt đầu nhanh mà không sợ chọn
          nhầm gói ngay từ lần đầu.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/interview"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Vào khu vực phỏng vấn AI
          </Link>
          <Link
            href="/career"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xem hub hướng nghiệp
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Câu hỏi thường gặp về bảng giá
          </h2>
        </div>

        <div className="space-y-3">
          {pricingFaqs.map((faq) => (
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

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Đi tiếp</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-950">
          Chọn đúng lộ trình trước khi thanh toán
        </h2>
        <p className="mt-3 max-w-4xl text-base leading-8 text-slate-600">
          Nếu bạn còn đang phân vân giữa hướng nghiệp và luyện phỏng vấn, hãy xem trước nội dung
          từng phần để chọn đúng nhu cầu trước khi thanh toán.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/career" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Xem hướng nghiệp
          </Link>
          <Link href="/interview" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Xem phỏng vấn AI
          </Link>
          <Link href="/interview/module-1" className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
            Bắt đầu luyện thử
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
    </div>
  );
}
