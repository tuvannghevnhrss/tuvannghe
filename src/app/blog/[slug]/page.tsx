// src/app/blog/[slug]/page.tsx
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const { data: posts } = await supabase.from('posts').select('slug');
  return posts?.map(p => ({ slug: p.slug })) || [];
}

export default async function PostPage({ params }: Props) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!post) return <p className="p-8">Bài viết không tìm thấy.</p>;

  return (
    <>
      <Header />
      <article className="pt-24 container mx-auto px-4 prose prose-lg">
        <h1>{post.title}</h1>
        <time className="text-gray-500">
          {new Date(post.published_at).toLocaleDateString('vi-VN', { dateStyle: 'long' })}
        </time>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content_md}
        </ReactMarkdown>
      </article>
      <Footer />
    </>
  );
}
