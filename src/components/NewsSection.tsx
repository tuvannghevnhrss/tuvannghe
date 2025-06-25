// src/components/NewsSection.tsx
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  cover_url?: string;
}

export default function NewsSection({ posts }: { posts: Post[] }) {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Tin tức mới nhất</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block overflow-hidden rounded-lg shadow hover:shadow-lg transition"
            >
              {post.cover_url && (
                <div className="h-48 w-full relative">
                  <Image
                    src={post.cover_url}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                </div>
              )}
              <div className="p-4 bg-white">
                <time className="text-sm text-gray-500">
                  {new Date(post.published_at).toLocaleDateString("vi-VN")}
                </time>
                <h3 className="mt-2 text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {post.title}
                </h3>
                <p className="mt-2 text-gray-600 line-clamp-3">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
