/* -----------------------------------------------------------
   /phongtran  – Personal profile & career–guidance manifesto
   (c) 2025 Trần Thanh Phong – career-guidance-app
----------------------------------------------------------- */
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title : "Trần Thanh Phong – HRBP | Career Guide",
  description:
    "10+ năm HRBP – chia sẻ kinh nghiệm định hướng nghề nghiệp & xây dựng sự nghiệp cho bạn trẻ.",
};

export default function PhongTranProfile() {
  return (
    <main className="space-y-24 pb-24">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-indigo-50/60 py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center md:flex-row md:text-left">
          <Image
            src="/avatar-phongtran.jpg" // <— đặt ảnh 1:1 300×300 vào public/
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
              10+ năm <span className="font-semibold">HRBP Manager</span> &amp;
              <span className="ml-1 font-semibold">
                Nhà tư vấn hướng nghiệp tự do
              </span>
            </p>
            <p className="max-w-lg text-gray-600">
              Tôi chia sẻ trải nghiệm, công cụ & động lực để giúp bạn trẻ tìm
              chính mình, lựa chọn đúng nghề và xây dựng lộ trình sự nghiệp.
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
          Tôi tin rằng <i>sự nghiệp bền vững</i> bắt đầu từ việc hiểu chính mình
          – tính cách, sở thích, giá trị cốt lõi. Vì vậy, tôi kết hợp kinh nghiệm
          nhân sự, các mô hình MBTI • Holland • Knowdell và dữ liệu thực tiễn để
          đồng hành cùng học sinh – sinh viên & nhân sự trẻ trên hành trình
          khám phá bản thân.
        </p>
      </section>

      {/* --------------- CORE SKILLS --------------- */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl space-y-10 px-6">
          <h2 className="text-center text-2xl font-bold">Thế mạnh của tôi</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Xây dựng hệ thống nhân sự",
                desc: "Hoạch định, tái cơ cấu & BSC / KPI cho doanh nghiệp 1 000+ NV.",
              },
              {
                title: "Thiết kế lương – thưởng",
                desc: "Xây dựng lương 2P, hệ thống báo cáo tự động, tối ưu 3,6 tỷ chi phí /năm.",
              },
              {
                title: "Phỏng vấn & tuyển dụng",
                desc: "10+ năm lead tuyển dụng, truyền bí kíp CV & phỏng vấn cho người mới.",
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

      {/* --------------- EXPERIENCE --------------- */}
      <section className="mx-auto max-w-4xl space-y-8 px-6">
        <h2 className="text-center text-2xl font-bold">Hành trình sự nghiệp</h2>

        <ul className="border-l-2 border-indigo-600 pl-6">
          {[
            {
              time: "2023 – 2025",
              role: "HRBP Manager – Thuận Phong Express (Miền Trung)",
              bullet:
                "Tái cấu trúc, giảm 3 tỷ ₫ chi phí nhân công; quản lý 5 000 NV.",
            },
            {
              time: "2017 – 2022",
              role: "HR Manager – PGS Group (11 dự án)",
              bullet:
                "Mở 6 chi nhánh, quy mô nhân sự ↑ 270 → 1 000 NV; setup lương 2P.",
            },
            {
              time: "2014 – 2017",
              role: "HR Lead – E.Land Việt Nam (5 000 NV)",
              bullet:
                "Triển khai phần mềm HR, xây lương sản phẩm & giải quyết đình công.",
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
          Nhập mã <b className="tracking-wider">PT20</b> để giảm 20 000 đ khi
          mua gói <u>Combo định hướng – hướng nghiệp</u>.
        </p>
        <a
          href="/payment?product=knowdell"
          className="mt-8 inline-block rounded bg-white/10 px-8 py-3 font-medium hover:bg-white/20"
        >
          Nhận ưu đãi ngay
        </a>
      </section>

      {/* --------------- CONTACT --------------- */}
      <section
        id="contact"
        className="mx-auto max-w-3xl space-y-6 px-6 text-center"
      >
        <h2 className="text-2xl font-bold">Kết nối với Phong</h2>
        <p className="text-gray-600">
          Email:{" "}
          <a
            href="mailto:tranphong89@gmail.com"
            className="font-medium text-indigo-600 underline"
          >
            tranphong89@gmail.com
          </a>{" "}
          · ĐT/Zalo: 0919 122 225
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="https://career-guidance-app-v1.vercel.app/phongtran"
            target="_blank"
            className="rounded-full bg-gray-200 p-3 text-gray-600 hover:bg-gray-300"
          >
            {/* heroicons: link */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
          {/* thêm icon FB / GitHub nếu muốn */}
        </div>
      </section>
    </main>
  );
}
