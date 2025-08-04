import React from 'react';
import Link from 'next/link';

const posts = [
  { slug: 'huong-nghiep-cap-3', title: 'Hướng nghiệp từ cấp 3 – Bí quyết chọn nghề phù hợp với bản thân' },
  { slug: 'cach-xac-dinh-nghe', title: 'Cách xác định nghề nghiệp tương lai phù hợp với học sinh cấp 3' }
];

export default function BlogIndex() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Tin tức Hướng nghiệp</h1>
      <ul>
        {posts.map(post => (
          <li key={post.slug} style={{ margin: '1rem 0' }}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}