'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BlogCategory, BlogPost } from './blog-data';

type Props = {
  posts: BlogPost[];
  categories: Array<'Tất cả' | BlogCategory>;
};

export default function BlogIndexClient({ posts, categories }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<(typeof categories)[number]>('Tất cả');

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return posts.filter((post) => {
      const matchCat = cat === 'Tất cả' ? true : post.category === cat;
      const matchText =
        !keyword ||
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt.toLowerCase().includes(keyword) ||
        post.audience.toLowerCase().includes(keyword);

      return matchCat && matchText;
    });
  }, [q, cat, posts]);

  const featured = filtered[0];
  const secondaryPosts = filtered.slice(1);

  return (
    <section className="articleSection" aria-labelledby="article-heading">
      <div className="articleHeader">
        <div>
          <span className="sectionKicker">Bài viết</span>
          <h2 id="article-heading">Đọc theo chủ đề bạn đang cần</h2>
        </div>
        <span className="resultCount">{filtered.length} bài</span>
      </div>

      <div className="controls">
        <label className="searchLabel">
          <span>Tìm bài viết</span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Ví dụ: Holland, MBTI, chọn nghề..."
            aria-label="Tìm kiếm bài viết"
          />
        </label>

        <div className="chips" aria-label="Lọc theo chuyên mục">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={item === cat ? 'active' : ''}
              onClick={() => setCat(item)}
              aria-pressed={item === cat}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {featured ? (
        <article className="featuredArticle">
          <div className="articleMeta">
            <span>{featured.category}</span>
            <span>{featured.audience}</span>
            <time>{formatDate(featured.date)}</time>
            <span>{featured.readTime}</span>
          </div>
          <h3>
            <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
          </h3>
          <p>{featured.excerpt}</p>
          <Link className="readLink" href={`/blog/${featured.slug}`}>
            Đọc bài viết
          </Link>
        </article>
      ) : (
        <div className="emptyState">
          Không có bài viết nào khớp bộ lọc hiện tại. Hãy thử tìm theo MBTI, Holland hoặc chọn nghề.
        </div>
      )}

      {secondaryPosts.length > 0 && (
        <div className="articleList">
          {secondaryPosts.map((post) => (
            <article key={post.slug} className="articleRow">
              <div className="articleMeta">
                <span>{post.category}</span>
                <span>{post.audience}</span>
                <time>{formatDate(post.date)}</time>
                <span>{post.readTime}</span>
              </div>
              <h3>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p>{post.excerpt}</p>
              <Link className="readLink" href={`/blog/${post.slug}`}>
                Xem chi tiết
              </Link>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .articleSection {
          display: grid;
          gap: 18px;
        }
        .articleHeader {
          display: flex;
          gap: 14px;
          align-items: end;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid #d8ddd2;
        }
        .sectionKicker {
          display: block;
          margin-bottom: 8px;
          color: #2f6f4f;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        h2,
        h3,
        p {
          margin: 0;
        }
        h2 {
          color: #111827;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: 0;
        }
        .resultCount {
          flex: none;
          color: #65705f;
          font-size: 14px;
          font-weight: 800;
        }
        .controls {
          display: grid;
          gap: 12px;
        }
        .searchLabel {
          display: grid;
          gap: 8px;
          color: #334155;
          font-size: 14px;
          font-weight: 800;
        }
        .searchLabel input {
          width: 100%;
          min-height: 46px;
          border: 1px solid #cfd7ca;
          border-radius: 8px;
          background: #ffffff;
          color: #172033;
          padding: 0 14px;
          font-size: 15px;
          outline: none;
        }
        .searchLabel input:focus {
          border-color: #2f6f4f;
          box-shadow: 0 0 0 3px rgba(47, 111, 79, 0.14);
        }
        .chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .chips button {
          flex: none;
          min-height: 38px;
          border: 1px solid #cfd7ca;
          border-radius: 8px;
          background: #ffffff;
          color: #172033;
          padding: 0 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .chips button.active {
          background: #172033;
          border-color: #172033;
          color: #ffffff;
        }
        .featuredArticle,
        .articleRow,
        .emptyState {
          border: 1px solid #d8ddd2;
          border-radius: 8px;
          background: #ffffff;
        }
        .featuredArticle {
          display: grid;
          gap: 14px;
          padding: 22px;
        }
        .articleList {
          display: grid;
          gap: 12px;
        }
        .articleRow {
          display: grid;
          gap: 10px;
          padding: 18px;
        }
        .articleMeta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #65705f;
          font-size: 13px;
        }
        .articleMeta span,
        .articleMeta time {
          display: inline-flex;
          align-items: center;
        }
        .articleMeta span:not(:last-child)::after,
        .articleMeta time::after {
          content: '';
          width: 4px;
          height: 4px;
          margin-left: 8px;
          border-radius: 999px;
          background: #aab4a4;
        }
        .featuredArticle h3,
        .articleRow h3 {
          letter-spacing: 0;
          line-height: 1.18;
        }
        .featuredArticle h3 {
          font-size: 34px;
        }
        .articleRow h3 {
          font-size: 23px;
        }
        h3 a {
          color: #111827;
          text-decoration: none;
        }
        h3 a:hover {
          text-decoration: underline;
        }
        .featuredArticle p,
        .articleRow p,
        .emptyState {
          color: #475569;
          line-height: 1.7;
        }
        .readLink {
          width: fit-content;
          color: #2f6f4f;
          font-weight: 800;
          text-decoration: none;
        }
        .readLink:hover {
          text-decoration: underline;
        }
        .emptyState {
          padding: 18px;
        }
        @media (max-width: 640px) {
          .articleHeader {
            align-items: start;
            flex-direction: column;
          }
          .featuredArticle h3 {
            font-size: 28px;
          }
          .articleRow h3 {
            font-size: 21px;
          }
        }
      `}</style>
    </section>
  );
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}
