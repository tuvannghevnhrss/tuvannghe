/* -----------------------------------------------------------
   /phongtran  – Personal profile & career–guidance manifesto
   (c) 2025 Trần Thanh Phong – career-guidance-app
----------------------------------------------------------- */
import Image from "next/image";
import { Metadata } from "next";
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

/* ---------- SEO meta ---------- */
export const metadata: Metadata = {
  title: "Trần Thanh Phong – HRBP | Career Mentor",
  description:
    "12+ HRBP – chia sẻ kinh nghiệm định hướng nghề nghiệp & xây dựng sự nghiệp cho bạn trẻ.",
};

export default function PhongTranProfile() {
  return (
    <main className="space-y-24 pb-24">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-indigo-50/60 py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center md:flex-row md:text-left">
          <Image
            src="/avatar-phongtran.jpg"
            alt="Trần Thanh Phong"
            width={220}
            height={220}
            priority
            className="rounded-full border-4 border-indigo-600 object-cover"
          />

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight text-indigo-700">
              Trần Thanh Phong
            </h1>
            <p className="text-lg font-medium text-gray-700">
              10+ năm <span className="font-semibold">HRBP Manager</span> &nbsp;
              <span className="font-semibold">Career Mentor</span>
            </p>
            <p className="max-w-lg text-gray-600">
              Tôi chia sẻ trải nghiệm, công cụ &amp; động lực để giúp bạn trẻ
              khám phá bản thân, chọn đúng nghề và xây dựng lộ trình sự nghiệp.
            </p>

            <a
              href="#contact"
              className="inline-block rounded-xl bg-indigo-600 px-8 py-3 font-medium text-white shadow hover:bg-indigo-700"
            >
              Kết nối với tôi
            </a>
          </div>
        </div>
      </section>

      {/* --------------- MISSION --------------- */}
      <section className="mx-auto max-w-3xl space-y-6 px-6">
        <h2 className="text-center text-2xl font-bold">Sứ mệnh</h2>
        <p className="text-center text-gray-700">
          <b>“Giúp người mất phương hướng tìm lại la bàn sự nghiệp.”</b> <br />
          Tôi tin rằng một sự nghiệp bền vững bắt đầu từ việc hiểu rõ chính mình – về tính cách, sở thích và giá trị cốt lõi.
          Kết hợp giữa kinh nghiệm nhân sự thực tiễn và các mô hình đã được kiểm chứng như MBTI, Holland, Knowdell, tôi đồng hành cùng học sinh, sinh viên và người trẻ trong hành trình khám phá bản thân và định hướng nghề nghiệp một cách thực tế, rõ ràng.
        </p>
      </section>

      {/* --------------- CORE SKILLS --------------- */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl space-y-10 px-6">
          <h2 className="text-center text-2xl font-bold">Thế mạnh của tôi</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Phỏng vấn & tuyển dụng",
                desc: "10+ năm lead tuyển dụng, phỏng vấn từ Nhân viên đến Quản lý cấp cao; tư vấn viết CV, đào tạo kỹ năng phỏng vấn.",
              },
              {
                title: "Xây dựng hệ thống nhân sự",
                desc: "Hoạch định, tái cơ cấu tổ chức, triển khai BSC / KPI cho doanh nghiệp 1.000+ nhân sự.",
              },
              {
                title: "Thiết kế lương – thưởng",
                desc: "Xây dựng lương 2P và hệ thống báo cáo tự động với Looker Studio / Power BI.",
              },
            ].map((k) => (
              <article
                key={k.title}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold">{k.title}</h3>
                <p className="text-sm text-gray-600">{k.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====== START: Section Dịch vụ tư vấn 1:1 ====== */}
      <section className="mx-auto max-w-5xl px-6 py-16 bg-white rounded-2xl shadow-md">
        <h2 className="text-3xl font-semibold text-center mb-6">
          Dịch vụ tư vấn 1:1
        </h2>
        <p className="text-center text-gray-700 mb-8">
          Phong Trần cung cấp dịch vụ tư vấn hướng nghiệp 1:1, khi kết nối bạn sẽ được Dịch vụ tư vấn tìm việc và định hướng nghề nghiệp:
        </p>
        <ul className="max-w-3xl mx-auto space-y-4 list-disc list-inside text-gray-800">
          <li>
            <strong>Sửa CV, LinkedIn, hồ sơ ứng tuyển chuyên sâu</strong> – Bảng giá: <span className="font-medium">100.000 đ/lần/CV</span>
          </li>
          <li>
            <strong>Phỏng vấn thử, tư vấn chuẩn bị phỏng vấn</strong> – Bạn được hướng dẫn chuẩn bị trước, trong và sau một buổi phỏng vấn, nhận xét cách trả lời các câu hỏi khó nhằn, chia sẻ bí kíp giữ bình tĩnh. Bảng giá: <span className="font-medium">200.000 đ/lần/30 phút</span>
          </li>
          <li>
            <strong>Tư vấn chọn ngành, trường</strong> – Bạn được hướng dẫn chọn ngành cử nhân, thạc sĩ và trường cao đẳng/đại học tại Việt Nam hoặc du học. Bảng giá: <span className="font-medium">100.000 đ/lần/30 phút</span>
          </li>
          <li>
            <strong>Tư vấn định hướng nghề, tìm việc, đổi việc</strong> – Bạn được tư vấn công cụ và phương pháp khám phá bản thân, tìm công việc phù hợp, kèm CV & phỏng vấn. Gói dịch vụ 2 ngày. Bảng giá: <span className="font-medium">1.000.000 đ/lần/2 ngày</span>
          </li>
        </ul>
        <div className="mt-10 text-center">
          <a
            href="mailto:your-email@example.com"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Liên hệ tư vấn chi tiết
          </a>
        </div>
      </section>
      {/* ====== END: Section Dịch vụ tư vấn 1:1 ====== */}

      {/* --------------- EXPERIENCE --------------- */}
      <section className="mx-auto max-w-4xl space-y-8 px-6">
        <h2 className="text-center text-2xl font-bold">Hành trình sự nghiệp</h2>

        <ul className="border-l-2 border-indigo-600 pl-6">
          {[
            {
              time: "2023 – 2025",
              role: "HR Manager – JTExpress (Chi nhánh Miền Trung từ Thanh Hóa - Quảng Nam)",
              bullet:
                "Tái cấu trúc, giảm 3 tỷ ₫ chi phí nhân công; quản lý 5.000 nhân sự.",
            },
            {
              time: "2017 – 2022",
              role: "HR Manager – PGS Group (từ Ninh Bình - Quảng Trị)",
              bullet:
                "Mở 6 chi nhánh, quy mô nhân sự tăng 270 → 1.000; Tuyển dụng - đào tạo - truyền lửa nhân sự mới.",
            },
            {
              time: "2014 – 2017",
              role: "HR Lead – E.Land Việt Nam/ Dệt May Thành Công (5.000 nhân sự)",
              bullet: "Triển khai phần mềm HR, xây dựng chính sách lương sản phẩm.",
            },
          ].map((e) => (
            <li key={e.time} className="mb-8 ml-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className="h-3 w-3 rounded-full bg-indigo-600" />
                {e.time}
              </div>
              <p className="mt-1 font-medium">{e.role}</p>
              <p className="text-sm text-gray-600">{e.bullet}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------- FREE GIFT --------------- */}
      <section className="bg-indigo-600 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Quà tặng dành cho bạn</h2>
        <p className="mt-4 text-lg">
          Nhập mã <b className="tracking-wider">PT20</b> để giảm 20 000 đ khi mua
          gói <u>Combo định hướng – hướng nghiệp</u>.
        </p>
        <a
          href="/payment?product=knowdell"
          className="mt-8 inline-block rounded bg-white/10 px-8 py-3 font-medium hover:bg-white/20"
        >
          Nhận ưu đãi ngay
        </a>
      </section>

      {/* --------------- CONTACT (NEW) --------------- */}
      <section id="contact" className="bg-gray-50 py-20">
        <h2 className="text-center text-2xl font-bold mb-12">
          Kết nối với Phong
        </h2>
        <div className="mx-auto grid max-w-5xl gap-10 px-6 sm:grid-cols-2 md:grid-cols-5">
          {/* PHONE */}
          <a
            href="tel:0919122225"
            className="flex flex-col items-center space-y-3 group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white transition group-hover:bg-indigo-700">
              <PhoneIcon className="h-7 w-7" />
            </div>
            <p className="font-semibold">Gọi ngay</p>
            <p className="text-sm text-gray-600">0919 122 225</p>
          </a>

          {/* ZALO */}
          <a
            href="https://zalo.me/0919122225"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-3 group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white transition group-hover:bg-sky-600">
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
            </div>
            <p className="font-semibold">Chat Zalo</p>
            <p className="text-sm text-gray-600">0919 122 225</p>
          </a>

          {/* FACEBOOK */}
          <a
            href="https://www.facebook.com/kyvophong"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center space-y-3 group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white transition group-hover:bg-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-7 w-7 fill-current"
              >
                <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.3V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12z" />
              </svg>
            </div>
            <p className="font-semibold">Facebook</p>
            <p className="text-sm text-gray-600">/kyvophong</p>
          </a>

          {/* TIKTOK – placeholder */}
          <div className="flex flex-col items-center space-y-3 opacity-60">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-7 w-7 fill-current"
              >
                <path d="M12 2a10 10 0 1 0 7.12 17.12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 5.66-13.66 4 4 0 1 0 0 5.66A7.96 7.96 0 0 1 12 20Z" />
              </svg>
            </div>
            <p className="font-semibold">TikTok</p>
            <p className="text-sm text-gray-500">Sắp cập nhật</p>
          </div>

          {/* YOUTUBE – placeholder */}
          <div className="flex flex-col items-center space-y-3 opacity-60">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/70 text-white">
              <PlayCircleIcon className="h-7 w-7" />
            </div>
            <p className="font-semibold">YouTube</p>
            <p className="text-sm text-gray-500">Sắp cập nhật</p>
          </div>
        </div>
      </section>
    </main>
  );
}
