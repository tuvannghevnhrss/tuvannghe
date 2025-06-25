export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props { searchParams: { code?: string } }

export default async function HollandResultPage({ searchParams }: Props) {
  const code = searchParams.code;
  if (!code) redirect("/holland");

  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: result } = await supabase
    .from("holland_results")
    .select("code, created_at")
    .eq("user_id", user.id)
    .single();
  if (!result) redirect("/holland");

  const desc = `Bạn thuộc nhóm Holland ${result.code}. (Mô tả chi tiết tự bổ sung)`;

  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
      <h1 className="text-3xl font-bold">Kết quả Holland: {result.code}</h1>
      <p className="italic text-gray-600">
        {new Date(result.created_at).toLocaleString("vi-VN")}
      </p>
      <div className="bg-white shadow p-6 rounded-lg text-left">{desc}</div>
      <a href="/holland" className="inline-block mt-4 text-blue-600 underline">
        Làm lại bài Holland
      </a>
    </div>
  );
}
