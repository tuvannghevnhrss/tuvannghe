// src/app/blog/page.tsx
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, published_at')
    .order('published_at', { ascending: false });

  return (
    <>
      <Header />
      <main className="pt-24 container mx-auto px-4">
        <h1 className="text-4xl font-bold my-8">Tin tức</h1>
        {posts && posts.length > 0 ? (
          <ul className="space-y-6">
            {posts.map(post => (
              <li key={post.id} className="border-b pb-4">
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-blue-600 hover:underline">
                    {post.title}
                  </h2>
                </Link>
                <time className="text-gray-500">
                  {new Date(post.published_at).toLocaleDateString('vi-VN')}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có bài viết nào. Vui lòng quay lại sau!</p>
        )}
      </main>
      <Footer />
    </>
  );
}
