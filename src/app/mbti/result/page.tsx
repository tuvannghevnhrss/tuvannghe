/* MBTI Result – Server Component */
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { MBTI_MAP } from '@/lib/mbtiDescriptions';

interface Props { searchParams: { code?: string } }

export default async function MbtiResultPage({ searchParams }: Props) {
  const code = (searchParams.code ?? '').toUpperCase();

  /* mã MBTI hợp lệ? */
  if (!/^(E|I)(S|N)(T|F)(J|P)$/.test(code)) redirect('/mbti');

  /* Auth */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/mbti');

  /* Lưu kết quả & hồ sơ (idempotent) */
  await supabase.from('mbti_results').upsert({ user_id: user.id, type: code });
  await supabase
    .from('career_profiles')
    .upsert({ user_id: user.id, mbti_type: code, updated_at: new Date() }, { onConflict: 'user_id' });

  /* Mô tả */
  const desc = MBTI_MAP[code];

  return (
    <section className="mx-auto max-w-3xl py-14 space-y-10 text-center">
      <h1 className="text-4xl font-bold">Kết quả MBTI: {code}</h1>

      <p className="text-lg">{desc?.intro ?? 'Không tìm thấy mô tả.'}</p>

      {desc && (
        <div className="grid gap-6 md:grid-cols-3 text-left">
          <Section title="💪 Thế mạnh"     items={desc.strengths} />
          <Section title="⚠️ Điểm yếu"     items={desc.flaws}     />
          <Section title="🎯 Nghề phù hợp" items={desc.careers}   />
        </div>
      )}

      <a
        href="/profile?step=trait"
        className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Xem Hồ sơ Phát triển nghề
      </a>
    </section>
  );
}

/* helper – chịu được mô tả thiếu field */
function Section({ title, items = [] }: { title: string; items?: string[] }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <ul className="list-disc list-inside space-y-1">
        {items.map((t) => (<li key={t}>{t}</li>))}
      </ul>
    </div>
  );
}
