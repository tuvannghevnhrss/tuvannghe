"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JobPosting } from "@/lib/jobs";
import { EMPLOYMENT_TYPE_LABEL, formatJobDate } from "@/lib/jobs";

type Props = {
  jobs: JobPosting[];
  categories: string[];
  locations: string[];
};

const EMPLOYMENT_FILTERS: Array<{ value: JobPosting["employment_type"] | "all"; label: string }> = [
  { value: "all", label: "Tất cả hình thức" },
  { value: "full_time", label: EMPLOYMENT_TYPE_LABEL.full_time },
  { value: "part_time", label: EMPLOYMENT_TYPE_LABEL.part_time },
  { value: "remote", label: EMPLOYMENT_TYPE_LABEL.remote },
  { value: "internship", label: EMPLOYMENT_TYPE_LABEL.internship },
  { value: "contract", label: EMPLOYMENT_TYPE_LABEL.contract },
];

export default function JobsIndexClient({ jobs, categories, locations }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(categories[0] ?? "Tất cả");
  const [loc, setLoc] = useState(locations[0] ?? "Tất cả");
  const [employmentType, setEmploymentType] = useState<(typeof EMPLOYMENT_FILTERS)[number]["value"]>(
    "all"
  );

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchCat = cat === "Tất cả" ? true : job.category === cat;
      const matchLoc = loc === "Tất cả" ? true : job.location === loc;
      const matchType = employmentType === "all" ? true : job.employment_type === employmentType;
      const matchText =
        !keyword ||
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword);
      return matchCat && matchLoc && matchType && matchText;
    });
  }, [q, cat, loc, employmentType, jobs]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <section className="jobsSection" aria-labelledby="jobs-heading">
      <div className="sectionHeader">
        <h2 id="jobs-heading">Danh sách tin tuyển dụng</h2>
        <span className="resultCount">{filtered.length} tin</span>
      </div>

      <div className="controls">
        <div className="searchRow">
          <label className="searchLabel">
            <span>Vị trí, công ty</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Ví dụ: Nhân viên kinh doanh, Marketing..."
              aria-label="Tìm theo vị trí hoặc công ty"
            />
          </label>

          <label className="selectLabel">
            <span>Địa điểm</span>
            <select
              value={loc}
              onChange={(event) => setLoc(event.target.value)}
              aria-label="Lọc theo địa điểm"
            >
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="selectLabel">
            <span>Ngành nghề</span>
            <select
              value={cat}
              onChange={(event) => setCat(event.target.value)}
              aria-label="Lọc theo ngành nghề"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chips" aria-label="Lọc theo hình thức làm việc">
          {EMPLOYMENT_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={item.value === employmentType ? "active" : ""}
              onClick={() => setEmploymentType(item.value)}
              aria-pressed={item.value === employmentType}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {featured ? (
        <article className="featuredJob">
          <div className="jobMeta">
            <span className="typeBadge">{EMPLOYMENT_TYPE_LABEL[featured.employment_type]}</span>
            <span>{featured.category}</span>
            <span>{featured.location}</span>
            <time>{formatJobDate(featured.posted_at)}</time>
          </div>
          <h3>
            <Link href={`/tuyendung/${featured.slug}`}>{featured.title}</Link>
          </h3>
          <p className="companyLine">{featured.company}</p>
          {featured.salary_display && <p className="salaryLine">{featured.salary_display}</p>}
          <Link className="readLink" href={`/tuyendung/${featured.slug}`}>
            Xem chi tiết & ứng tuyển
          </Link>
        </article>
      ) : (
        <div className="emptyState">
          Chưa có tin nào khớp bộ lọc hiện tại. Hãy thử đổi từ khoá, địa điểm, ngành nghề hoặc hình thức làm việc.
        </div>
      )}

      {rest.length > 0 && (
        <div className="jobList">
          {rest.map((job) => (
            <article key={job.id} className="jobRow">
              <div className="jobMeta">
                <span className="typeBadge">{EMPLOYMENT_TYPE_LABEL[job.employment_type]}</span>
                <span>{job.category}</span>
                <span>{job.location}</span>
                <time>{formatJobDate(job.posted_at)}</time>
              </div>
              <h3>
                <Link href={`/tuyendung/${job.slug}`}>{job.title}</Link>
              </h3>
              <p className="companyLine">{job.company}</p>
              {job.salary_display && <p className="salaryLine">{job.salary_display}</p>}
              <Link className="readLink" href={`/tuyendung/${job.slug}`}>
                Xem chi tiết
              </Link>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .jobsSection {
          display: grid;
          gap: 14px;
        }
        .sectionHeader {
          display: flex;
          gap: 12px;
          align-items: baseline;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #d8ddd2;
        }
        h2,
        h3,
        p {
          margin: 0;
        }
        h2 {
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: 0;
        }
        .resultCount {
          flex: none;
          color: #65705f;
          font-size: 12px;
          font-weight: 700;
        }
        .controls {
          display: grid;
          gap: 8px;
        }
        .searchRow {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 8px;
        }
        .searchLabel,
        .selectLabel {
          display: grid;
          gap: 4px;
          color: #65705f;
          font-size: 11px;
          font-weight: 700;
        }
        .searchLabel input,
        .selectLabel select {
          width: 100%;
          min-height: 38px;
          border: 1px solid #cfd7ca;
          border-radius: 6px;
          background: #ffffff;
          color: #172033;
          padding: 0 12px;
          font-size: 13px;
          outline: none;
        }
        .selectLabel select {
          cursor: pointer;
        }
        .searchLabel input:focus,
        .selectLabel select:focus {
          border-color: #2f6f4f;
          box-shadow: 0 0 0 3px rgba(47, 111, 79, 0.14);
        }
        .chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .chips button {
          flex: none;
          min-height: 30px;
          border: 1px solid #cfd7ca;
          border-radius: 6px;
          background: #ffffff;
          color: #172033;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .chips button.active {
          background: #172033;
          border-color: #172033;
          color: #ffffff;
        }
        .featuredJob,
        .jobRow,
        .emptyState {
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
        }
        .featuredJob {
          display: grid;
          gap: 6px;
          padding: 14px 16px;
        }
        .jobList {
          display: grid;
          gap: 8px;
        }
        .jobRow {
          display: grid;
          gap: 4px;
          padding: 12px 16px;
        }
        .jobMeta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          color: #65705f;
          font-size: 11px;
        }
        .jobMeta span,
        .jobMeta time {
          display: inline-flex;
          align-items: center;
        }
        .jobMeta span:not(.typeBadge):not(:last-child)::after,
        .jobMeta time::after {
          content: "";
          width: 3px;
          height: 3px;
          margin-left: 8px;
          border-radius: 999px;
          background: #aab4a4;
        }
        .typeBadge {
          border: 1px solid #cfd7ca;
          border-radius: 999px;
          padding: 1px 8px;
          font-weight: 800;
          color: #2f6f4f;
        }
        .typeBadge::after {
          content: none !important;
        }
        .featuredJob h3,
        .jobRow h3 {
          letter-spacing: 0;
          line-height: 1.25;
        }
        .featuredJob h3 {
          font-size: 17px;
        }
        .jobRow h3 {
          font-size: 15px;
        }
        h3 a {
          color: #111827;
          text-decoration: none;
        }
        h3 a:hover {
          text-decoration: underline;
        }
        .companyLine {
          color: #172033;
          font-size: 13px;
          font-weight: 700;
        }
        .salaryLine {
          color: #2f6f4f;
          font-size: 13px;
          font-weight: 700;
        }
        .emptyState {
          padding: 14px 16px;
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }
        .readLink {
          width: fit-content;
          color: #2f6f4f;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }
        .readLink:hover {
          text-decoration: underline;
        }
        @media (max-width: 720px) {
          .searchRow {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .sectionHeader {
            align-items: start;
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </section>
  );
}
