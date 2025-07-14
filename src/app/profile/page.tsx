// -----------------------------------------------------------------------------
// src/app/profile/page.tsx
// Hồ sơ nghề nghiệp — 4 bước: Đặc tính · Lựa chọn · Mục tiêu · Kế hoạch
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import Link         from "next/link";
import StepTabs     from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadar";
import OptionsTab   from "@/components/OptionsTab";
import FocusTab     from "@/components/FocusTab";
import PlanTab      from "@/components/PlanTab";

import { MBTI_MAP } from "@/lib/mbtiDescriptions";        // 👈 Thêm dòng này

import {
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/* ── MÔ TẢ Holland (giữ nguyên) ───────────────────────────────────────────── */
const H_DESC: Record<string, string> = {
  R:"Realistic – Ưa hành động, thao tác với vật thể.",
  I:"Investigative – Phân tích, khám phá, nghiên cứu.",
  A:"Artistic – Sáng tạo, trực giác, biểu đạt ý tưởng.",
  S:"Social – Hỗ trợ, hợp tác, giúp đỡ người khác.",
  E:"Enterprising – Thuyết phục, lãnh đạo, kinh doanh.",
  C:"Conventional – Tỉ mỉ, dữ liệu, quy trình, tổ chức.",
};

const toMap = (rows:any[], key:string) => {
  const m=new Map<string,string>();
  rows?.forEach(r=>m.set(r[key],r.vi));
  return m;
};

export default async function Profile({ searchParams }:{searchParams?:{step?:string}}){
  const step = searchParams?.step ?? "trait";   // trait | options | focus | plan

  /* 1. Supabase + Auth ------------------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2. Hồ sơ ----------------------------------------------------------------- */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti,holland,knowdell,suggested_jobs")
    .eq("user_id", user.id)
    .single();
  if(!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3. Goal & Actions -------------------------------------------------------- */
  const { data: goal } = await supabase
    .from("career_goals")
    .select("what,why")
    .eq("user_id", user.id)
    .single();
  const { data: actions } = await supabase
    .from("career_actions")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline",{ascending:true});

  /* 4. Knowdell VN ----------------------------------------------------------- */
  const kb = profile.knowdell ?? {};
  const valueKeys    = (kb.values    ?? []).map((v:any)=>v.value_key);
  const skillKeys    = (kb.skills    ?? []).map((s:any)=>s.skill_key);
  const interestKeys = (kb.interests ?? []).map((i:any)=>i.interest_key);

  const [vL,sL,iL] = await Promise.all([
    valueKeys.length   ? supabase.from("lookup_values")   .select("value_key,vi").in("value_key",valueKeys)   : {data:[]},
    skillKeys.length   ? supabase.from("lookup_skills")   .select("skill_key,vi").in("skill_key",skillKeys)   : {data:[]},
    interestKeys.length? supabase.from("lookup_interests").select("interest_key,vi").in("interest_key",interestKeys) : {data:[]},
  ]);
  const valuesVI    = valueKeys   .map(k=>toMap(vL.data!,"value_key")   .get(k)??k);
  const skillsVI    = skillKeys   .map(k=>toMap(sL.data!,"skill_key")   .get(k)??k);
  const interestsVI = interestKeys.map(k=>toMap(iL.data!,"interest_key").get(k)??k);

  /* 5. Holland radar --------------------------------------------------------- */
  const hollCode   = profile.holland?.code as string | undefined;
  const hollandRadar = profile.holland_profile
    ? Object.entries(profile.holland_profile).map(([name,score])=>({name,score}))
    : [];

  /* 6. JSX ------------------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề</h1>

      <StepTabs current={step} />

      {/* TAB 1 – Đặc tính */}
      {step==="trait" && (
        <>
          {/* MBTI + Holland */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* MBTI */}
            <div className="border rounded-lg p-5 bg-white shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">MBTI</h2>
              {profile.mbti?.type ? (
                <>
                  <p className="text-2xl font-bold">{profile.mbti.type}</p>
                  <p>{MBTI_MAP[profile.mbti.type]?.intro ?? "Đang cập nhật mô tả."}</p>
                </>
              ) : (
                <p className="italic text-gray-500">
                  Chưa làm <Link href="/mbti" className="underline text-indigo-600">MBTI</Link>
                </p>
              )}
            </div>

            {/* Holland */}
            <div className="border rounded-lg p-5 bg-white shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">Holland</h2>
              {hollCode ? (
                <>
                  <p className="text-2xl font-bold">{hollCode}</p>
                  <p className="text-sm">{hollCode.split("").map(c=>H_DESC[c]).join(" | ")}</p>
                  {hollandRadar.length>0 && (
                    <div className="mt-4">
                      <HollandRadar data={hollandRadar}/>
                    </div>
                  )}
                </>
              ) : (
                <p className="italic text-gray-500">
                  Chưa làm <Link href="/holland" className="underline text-indigo-600">Holland</Link>
                </p>
              )}
            </div>
          </section>

          {/* Knowdell */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tóm tắt Knowdell</h2>
            <ul className="list-disc ml-5 leading-relaxed">
              <li><b>Giá trị cốt lõi:</b> {valuesVI.length?valuesVI.join(", "):<i className="text-gray-500">chưa chọn</i>}</li>
              <li><b>Kỹ năng động lực:</b> {skillsVI.length?skillsVI.slice(0,5).join(", ")+(skillsVI.length>5?" …":""):<i className="text-gray-500">chưa chọn</i>}</li>
              <li><b>Sở thích nổi bật:</b> {interestsVI.length?interestsVI.slice(0,5).join(", ")+(interestsVI.length>5?" …":""):<i className="text-gray-500">chưa chọn</i>}</li>
            </ul>
          </section>
        </>
      )}

      {/* TAB 2 – Lựa chọn */}
      {step==="options" && (
        <OptionsTab
          mbti={profile.mbti?.type}
          holland={hollCode}
          knowdell={profile.knowdell}
          initialJobs={profile.suggested_jobs ?? []}
        />
      )}

      {/* TAB 3 – Mục tiêu */}
      {step==="focus" && (
        <FocusTab existingGoal={goal ?? null}/>
      )}

      {/* TAB 4 – Kế hoạch */}
      {step==="plan" && (
        <PlanTab actions={actions ?? []}/>
      )}
    </div>
  );
}
