import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Kiểu props chuẩn cho App Router */
type PageProps = {
  params: { slug: string };
};

/* ------- ISR / SSG: tạo danh sách slug -------- */
export async function generateStaticParams() {
  const { data } = await supabase.from('posts').select('slug');
  return data?.map((p) => ({ slug: p.slug })) || [];
}

/* ------- Trang bài viết -------- */
export default async function PostPage({ params }: PageProps) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!post) {
    return <p className="p-8">Bài viết không tìm thấy.</p>;
  }

  return (
    <>
      <Header />

      <article className="container mx-auto px-4 pt-24 prose prose-lg">
        <h1>{post.title}</h1>
        <time className="text-gray-500">
          {new Date(post.published_at).toLocaleDateString('vi-VN', {
            dateStyle: 'long',
          })}
        </time>

        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content_md}
        </ReactMarkdown>
      </article>

      <Footer />
    </>
  );
}
