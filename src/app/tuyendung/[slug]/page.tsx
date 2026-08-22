import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@/lib/supabase/admin";
import type { JobPosting } from "@/lib/jobs";
import { EMPLOYMENT_TYPE_LABEL, formatJobDate, jobApplyHref } from "@/lib/jobs";

export const revalidate = 120;

type PageProps = { params: Promise<{ slug: string }> };

async function getJob(slug: string): Promise<JobPosting | null> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("job_postings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as JobPosting) ?? null;
}

async function getRelatedJobs(job: JobPosting): Promise<JobPosting[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("job_postings")
    .select("*")
    .eq("status", "published")
    .eq("category", job.category)
    .neq("id", job.id)
    .order("posted_at", { ascending: false })
    .limit(4);
  return (data as JobPosting[]) ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return {};

  const title = `${job.title} tại ${job.company} | Tuyển dụng Tư vấn nghề nghiệp`;
  const description = job.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `/tuyendung/${slug}` },
    openGraph: { title, description, type: "article" },
  };
}

function renderMultiline(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return notFound();

  const related = await getRelatedJobs(job);
  const applyHref = jobApplyHref(job);

  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.posted_at,
    validThrough: job.deadline ?? undefined,
    employmentType: job.employment_type.toUpperCase(),
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location },
    },
  };

  return (
    <main className="jobPage">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/tuyendung">Tuyển dụng</Link>
        <span>/</span>
        <span>{job.title}</span>
      </nav>

      <header className="jobHeader">
        <span className="typeBadge">{EMPLOYMENT_TYPE_LABEL[job.employment_type]}</span>
        <h1>{job.title}</h1>
        <p className="companyLine">
          {job.company} · {job.location}
        </p>
        <div className="factRow">
          {job.salary_display && <span className="salary">{job.salary_display}</span>}
          <span>Ngành: {job.category}</span>
          {job.level && <span>Cấp bậc: {job.level}</span>}
          <span>Đăng ngày {formatJobDate(job.posted_at)}</span>
          {job.deadline && <span>Hạn nộp: {formatJobDate(job.deadline)}</span>}
        </div>
        {applyHref ? (
          <a className="applyCta" href={applyHref} target="_blank" rel="noopener noreferrer">
            Ứng tuyển ngay
          </a>
        ) : (
          <p className="mutedNote">Liên hệ nhà tuyển dụng để biết thêm chi tiết ứng tuyển.</p>
        )}
      </header>

      <section className="jobBody">
        <div className="jobBlock">
          <h2>Mô tả công việc</h2>
          {renderMultiline(job.description).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {job.requirements && (
          <div className="jobBlock">
            <h2>Yêu cầu ứng viên</h2>
            {renderMultiline(job.requirements).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {job.benefits && (
          <div className="jobBlock">
            <h2>Quyền lợi</h2>
            {renderMultiline(job.benefits).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        <div className="interviewPromo">
          <span className="sectionKicker">Chuẩn bị kỹ hơn</span>
          <h2>Luyện phỏng vấn cho vị trí {job.title}</h2>
          <p>
            Luyện trả lời với AI interviewer theo đúng vị trí và ngành {job.category} để tự tin
            hơn trước buổi phỏng vấn thật.
          </p>
          <Link
            className="applyCta"
            href={`/interview?role=${encodeURIComponent(job.title)}`}
          >
            Luyện phỏng vấn AI
          </Link>
        </div>

        {applyHref && (
          <a className="applyCta wide" href={applyHref} target="_blank" rel="noopener noreferrer">
            Ứng tuyển ngay
          </a>
        )}
      </section>

      {related.length > 0 && (
        <section className="relatedSection">
          <span className="sectionKicker">Tin liên quan</span>
          <h2>Vị trí khác cùng ngành {job.category}</h2>
          <div className="relatedGrid">
            {related.map((item) => (
              <Link key={item.id} href={`/tuyendung/${item.slug}`} className="relatedCard">
                <span className="typeBadge">{EMPLOYMENT_TYPE_LABEL[item.employment_type]}</span>
                <strong>{item.title}</strong>
                <span className="companyLine">{item.company}</span>
                <span className="mutedNote">{item.location}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />

      <style>{`
        .jobPage {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 20px 60px;
          color: #172033;
          background: #f6f7f4;
        }
        .breadcrumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #65705f;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .breadcrumbs a {
          color: #334155;
          text-decoration: none;
        }
        .jobHeader {
          display: grid;
          gap: 12px;
          padding-bottom: 24px;
          border-bottom: 1px solid #d8ddd2;
          margin-bottom: 28px;
        }
        .typeBadge {
          width: fit-content;
          border: 1px solid #cfd7ca;
          border-radius: 999px;
          padding: 4px 12px;
          font-weight: 800;
          font-size: 12px;
          color: #2f6f4f;
        }
        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 42px);
          line-height: 1.1;
          color: #111827;
        }
        .companyLine {
          color: #172033;
          font-weight: 700;
          font-size: 16px;
        }
        .factRow {
          display: flex;
          gap: 8px 16px;
          flex-wrap: wrap;
          color: #475569;
          font-size: 14px;
        }
        .salary {
          color: #2f6f4f;
          font-weight: 800;
        }
        .applyCta {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          border-radius: 8px;
          padding: 0 20px;
          background: #172033;
          color: #ffffff;
          font-weight: 800;
          text-decoration: none;
          margin-top: 8px;
        }
        .applyCta.wide {
          width: 100%;
        }
        .mutedNote {
          color: #65705f;
          font-size: 14px;
        }
        .jobBody {
          display: grid;
          gap: 28px;
        }
        .jobBlock {
          display: grid;
          gap: 10px;
        }
        h2 {
          margin: 0;
          font-size: 22px;
          color: #111827;
        }
        .jobBlock p {
          margin: 0;
          color: #334155;
          line-height: 1.75;
        }
        .interviewPromo {
          display: grid;
          gap: 10px;
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
          padding: 22px;
        }
        .sectionKicker {
          color: #2f6f4f;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .interviewPromo p {
          margin: 0;
          color: #475569;
          line-height: 1.7;
        }
        .relatedSection {
          margin-top: 40px;
          padding-top: 28px;
          border-top: 1px solid #d8ddd2;
          display: grid;
          gap: 14px;
        }
        .relatedGrid {
          display: grid;
          gap: 12px;
        }
        .relatedCard {
          display: grid;
          gap: 6px;
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
          padding: 16px;
          text-decoration: none;
          color: #172033;
        }
        .relatedCard strong {
          font-size: 17px;
        }
        @media (min-width: 640px) {
          .relatedGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}
