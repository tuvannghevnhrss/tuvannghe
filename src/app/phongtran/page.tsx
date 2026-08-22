import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  LightBulbIcon,
  MapIcon,
  PhoneIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

export const metadata: Metadata = {
  title: "Tư vấn hướng nghiệp 1-1 cùng Trần Thanh Phong | TuVanNghe",
  description:
    "Trang mentor của Trần Thanh Phong, giúp bạn hiểu bản thân, chọn hướng nghề phù hợp và chuẩn bị CV, phỏng vấn dựa trên hệ sinh thái TuVanNghe.",
  openGraph: {
    title: "Tư vấn hướng nghiệp 1-1 cùng Trần Thanh Phong",
    description:
      "Kết hợp góc nhìn HR thực chiến với MBTI, Holland, Knowdell và luyện phỏng vấn AI để biến định hướng thành kế hoạch hành động.",
    type: "website",
    images: ["/avatar-phongtran.jpg"],
  },
  alternates: { canonical: "/phongtran" },
};

const situations = [
  {
    title: "Bạn chưa rõ mình phù hợp với nghề gì",
    text: "Bạn có nhiều lựa chọn nhưng thiếu một khung rõ ràng để hiểu điểm mạnh, động lực và kiểu môi trường làm việc phù hợp.",
    icon: LightBulbIcon,
  },
  {
    title: "Bạn muốn chọn ngành, đổi việc hoặc chuyển hướng",
    text: "Bạn cần so sánh các hướng đi một cách thực tế hơn, không chỉ dựa vào cảm hứng nhất thời hoặc lời khuyên rời rạc.",
    icon: MapIcon,
  },
  {
    title: "Bạn đã có mục tiêu nhưng chưa tự tin ứng tuyển",
    text: "Bạn cần chỉnh CV, luyện cách kể câu chuyện nghề nghiệp và chuẩn bị câu trả lời phỏng vấn thuyết phục hơn.",
    icon: BriefcaseIcon,
  },
];

const pathway = [
  {
    step: "01",
    title: "Khám phá bản thân",
    text: "Bắt đầu từ MBTI, Holland và Knowdell để có dữ liệu nền về tính cách, sở thích nghề nghiệp và giá trị ưu tiên.",
    href: "/career",
    cta: "Xem hub hướng nghiệp",
  },
  {
    step: "02",
    title: "Chọn hướng đi khả thi",
    text: "Cùng mentor đọc kết quả, lọc các lựa chọn phù hợp với bối cảnh thật của bạn và chốt nhóm nghề nên ưu tiên.",
    href: "/knowdell",
    cta: "Làm rõ giá trị nghề nghiệp",
  },
  {
    step: "03",
    title: "Biến định hướng thành hành động",
    text: "Xây roadmap 3-6 tháng, chỉnh CV, luyện phỏng vấn và xác định việc cần làm ngay trong tuần đầu tiên.",
    href: "/interview",
    cta: "Luyện phỏng vấn AI",
  },
];

const services = [
  {
    name: "Gỡ rối định hướng",
    badge: "1 buổi",
    description:
      "Phù hợp khi bạn đang phân vân giữa vài lựa chọn và cần một buổi soi lại vấn đề thật rõ.",
    features: [
      "Làm rõ tình huống hiện tại",
      "Đọc nhanh kết quả test nếu đã có",
      "Chốt 2-3 hướng nên kiểm chứng tiếp",
    ],
  },
  {
    name: "Combo hướng nghiệp cá nhân",
    badge: "Khuyến nghị",
    description:
      "Phù hợp khi bạn muốn đi trọn flow từ hiểu bản thân, chọn hướng nghề đến có kế hoạch hành động.",
    features: [
      "Kết hợp MBTI, Holland, Knowdell",
      "Buổi tư vấn 1-1 để giải nghĩa kết quả",
      "Roadmap 3-6 tháng theo mục tiêu cá nhân",
    ],
    highlighted: true,
  },
  {
    name: "CV và Mock Interview",
    badge: "Ứng tuyển",
    description:
      "Phù hợp khi bạn đã có mục tiêu công việc và cần chuẩn bị hồ sơ, câu chuyện, câu trả lời phỏng vấn.",
    features: [
      "Rà soát CV theo vị trí ứng tuyển",
      "Luyện kể kinh nghiệm bằng STAR/CARE",
      "Gợi ý cách tiếp tục luyện với AI",
    ],
  },
];

