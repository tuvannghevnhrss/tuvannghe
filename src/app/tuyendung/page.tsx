import type { Metadata } from "next";
import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/admin";
import type { JobPosting } from "@/lib/jobs";
import JobsIndexClient from "./JobsIndexClient";

// Tin tuyển dụng không cần realtime tuyệt đối; lọc/tìm kiếm đã xử lý ở client
// (JobsIndexClient) nên trang có thể cache và làm mới định kỳ thay vì query
// Supabase trên mọi request — giảm TTFB từ ~150-700ms xuống gần tức thời.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Tuyển dụng | Việc làm phù hợp với định hướng nghề của bạn",
  description:
    "Tổng hợp tin tuyển dụng theo ngành nghề, kèm gợi ý luyện phỏng vấn AI để ứng tuyển tự tin hơn.",
  alternates: { canonical: "/tuyendung" },
  keywords: ["tuyển dụng", "việc làm", "tìm việc", "tuyển dụng theo ngành nghề"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tuyển dụng | Tư vấn nghề",
    description: "Tin tuyển dụng theo ngành nghề, gắn với kết quả hướng nghiệp của bạn.",
    type: "website",
  },
};

export default async function JobsIndexPage() {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("job_postings")
    .select("*")
    .eq("status", "published")
    .order("posted_at", { ascending: false });

  const jobs = (data ?? []) as JobPosting[];
  const categories = ["Tất cả", ...Array.from(new Set(jobs.map((job) => job.category)))];
  const locations = ["Tất cả", ...Array.from(new Set(jobs.map((job) => job.location)))];
  const companyCount = new Set(jobs.map((job) => job.company)).size;

  return (
    <main className="jobsPage">
      <header className="jobsHero">
        <div className="heroInner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <span>Tuyển dụng</span>
          </nav>

          <div className="heroGrid">
            <div className="heroCopy">
              <span className="eyebrow">Tuyển dụng</span>
              <h1>Việc làm phù hợp với định hướng nghề của bạn</h1>
              <p>
                Đã có kết quả Holland hoặc MBTI thì việc lọc ra ngành phù hợp sẽ dễ hơn. Xem tin,
                lọc theo ngành nghề và ứng tuyển trực tiếp với nhà tuyển dụng.
              </p>
            </div>

            <div className="heroSummary" aria-label="Tóm tắt tuyển dụng">
              <div>
                <strong>{jobs.length}</strong>
                <span>tin đang tuyển</span>
              </div>
              <div>
                <strong>{companyCount}</strong>
                <span>công ty</span>
              </div>
              <div>
                <strong>{Math.max(categories.length - 1, 0)}</strong>
                <span>ngành nghề</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="contentGrid" aria-label="Danh sách tuyển dụng">
        <JobsIndexClient jobs={jobs} categories={categories} locations={locations} />
      </section>

      <style>{`
        .jobsPage {
          color: #172033;
          background: #f6f7f4;
        }
        .jobsHero,
        .contentGrid {
          max-width: 1180px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }
        .jobsHero {
          padding-top: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #d8ddd2;
        }
        .heroInner {
          display: grid;
          gap: 14px;
        }
        .breadcrumbs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          color: #65705f;
          font-size: 12px;
        }
        .breadcrumbs a {
          color: #334155;
          text-decoration: none;
        }
        .heroGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 28px;
          align-items: center;
          justify-content: space-between;
        }
        .heroCopy {
          display: grid;
          gap: 6px;
          max-width: 620px;
        }
        .eyebrow,
        .sectionKicker {
          color: #2f6f4f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        h1,
        h2 {
          margin: 0;
          letter-spacing: 0;
          color: #111827;
        }
        h1 {
          max-width: 620px;
          font-size: clamp(20px, 2.6vw, 26px);
          line-height: 1.2;
        }
        h2 {
          font-size: 17px;
          line-height: 1.3;
        }
        p {
          margin: 0;
        }
        .heroCopy p {
          max-width: 560px;
          color: #65705f;
          font-size: 13px;
          line-height: 1.55;
        }
        .heroSummary {
          display: flex;
          flex: none;
          gap: 18px;
        }
        .heroSummary div {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .heroSummary strong {
          color: #111827;
          font-size: 18px;
          line-height: 1;
        }
        .heroSummary span {
          color: #65705f;
          font-size: 12px;
        }
        .contentGrid {
          display: grid;
          gap: 18px;
          padding-top: 20px;
          padding-bottom: 28px;
        }
        @media (max-width: 640px) {
          .jobsHero,
          .contentGrid {
            padding-left: 16px;
            padding-right: 16px;
          }
          .heroGrid {
            align-items: start;
          }
          .heroSummary {
            gap: 14px;
          }
        }
      `}</style>
    </main>
  );
}
