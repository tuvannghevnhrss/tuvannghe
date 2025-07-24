/* ------------------------------------------------------------------------- *
   /api/career/analyse      GET  → lấy markdown đã phân tích
                            POST → chạy GPT, lưu & trả về markdown mới
 * ------------------------------------------------------------------------- */
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabaseServer";
import { analyseKnowdell } from "@/lib/career/analyseKnowdell";
import { matchJobs }       from "@/lib/career/matchJobs";

export const dynamic = "force-dynamic";                 // luôn chạy server

/* ------------------------------------------------------------------ GET -- */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data, error } = await supabase
    .from("career_profiles")
    .select("suggested_jobs")
    .eq("user_id", user.id)
    .single();

  if (error)  return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.suggested_jobs)
              return NextResponse.json({ markdown: null }, { status: 204 });

  return NextResponse.json({ markdown: data.suggested_jobs });
}

/* ----------------------------------------------------------------- POST -- */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  /* Lấy Holland + Knowdell từ DB (đã lưu sau bước trắc nghiệm) */
  const { data: profile, error } = await supabase
    .from("career_profiles")
    .select("holland, knowdell")
    .eq("user_id", user.id)
    .single();

  if (error)  return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile?.holland || !profile?.knowdell)
    return NextResponse.json({ error: "insufficient_data" }, { status: 400 });

  /* ------------------- Gọi GPT / hàm phân tích --------------------------- */
  const analysisMd = await analyseKnowdell(profile.holland, profile.knowdell); // Markdown
  const jobsMd     = await matchJobs(analysisMd);                              // Markdown TOP-5

  const markdown   = `${analysisMd}\n\n${jobsMd}`.trim();

  /* Lưu vào DB để lần sau GET đọc được ngay */
  await supabase
    .from("career_profiles")
    .update({ suggested_jobs: markdown })
    .eq("user_id", user.id);

  return NextResponse.json({ markdown });
}
