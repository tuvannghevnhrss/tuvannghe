"use client";

import type { InterviewReport } from "@/lib/m3/evaluator";
import { RECOMMENDATION_LABEL } from "./api";
import { Alert, btnSecondary, Card, Chip } from "./ui";

const FIT_LABEL: Record<string, string> = { very_high: "Rất phù hợp", high: "Phù hợp", medium: "Phù hợp một phần", low: "Chưa phù hợp" };
const SCORE_LABEL = ["", "Không đáp ứng", "Đáp ứng thấp", "Đáp ứng cơ bản", "Đáp ứng tốt", "Vượt kỳ vọng"];
const CONSISTENCY: Record<string, { label: string; tone: "emerald" | "rose" | "amber" | "slate" }> = {
  consistent: { label: "Thống nhất", tone: "emerald" },
  inconsistent: { label: "Chưa thống nhất", tone: "rose" },
  unverified: { label: "Cần xác minh", tone: "amber" },
  not_discussed: { label: "Chưa được hỏi", tone: "slate" },
};

function Radar({ items }: { items: { name: string; score: number }[] }) {
  const n = items.length;
  if (n < 3) return null;
  const size = 320;
  const c = size / 2;
  const r = 105;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 5), c + Math.sin(a) * r * (v / 5)] as const;
  };
  const poly = items.map((it, i) => pt(i, it.score).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[380px]" role="img" aria-label="Biểu đồ radar năng lực">
      {[1, 2, 3, 4, 5].map((lv) => (
        <polygon key={lv} points={items.map((_, i) => pt(i, lv).join(",")).join(" ")} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {items.map((_, i) => {
        const [x, y] = pt(i, 5);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" />;
      })}
      <polygon points={poly} fill="rgba(5,150,105,0.25)" stroke="#059669" strokeWidth="2" />
      {items.map((it, i) => {
        const [x, y] = pt(i, it.score);
        const [lx, ly] = pt(i, 5.9);
        return (
          <g key={it.name}>
            <circle cx={x} cy={y} r="3.5" fill="#059669" />
            <text x={lx} y={ly} fontSize="9.5" textAnchor={lx < c - 5 ? "end" : lx > c + 5 ? "start" : "middle"} fill="#475569">
              {it.name.length > 22 ? `${it.name.slice(0, 21)}…` : it.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Check({ ok }: { ok: boolean }) {
  return <span className={ok ? "text-emerald-600" : "text-slate-300"} aria-label={ok ? "có" : "thiếu"}>{ok ? "✔" : "✖"}</span>;
}

export default function ReportTab({ report, candidateName, jobTitle }: { report: InterviewReport | null; candidateName: string; jobTitle: string }) {
  if (!report) return <Alert tone="slate">Chưa có báo cáo. Báo cáo được tạo tự động sau khi bạn kết thúc buổi phỏng vấn.</Alert>;
  const reco = RECOMMENDATION_LABEL[report.recommendation];

  return (
    <div className="space-y-5">
      {/* 1–3: thông tin, mức phù hợp, đề xuất */}
      <Card
        title="Báo cáo đánh giá ứng viên"
        subtitle={`Ứng viên: ${candidateName || "—"} · Vị trí: ${jobTitle || "—"}`}
        right={<button className={btnSecondary} onClick={() => window.print()}>In / Lưu PDF</button>}
      >
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] border-emerald-500">
            <span className="text-4xl font-bold text-slate-950">{report.overall_score}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">/ 100</span>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${reco?.tone ?? ""}`}>{reco?.label ?? report.recommendation}</span>
              <Chip tone="indigo">Mức phù hợp JD: {FIT_LABEL[report.fit_label]}</Chip>
              <Chip>Điểm TB có trọng số: {report.weighted_average}/5</Chip>
              <Chip tone={report.coverage >= 0.8 ? "emerald" : report.coverage >= 0.6 ? "amber" : "rose"}>Độ phủ bằng chứng: {Math.round(report.coverage * 100)}%</Chip>
            </div>
            <p className="text-sm leading-7 text-slate-700">{report.summary}</p>
            <p className="text-sm leading-7 text-slate-600"><span className="font-medium text-slate-800">Lý do đề xuất:</span> {report.recommendation_rationale}</p>
            {report.recommendation_note && <Alert tone="amber">{report.recommendation_note}</Alert>}
          </div>
        </div>
        {report.quality.low_data && <div className="mt-4"><Alert tone="amber">Buổi phỏng vấn có ít câu trả lời ({report.quality.answered_turns}) nên đánh giá chỉ mang tính tham khảo.</Alert></div>}
      </Card>

      {/* 4: bảng điểm */}
      <Card title="Bảng điểm năng lực" subtitle="Thang 1–5. Điểm tổng tính theo trọng số trên các năng lực đã có bằng chứng; năng lực chưa được hỏi đủ sâu được đánh dấu riêng và không bị tính là điểm thấp.">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Radar items={report.competencies.map((c) => ({ name: c.name, score: c.score }))} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Năng lực</th><th className="px-3 py-2 text-right">Trọng số</th><th className="px-3 py-2 text-right">Điểm</th><th className="py-2 pl-3">Mức</th>
                </tr>
              </thead>
              <tbody>
                {report.competencies.map((c) => (
                  <tr key={c.competency_id} className="border-b border-slate-100 align-top">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{c.name}{c.insufficient_data && <span className="ml-2"><Chip tone="amber">thiếu bằng chứng</Chip></span>}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{Math.round(c.weight * 100)}%</td>
                    <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums text-slate-900">{c.score}</td>
                    <td className="py-2.5 pl-3 text-slate-600">{SCORE_LABEL[c.score]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {report.competencies.map((c) => (
            <details key={c.competency_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">{c.name} — {c.score}/5 <span className="font-normal text-slate-500">· độ tin cậy {c.confidence === "high" ? "cao" : c.confidence === "medium" ? "vừa" : "thấp"}</span></summary>
              <p className="mt-3 text-sm leading-7 text-slate-700">{c.rationale}</p>
              {c.evidence.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {c.evidence.map((e, i) => <li key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-700">“{e.quote}” <span className="not-italic text-xs text-slate-400">— lượt {e.turn_index}</span></li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-amber-700">Chưa có trích dẫn hợp lệ từ transcript cho năng lực này.</p>}
            </details>
          ))}
        </div>
      </Card>

      {/* 5–6 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Điểm mạnh">
          <ul className="space-y-3 text-sm text-slate-700">
            {report.strengths.map((s, i) => <li key={i}>✅ {s.text}{s.quote && <span className="mt-1 block text-xs italic text-slate-500">“{s.quote}”</span>}</li>)}
            {!report.strengths.length && <li className="text-slate-400">Chưa ghi nhận.</li>}
          </ul>
        </Card>
        <Card title="Điểm yếu">
          <ul className="space-y-3 text-sm text-slate-700">
            {report.weaknesses.map((s, i) => <li key={i}>⚠️ {s.text}{s.quote && <span className="mt-1 block text-xs italic text-slate-500">“{s.quote}”</span>}</li>)}
            {!report.weaknesses.length && <li className="text-slate-400">Chưa ghi nhận.</li>}
          </ul>
        </Card>
      </div>

      {/* 7: STAR */}
      <Card title="Phân tích STAR" subtitle="Chỉ áp dụng cho các câu hỏi hành vi / kinh nghiệm.">
        {report.star_analysis.length === 0 ? <p className="text-sm text-slate-400">Không có câu hỏi hành vi để phân tích.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-3">Lượt</th><th className="px-2">S</th><th className="px-2">T</th><th className="px-2">A</th><th className="px-2">R</th><th className="py-2 pl-3">Nhận xét</th></tr></thead>
              <tbody>
                {report.star_analysis.map((s) => (
                  <tr key={s.turn_index} className="border-b border-slate-100 align-top">
                    <td className="py-2.5 pr-3 text-slate-700"><span className="font-semibold">#{s.turn_index}</span> {s.question_summary}</td>
                    <td className="px-2 py-2.5"><Check ok={s.situation} /></td><td className="px-2 py-2.5"><Check ok={s.task} /></td>
                    <td className="px-2 py-2.5"><Check ok={s.action} /></td><td className="px-2 py-2.5"><Check ok={s.result} /></td>
                    <td className="py-2.5 pl-3 text-slate-600">{s.comment}{s.missing.length > 0 && <span className="block text-xs text-amber-700">Thiếu: {s.missing.join(", ")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 8: CV */}
      <Card title="Đối chiếu CV với câu trả lời" subtitle="Khác biệt chưa được xác minh không đồng nghĩa với thiếu trung thực.">
        {report.cv_consistency.length === 0 ? <p className="text-sm text-slate-400">Không có nội dung CV nào được đối chiếu.</p> : (
          <ul className="space-y-3">
            {report.cv_consistency.map((c, i) => {
              const st = CONSISTENCY[c.status];
              return (
                <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><Chip tone={st.tone}>{st.label}</Chip><span className="font-medium text-slate-900">{c.cv_claim}</span></div>
                  {c.candidate_statement && <p className="mt-2 text-slate-600"><span className="font-medium">Ứng viên nói:</span> {c.candidate_statement}</p>}
                  {c.quote && <p className="mt-1 text-xs italic text-slate-500">“{c.quote}”</p>}
                  <p className="mt-2 text-slate-600">{c.note}</p>
                </li>
              );
            })}
          </ul>
        )}
        {report.to_verify.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Nội dung cần xác minh thêm</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">{report.to_verify.map((v, i) => <li key={i}>{v}</li>)}</ul>
          </div>
        )}
      </Card>

      {/* 9–10 */}
      {report.highlights.length > 0 && (
        <Card title="Những câu trả lời nổi bật">
          <ul className="space-y-3">
            {report.highlights.map((h, i) => <li key={i} className="rounded-2xl bg-slate-50 p-4 text-sm"><p className="italic text-slate-800">“{h.quote}” <span className="not-italic text-xs text-slate-400">— lượt {h.turn_index}</span></p><p className="mt-1 text-slate-600">{h.why}</p></li>)}
          </ul>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="3 ưu tiên cần cải thiện">
          <ol className="space-y-3 text-sm text-slate-700">
            {report.top_priorities.map((p, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">{i + 1}</span><span><span className="font-semibold text-slate-900">{p.title}</span><span className="block text-slate-600">{p.detail}</span></span></li>)}
          </ol>
        </Card>
        <Card title="Gợi ý câu trả lời tốt hơn" subtitle="Dùng ví dụ thật của bạn thay cho phần [your example].">
          <ul className="space-y-4 text-sm text-slate-700">
            {report.better_answers.map((b, i) => <li key={i}><p className="font-medium text-slate-900">Lượt {b.turn_index}: {b.question}</p><p className="mt-1 text-slate-600">{b.suggestion}</p></li>)}
            {!report.better_answers.length && <li className="text-slate-400">Chưa có gợi ý.</li>}
          </ul>
        </Card>
      </div>
      <p className="text-xs text-slate-400">Đánh giá do AI tạo từ nội dung buổi phỏng vấn và dùng cho mục đích luyện tập; không thay thế quyết định tuyển dụng của con người. Đã loại {report.quality.dropped_quotes} trích dẫn không thể xác minh với transcript.</p>
    </div>
  );
}
