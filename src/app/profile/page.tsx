// -----------------------------------------------------------------------------
// src/app/profile/page.tsx
// Hồ sơ nghề nghiệp — 4 bước: Đặc tính · Lựa chọn · Mục tiêu · Kế hoạch
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import Link         from "next/link";
import StepTabs     from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadar";
import OptionsTab   from "@/components/OptionsTab";   // ← THÊM LẠI DÒNG NÀY
import FocusTab     from "@/components/FocusTab";
import PlanTab      from "@/components/PlanTab";

import {
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/* ── MÔ TẢ MBTI & Holland ───────────────────────────────────── */
const MBTI_DESC: Record<string, string> = {
  ISTJ:"Thực tế, cẩn trọng, tôn trọng truyền thống và có tổ chức.",
  ISFJ:"Ân cần, trách nhiệm, trung thành, hướng về phục vụ người khác.",
  INFJ:"Trực giác mạnh mẽ, lý tưởng cao, hướng về mục đích sâu sắc.",
  INTJ:"Sáng tạo, phân tích, lập kế hoạch dài hạn, độc lập.",
  ISTP:"Thực tế, khéo tay, thích giải quyết vấn đề trước mắt.",
  ISFP:"Hòa nhã, linh hoạt, trân trọng vẻ đẹp và giá trị cá nhân.",
  INFP:"Đa cảm, lý tưởng, tìm kiếm ý nghĩa cá nhân sâu sắc.",
  INTP:"Phân tích, tò mò, đam mê nghiên cứu lý thuyết.",
  ESTP:"Thực tế, ưa mạo hiểm, thích hành động ngay lập tức.",
  ESFP:"Sôi nổi, thích tương tác, trân trọng niềm vui hiện tại.",
  ENFP:"Sáng tạo, nhiệt huyết, khám phá khả năng và ý tưởng mới.",
  ENTP:"Nhạy bén, thích tranh luận, tìm kiếm giải pháp sáng tạo.",
  ESTJ:"Thực tế, quyết đoán, giỏi tổ chức và điều hành.",
  ESFJ:"Hòa nhập, chu đáo, quan tâm đến người khác.",
  ENFJ:"Dẫn dắt, truyền cảm hứng, quan tâm đến sự phát triển của người khác.",
  ENTJ:"Quyết đoán, chiến lược, giỏi lãnh đạo và quản lý.",
};
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

  /* 1. Supabase + Auth ---------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2. Hồ sơ --------------------------------------------------------- */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti,holland,knowdell,suggested_jobs")
    .eq("user_id", user.id)
    .single();
  if(!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3. Goal & Actions ------------------------------------------------ */
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

  /* 4. Knowdell VN --------------------------------------------------- */
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

  /* 5. Holland radar ------------------------------------------------- */
  const hollCode   = profile.holland?.code as string | undefined;
  const hollandRadar = hollCode && /^[RIASEC]{3}$/.test(hollCode)
    ? (()=>{const w=[3,2,1],s:{[k:string]:number}={R:0,I:0,A:0,S:0,E:0,C:0};
             hollCode.split("").forEach((c,i)=>s[c]+=w[i]);
             return Object.entries(s).map(([k,v])=>({name:k,score:v}));})()
    : [];

  /* 6. JSX ----------------------------------------------------------- */
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
                  <p>{MBTI_DESC[profile.mbti.type]}</p>
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