const outcomes = [
  "Bản đồ nghề cá nhân dựa trên dữ liệu từ test và buổi trao đổi",
  "Danh sách hướng nghề hoặc vị trí nên ưu tiên kiểm chứng",
  "Roadmap 3-6 tháng với kỹ năng, dự án và việc cần làm cụ thể",
  "Gợi ý chỉnh CV, portfolio hoặc hồ sơ ứng tuyển",
  "Kịch bản luyện phỏng vấn phù hợp với mục tiêu gần nhất",
  "Một bước hành động rõ ràng để bắt đầu ngay sau buổi tư vấn",
];

const mentorReasons = [
  {
    title: "Có góc nhìn HR thực chiến",
    text: "Buổi tư vấn không chỉ dừng ở cảm nhận cá nhân, mà luôn đặt trong bối cảnh tuyển dụng, năng lực và thị trường việc làm.",
  },
  {
    title: "Cá nhân hóa theo dữ liệu",
    text: "Kết quả MBTI, Holland, Knowdell được dùng như điểm bắt đầu để hiểu bạn, không phải nhãn dán cố định.",
  },
  {
    title: "Tập trung vào hành động",
    text: "Mục tiêu cuối cùng là giúp bạn biết nên làm gì tiếp theo: học gì, thử gì, sửa gì và ứng tuyển thế nào.",
  },
];

