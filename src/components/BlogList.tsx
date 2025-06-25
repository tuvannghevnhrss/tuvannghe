// src/components/BlogList.tsx
'use client';

import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  published_at: string;
}

export default function BlogList({ posts }: { posts: Post[] }) {
  return (
    <section className="container mx-auto py-12 px-4">
      <h2 className="text-3xl font-semibold mb-6">Tin tức</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div className="p-6 bg-white shadow rounded hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <time className="text-gray-500 text-sm">
                {new Date(post.published_at).toLocaleDateString('vi-VN')}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
