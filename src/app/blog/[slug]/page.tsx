import Header from '@/components/Header';
import Footer  from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 *  Dùng tên khác (BlogPageProps) thay vì “PageProps”
 *  – params.slug: string
 *  – searchParams?: optional
 */
type BlogPageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[]>;
};

/* -------- 1. Tạo danh sách static params (ISR/SSG) -------- */
export async function generateStaticParams(): Promise<
  BlogPageProps['params'][]
> {
  const { data } = await supabase.from('posts').select('slug');
  return data?.map((p) => ({ slug: p.slug })) || [];
}

/* -------- 2. Render trang bài viết -------- */
export default async function BlogPostPage({ params }: BlogPageProps) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!post) return <p className="p-8">Bài viết không tìm thấy.</p>;

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
