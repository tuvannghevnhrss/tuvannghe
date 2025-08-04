import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Trần Thanh Phong – HRBP | Career Mentor",
  description:
    "12+ HRBP – chia sẻ kinh nghiệm định hướng nghề nghiệp & xây dựng sự nghiệp cho bạn trẻ.",
};

export default function PhongTranProfile() {
  return (
    <main className="space-y-32 pb-32 bg-white text-gray-800">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-indigo-50 to-white py-32">
        <div className="container mx-auto flex flex-col-reverse items-center gap-12 px-6 md:flex-row md:gap-24">
          {/* Content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl font-extrabold text-indigo-800 leading-tight">
              Trần Thanh Phong
            </h1>
            <p className="mt-4 text-xl">
              <span className="font-semibold">HRBP Manager</span> &amp;{" "}
              <span className="font-semibold">Career Mentor</span> – 12+ năm kinh nghiệm
            </p>
            <p className="mt-6 max-w-lg text-gray-600">
              Chia sẻ công cụ, trải nghiệm và động lực để giúp bạn trẻ khám phá bản thân,
              chọn đúng nghề và xây dựng lộ trình sự nghiệp rõ ràng, bền vững.
            </p>
            <a
              href="#contact"
              className="mt-8 inline-block rounded-full bg-indigo-600 px-10 py-4 font-medium text-white shadow-lg transition hover:bg-indigo-700"
            >
              Kết nối với tôi
            </a>
          </div>
          {/* Image */}
          <div className="w-48 md:w-1/2">
            <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-full shadow-xl md:h-72 md:w-72">
              <Image
                src="/avatar-phongtran.jpg"
                alt="Trần Thanh Phong"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="container mx-auto max-w-3xl space-y-6 px-6 text-center">
        <h2 className="text-3xl font-bold text-indigo-700">Sứ mệnh</h2>
        <blockquote className="px-8 italic text-gray-700">
          <p className="text-lg">
            Giúp người mất phương hướng tìm lại la bàn sự nghiệp.
          </p>
          <p className="mt-4">
            Tôi tin rằng sự nghiệp bền vững bắt đầu từ hiểu rõ chính mình –
            tính cách, sở thích và giá trị cốt lõi. Kết hợp kinh nghiệm nhân sự
            và mô hình MBTI, Holland, Knowdell để đồng hành cùng bạn trẻ.
          </p>
        </blockquote>
      </section>

      {/* CORE SKILLS */}
      <section className="bg-indigo-50 py-24">
        <div className="container mx-auto max-w-5xl space-y-12 px-6">
          <h2 className="text-center text-3xl font-bold text-indigo-700">
            Thế mạnh của tôi
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Phỏng vấn & tuyển dụng", desc: "10+ năm lead tuyển dụng, phỏng vấn từ Nhân viên đến Quản lý cấp cao; tư vấn viết CV, đào tạo kỹ năng phỏng vấn" },
              { title: "Xây dựng hệ thống nhân sự", desc: "Hoạch định, tái cơ cấu tổ chức, triển khai BSC / KPI cho doanh nghiệp 1.000+ nhân sự" },
              { title: "Thiết kế lương – thưởng", desc: "Xây dựng lương 2P và hệ thống báo cáo tự động với Looker Studio / Power BI" },
            ].map((k) => (
              <div
                key={k.title}
                className="rounded-3xl bg-white p-8 shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-2"
              >
                <h3 className="mb-4 text-xl font-semibold text-indigo-800">
                  {k.title}
                </h3>
                <p className="text-gray-600">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES 1:1 */}
      <section className="container mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold text-indigo-700">
          Dịch vụ tư vấn 1:1
        </h2>
        <div className="mt-6 space-y-6">
          {[
            { title: "Sửa CV, hồ sơ ứng tuyển chuyên sâu", price: "100.000đ" },
            { title: "Phỏng vấn thử, tư vấn chuẩn bị phỏng vấn: Bạn nhận được hướng dẫn chuẩn bị trước, trong và sau một buổi phỏng vấn và được nhận xét cách trả lời các câu hỏi phỏng vấn khó nhằn", price: "200.000đ" },
            { title: "Tư vấn định hướng nghề, tìm việc, đổi việc: Bạn được tư vấn các công cụ, phương pháp để khám phá bản thân, tìm ra công việc phù hợp với mong muốn, trình độ và kĩ năng hiện có, tìm được đam mê và hạnh phúc hơn trong công việc. Gói tư vấn này đồng thời được tư vấn CV và phỏng vấn", price: "799.000đ" },
            { title: "Đào tạo Nghề Nhân sự: Chuyên viên hoặc TP Nhân sự", price: "từ 1.999.000đ" },
          ].map((s) => (
            <div
              key={s.title}
              className="flex justify-between rounded-xl border border-indigo-100 p-6 bg-white shadow-sm hover:shadow-lg transition"
            >
              <span className="font-medium text-indigo-800">{s.title}</span>
              <span className="font-semibold text-indigo-600">{s.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="mailto:your-email@example.com"
            className="inline-block rounded-full border-2 border-indigo-600 px-10 py-4 font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
          >
            Liên hệ tư vấn chi tiết
          </a>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="bg-indigo-50 py-24">
        <div className="container mx-auto max-w-4xl space-y-12 px-6">
          <h2 className="text-center text-3xl font-bold text-indigo-700">
            Hành trình sự nghiệp
          </h2>
          <ul className="relative border-l-2 border-indigo-300 pl-8">
            {[
              { time: "2023–2025", role: "HR Manager – JTExpress", desc: "Tái cấu trúc, giảm 3 tỷ ₫ chi phí nhân công; quản lý 5.000 nhân sự" },
              { time: "2017–2022", role: "HR Manager – PGS Group", desc: "Mở 6 chi nhánh, quy mô nhân sự tăng 270 → 1.000; Tuyển dụng - đào tạo - truyền lửa nhân sự mới" },
              { time: "2014–2017", role: "HR Lead – E.Land/Dệt may Thành Công", desc: "Triển khai phần mềm HR, xây dựng chính sách lương sản phẩm" },
            ].map((e, i) => (
              <li key={i} className="mb-8 relative">
                <span className="absolute -left-4 top-0 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600">
                  <span className="block h-2 w-2 rounded-full bg-white"></span>
                </span>
                <div>
                  <div className="font-semibold text-indigo-800">{e.time}</div>
                  <div className="mt-1 font-medium">{e.role}</div>
                  <p className="mt-2 text-gray-600">{e.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FREE GIFT */}
      <section className="container mx-auto max-w-2xl px-6 py-20 text-center bg-indigo-600 text-white rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold">Quà tặng dành cho bạn</h2>
        <p className="mt-4 text-lg">
          Nhập mã <span className="font-semibold tracking-wider">PT20</span> để
          giảm 20.000 đ khi mua combo hướng nghiệp.
        </p>
        <a
          href="/payment?product=knowdell"
          className="mt-8 inline-block rounded-full bg-white px-10 py-4 font-medium text-indigo-600 hover:bg-gray-100 transition"
        >
          Nhận ưu đãi
        </a>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-6 sm:grid-cols-2 md:grid-cols-5">
          {[
            {
              label: "Gọi ngay",
              icon: PhoneIcon,
              href: "tel:0919122225",
              info: "0919 122 225",
              bg: "bg-indigo-600",
            },
            {
              label: "Chat Zalo",
              icon: ChatBubbleLeftRightIcon,
              href: "https://zalo.me/0919122225",
              info: "0919 122 225",
              bg: "bg-sky-500",
            },
            {
              label: "Facebook",
              icon: PlayCircleIcon,
              href: "https://facebook.com/kyvophong",
              info: "/kyvophong",
              bg: "bg-blue-600",
            },
            {
              label: "YouTube (sắp)",
              icon: PlayCircleIcon,
              href: "#",
              info: "Sắp cập nhật",
              bg: "bg-red-600/80",
              disabled: true,
            },
            {
              label: "TikTok (sắp)",
              icon: PlayCircleIcon,
              href: "#",
              info: "Sắp cập nhật",
              bg: "bg-black/80",
              disabled: true,
            },
          ].map((c, i) => (
            <a
              key={i}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center space-y-3 rounded-xl p-6 bg-white shadow transition hover:shadow-lg ${
                c.disabled ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div
                className={`${c.bg} flex h-16 w-16 items-center justify-center rounded-full text-white`}
              >
                <c.icon className="h-8 w-8" />
              </div>
              <p className="font-semibold text-indigo-800">{c.label}</p>
              <p className="text-sm text-gray-600">{c.info}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
