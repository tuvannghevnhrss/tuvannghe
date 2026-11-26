import type { Metadata } from 'next';
import Link from 'next/link';
import BlogIndexClient from './BlogIndexClient';
import {
  blogCategories,
  blogExploreLinks,
  blogFAQs,
  blogPosts,
  blogReadingPaths,
} from './blog-data';

export const metadata: Metadata = {
  title: 'Blog tư vấn hướng nghiệp | MBTI, Holland, phỏng vấn AI',
  description:
    'Blog của Tư vấn Nghề nghiệp chia sẻ kiến thức hướng nghiệp, MBTI, Holland, chọn nghề phù hợp và luyện phỏng vấn AI cho học sinh, sinh viên, người đi làm.',
  alternates: {
    canonical: '/blog',
  },
  keywords: [
    'blog hướng nghiệp',
    'MBTI',
    'Holland',
    'luyện phỏng vấn AI',
    'chọn nghề phù hợp',
    'tư vấn hướng nghiệp',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Blog tư vấn hướng nghiệp | MBTI, Holland, phỏng vấn AI',
    description:
      'Bài viết về hướng nghiệp, MBTI, Holland, chọn nghề và luyện phỏng vấn AI trên Tư vấn nghề.',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: blogFAQs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="blogPage">
      <header className="blogHero">
        <div className="heroInner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <span>Blog</span>
          </nav>

          <div className="heroGrid">
            <div className="heroCopy">
              <span className="eyebrow">Blog hướng nghiệp TuVanNghe</span>
              <h1>Hướng nghiệp, chọn nghề và luyện phỏng vấn AI</h1>
              <p>
                Các bài viết được sắp theo nhu cầu thật: hiểu bản thân, chọn ngành học, chuẩn bị
                phỏng vấn và đi tiếp sang công cụ phù hợp.
              </p>
            </div>

            <div className="heroSummary" aria-label="Tóm tắt blog">
              {blogPosts.length >= 6 && (
                <div>
                  <strong>{blogPosts.length}</strong>
                  <span>bài viết</span>
                </div>
              )}
              <div>
                <strong>4</strong>
                <span>chủ đề chính</span>
              </div>
              <div>
                <strong>3</strong>
                <span>lộ trình đọc</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="pathBand" aria-labelledby="path-heading">
        <div className="sectionHead">
          <span className="sectionKicker">Bắt đầu ở đây</span>
          <h2 id="path-heading">Chọn lối đọc theo tình huống của bạn</h2>
        </div>

        <div className="pathGrid">
          {blogReadingPaths.map((path, index) => (
            <Link key={path.href} href={path.href} className="pathItem">
              <span className="pathIndex">{String(index + 1).padStart(2, '0')}</span>
              <span className="pathLabel">{path.label}</span>
              <strong>{path.title}</strong>
              <p>{path.description}</p>
              <span className="pathCta">{path.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="contentGrid" aria-label="Nội dung blog">
        <BlogIndexClient posts={blogPosts} categories={blogCategories} />

        <aside className="topicRail" aria-label="Chủ đề liên quan">
          <div className="railBlock">
            <span className="sectionKicker">Chủ đề nổi bật</span>
            <div className="topicLinks">
              {blogExploreLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="railBlock">
            <span className="sectionKicker">Gợi ý tiếp theo</span>
            <h2>Đọc xong thì nên làm gì?</h2>
            <p>
              Nếu bạn đã có định hướng nghề, bước tiếp theo nên là luyện trả lời phỏng vấn theo
              vai trò mong muốn.
            </p>
            <Link className="railCta" href="/interview">
              Vào khu luyện phỏng vấn
            </Link>
          </div>
        </aside>
      </section>

      <section className="faqBand" aria-labelledby="faq-heading">
        <div className="sectionHead">
          <span className="sectionKicker">FAQ</span>
          <h2 id="faq-heading">Câu hỏi thường gặp về blog hướng nghiệp</h2>
        </div>

        <div className="faqGrid">
          {blogFAQs.map((faq) => (
            <details key={faq.question} className="faqItem">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="finalCta">
        <div>
          <span className="sectionKicker">Đi tiếp</span>
          <h2>Biến phần đọc thành hành động cụ thể</h2>
          <p>
            Làm bài test để hiểu bản thân, đọc bài phù hợp, rồi luyện phỏng vấn với tình huống sát
            công việc bạn đang nhắm tới.
          </p>
        </div>
        <div className="ctaGroup">
          <Link className="primaryCta" href="/career">
            Bắt đầu hướng nghiệp
          </Link>
          <Link className="secondaryCta" href="/pricing">
            Xem gói phù hợp
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <style>{`
        .blogPage {
          color: #172033;
          background: #f6f7f4;
        }
        .blogHero,
        .pathBand,
        .contentGrid,
        .faqBand,
        .finalCta {
          max-width: 1180px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }
        .blogHero {
          padding-top: 40px;
          padding-bottom: 34px;
          border-bottom: 1px solid #d8ddd2;
        }
        .heroInner {
          display: grid;
          gap: 26px;
        }
        .breadcrumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #65705f;
          font-size: 14px;
        }
        .breadcrumbs a {
          color: #334155;
          text-decoration: none;
        }
        .heroGrid {
          display: grid;
          gap: 28px;
          align-items: end;
        }
        .heroCopy {
          display: grid;
          gap: 14px;
          max-width: 780px;
        }
        .eyebrow,
        .sectionKicker {
          color: #2f6f4f;
          font-size: 12px;
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
          max-width: 760px;
          font-size: clamp(40px, 7vw, 76px);
          line-height: 0.98;
        }
        h2 {
          font-size: 28px;
          line-height: 1.15;
        }
        p {
          margin: 0;
        }
        .heroCopy p {
          max-width: 660px;
          color: #475569;
          font-size: 18px;
          line-height: 1.7;
        }
        .heroSummary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid #cfd7ca;
          border-bottom: 1px solid #cfd7ca;
        }
        .heroSummary div {
          display: grid;
          gap: 6px;
          padding: 16px 12px;
          border-right: 1px solid #cfd7ca;
        }
        .heroSummary div:last-child {
          border-right: 0;
        }
        .heroSummary strong {
          color: #111827;
          font-size: 30px;
          line-height: 1;
        }
        .heroSummary span {
          color: #65705f;
          font-size: 13px;
        }
        .pathBand,
        .faqBand,
        .finalCta {
          padding-top: 34px;
          padding-bottom: 34px;
        }
        .sectionHead {
          display: grid;
          gap: 8px;
          margin-bottom: 18px;
        }
        .pathGrid {
          display: grid;
          gap: 12px;
        }
        .pathItem {
          display: grid;
          gap: 9px;
          padding: 18px;
          min-height: 220px;
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
          color: #172033;
          text-decoration: none;
        }
        .pathIndex {
          color: #2f6f4f;
          font-weight: 800;
        }
        .pathLabel {
          color: #64748b;
          font-size: 14px;
        }
        .pathItem strong {
          font-size: 22px;
          line-height: 1.2;
        }
        .pathItem p {
          color: #475569;
          line-height: 1.65;
        }
        .pathCta {
          margin-top: auto;
          color: #2f6f4f;
          font-weight: 800;
        }
        .contentGrid {
          display: grid;
          gap: 28px;
          padding-top: 20px;
          padding-bottom: 34px;
        }
        .topicRail {
          display: grid;
          gap: 24px;
          align-content: start;
        }
        .railBlock {
          display: grid;
          gap: 14px;
          padding-top: 18px;
          border-top: 1px solid #d8ddd2;
        }
        .railBlock p {
          color: #475569;
          line-height: 1.7;
        }
        .topicLinks {
          display: grid;
          border-top: 1px solid #d8ddd2;
        }
        .topicLinks a {
          display: grid;
          gap: 5px;
          padding: 14px 0;
          border-bottom: 1px solid #d8ddd2;
          color: #172033;
          text-decoration: none;
        }
        .topicLinks span {
          color: #64748b;
          line-height: 1.55;
          font-size: 14px;
        }
        .railCta,
        .primaryCta,
        .secondaryCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border-radius: 8px;
          padding: 0 16px;
          font-weight: 800;
          text-decoration: none;
        }
        .railCta,
        .primaryCta {
          width: fit-content;
          background: #172033;
          color: #ffffff;
        }
        .secondaryCta {
          color: #172033;
          border: 1px solid #cfd7ca;
          background: #ffffff;
        }
        .faqBand {
          border-top: 1px solid #d8ddd2;
        }
        .faqGrid {
          display: grid;
          gap: 10px;
        }
        .faqItem {
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
          padding: 16px;
        }
        .faqItem summary {
          cursor: pointer;
          list-style: none;
          font-weight: 800;
          color: #172033;
        }
        .faqItem summary::-webkit-details-marker {
          display: none;
        }
        .faqItem p {
          margin-top: 12px;
          color: #475569;
          line-height: 1.7;
        }
        .finalCta {
          display: grid;
          gap: 18px;
          border-top: 1px solid #d8ddd2;
        }
        .finalCta > div:first-child {
          display: grid;
          gap: 10px;
          max-width: 720px;
        }
        .finalCta p {
          color: #475569;
          line-height: 1.7;
        }
        .ctaGroup {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (min-width: 840px) {
          .heroGrid {
            grid-template-columns: minmax(0, 1fr) 360px;
          }
          .pathGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .contentGrid {
            grid-template-columns: minmax(0, 1fr) 320px;
            align-items: start;
          }
          .topicRail {
            position: sticky;
            top: 90px;
          }
          .faqGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .finalCta {
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: end;
          }
        }
        @media (max-width: 640px) {
          .blogHero,
          .pathBand,
          .contentGrid,
          .faqBand,
          .finalCta {
            padding-left: 16px;
            padding-right: 16px;
          }
          h1 {
            font-size: 42px;
          }
          .heroSummary {
            grid-template-columns: 1fr;
          }
          .heroSummary div {
            border-right: 0;
            border-bottom: 1px solid #cfd7ca;
          }
          .heroSummary div:last-child {
            border-bottom: 0;
          }
          .primaryCta,
          .secondaryCta {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