const faqs = [
  {
    q: "Tôi chưa biết bắt đầu từ đâu thì nên làm gì trước?",
    a: "Bạn có thể bắt đầu bằng MBTI miễn phí hoặc hub hướng nghiệp. Nếu đang rối và muốn tiết kiệm thời gian, hãy đặt một buổi tư vấn 1-1 để mentor giúp bạn xác định điểm xuất phát.",
  },
  {
    q: "Có cần làm bài test trước khi tư vấn không?",
    a: "Không bắt buộc, nhưng nên có. Kết quả test giúp buổi tư vấn cụ thể hơn, tránh nói chung chung và giúp mentor nhìn rõ mẫu tính cách, sở thích nghề nghiệp, giá trị ưu tiên của bạn.",
  },
  {
    q: "Tư vấn 1-1 khác gì tự đọc kết quả trên website?",
    a: "Website giúp bạn có dữ liệu ban đầu. Tư vấn 1-1 giúp kết nối dữ liệu đó với bối cảnh thật của bạn: ngành học, kinh nghiệm, mục tiêu, nỗi lo và kế hoạch hành động.",
  },
  {
    q: "Nếu tôi đang chuẩn bị phỏng vấn gấp thì có phù hợp không?",
    a: "Có. Khi mục tiêu đã rõ, buổi tư vấn có thể tập trung vào CV, câu chuyện nghề nghiệp, câu hỏi khó và cách luyện tiếp với khu vực phỏng vấn AI.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Trần Thanh Phong",
  jobTitle: "Career Mentor",
  image: "/avatar-phongtran.jpg",
  email: "mailto:vnhrss@gmail.com",
  sameAs: ["https://facebook.com/kyvophong"],
  makesOffer: {
    "@type": "Offer",
    name: "Tư vấn hướng nghiệp 1-1",
    priceCurrency: "VND",
    availability: "https://schema.org/InStock",
    url: "https://zalo.me/0919122225",
  },
};

export default function PhongTranProfile() {
  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_30%,#f1f5f9_100%)] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="px-4 pb-14 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <SparklesIcon className="h-4 w-4" />
              Mentor hướng nghiệp trong hệ sinh thái TuVanNghe
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Hiểu mình rõ hơn, chọn hướng nghề chắc hơn và chuẩn bị ứng tuyển tốt hơn
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Cùng Trần Thanh Phong kết nối kết quả MBTI, Holland, Knowdell với
              bối cảnh thật của bạn để biến những điều còn mơ hồ thành một lộ
              trình nghề nghiệp có thể bắt đầu ngay.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#booking"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Đặt lịch tư vấn 1-1
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <Link
                href="/career"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Bắt đầu với hướng nghiệp
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { value: "1-1", label: "Tư vấn theo tình huống cá nhân" },
                { value: "3", label: "Bộ công cụ MBTI, Holland, Knowdell" },
                { value: "AI", label: "Luyện phỏng vấn sau khi rõ mục tiêu" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="text-center">
              <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-full bg-slate-100 shadow-2xl shadow-slate-200/80 ring-8 ring-white md:h-80 md:w-80">
                <Image
                  src="/avatar-phongtran.jpg"
                  alt="Trần Thanh Phong - Career Mentor"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mx-auto mt-6 max-w-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Trần Thanh Phong
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Career Mentor đồng hành từ định hướng đến ứng tuyển
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Điểm xuất phát
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Trang này dành cho bạn nếu đang cần một người giúp gỡ rối nghề nghiệp
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {situations.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Lộ trình hỗ trợ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Không chỉ làm bài test, mà biến kết quả thành lựa chọn và hành động
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pathway.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"
              >
                <p className="text-sm font-bold text-emerald-300">{item.step}</p>
                <h3 className="mt-4 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                >
                  {item.cta}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Hình thức đồng hành
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Chọn đúng mức hỗ trợ theo nhu cầu hiện tại
              </h2>
            </div>
            <Link href="/pricing" className="text-sm font-semibold text-emerald-700">
              Xem bảng giá trên TuVanNghe
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  service.highlighted
                    ? "border-emerald-400 bg-emerald-50 shadow-emerald-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    service.highlighted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {service.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">{service.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {service.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircleSolidIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Kết quả sau tư vấn
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Điều quan trọng nhất là bạn biết nên làm gì tiếp theo
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Một buổi tư vấn tốt không khiến bạn phụ thuộc vào mentor. Nó giúp
              bạn có ngôn ngữ rõ hơn về bản thân và một kế hoạch đủ cụ thể để tự đi tiếp.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {outcomes.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Vì sao nên làm cùng mentor
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Có người giúp bạn đọc đúng dữ liệu và đưa ra lựa chọn thực tế hơn
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {mentorReasons.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <ClipboardDocumentCheckIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Đi cùng hệ sinh thái
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
                Bạn có thể tự bắt đầu bằng công cụ, rồi đặt tư vấn khi cần người gỡ rối sâu hơn
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-slate-700">
                Cách này giúp buổi tư vấn đi thẳng vào vấn đề của bạn, thay vì mất thời gian
                với những câu hỏi nền tảng có thể chuẩn bị trước.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/mbti"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Làm MBTI miễn phí
              </Link>
              <Link
                href="/payment?product=knowdell"
                className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Chọn combo hướng nghiệp
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Câu hỏi thường gặp
          </h2>

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-950">
                  <span>{faq.q}</span>
                  <span className="text-2xl leading-none text-emerald-600">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="booking" className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Đặt lịch
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Sẵn sàng gỡ rối hướng nghề của bạn?
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Gửi tin nhắn ngắn về tình huống hiện tại của bạn: đang học gì,
                đang làm gì, đang phân vân điều gì và mục tiêu gần nhất là gì.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Gọi ngay",
                  icon: PhoneIcon,
                  href: "tel:0919122225",
                  info: "0919 122 225",
                },
                {
                  label: "Chat Zalo",
                  icon: ChatBubbleLeftRightIcon,
                  href: "https://zalo.me/0919122225",
                  info: "0919 122 225",
                },
                {
                  label: "Email",
                  icon: EnvelopeIcon,
                  href: "mailto:vnhrss@gmail.com",
                  info: "vnhrss@gmail.com",
                },
                {
                  label: "Cộng đồng",
                  icon: UserGroupIcon,
                  href: "https://facebook.com/kyvophong",
                  info: "Facebook",
                },
              ].map((contact) => (
                <a
                  key={contact.label}
                  href={contact.href}
                  target={contact.href.startsWith("http") ? "_blank" : undefined}
                  rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:border-emerald-300/60 hover:bg-white/[0.1]"
                >
                  <contact.icon className="h-7 w-7 text-emerald-300" />
                  <p className="mt-4 font-semibold">{contact.label}</p>
                  <p className="mt-1 text-sm text-slate-300">{contact.info}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 right-4 z-50 block md:hidden">
        <a
          href="#booking"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-emerald-900/30"
        >
          Đặt lịch tư vấn 1-1
          <CalendarDaysIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
