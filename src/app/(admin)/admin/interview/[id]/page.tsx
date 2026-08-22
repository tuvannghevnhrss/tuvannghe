import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { getSessionDetail } from "@/lib/admin/services/interviewOps";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminInterviewSessionDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "interview", "view")) notFound();

  const { id } = await params;
  const detail = await getSessionDetail(id);
  if (!detail) notFound();

  const feedbackByAnswer = new Map(detail.answerFeedback.map((f) => [f.answerId, f]));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/interview" className="text-sm text-slate-500 hover:text-slate-800">
          ← Phỏng vấn AI
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Phiên phỏng vấn — {detail.jobTitle ?? "Không rõ vị trí"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          <Link href={`/admin/users/${detail.userId}`} className="text-emerald-700 hover:underline">
            Xem người dùng
          </Link>{" "}
          · Bắt đầu {formatDate(detail.startedAt)} · Trạng thái {detail.status}
        </p>
      </div>

      {detail.sessionFeedback && (
        <Section title="Tổng kết AI">
          <div className="grid gap-3 sm:grid-cols-4">
            <ScoreCard label="Tổng thể" value={detail.sessionFeedback.overallScore} />
            <ScoreCard label="Giao tiếp" value={detail.sessionFeedback.communicationScore} />
            <ScoreCard label="Nội dung" value={detail.sessionFeedback.contentScore} />
            <ScoreCard label="Tự tin" value={detail.sessionFeedback.confidenceScore} />
          </div>
          {detail.sessionFeedback.summary && <p className="mt-3 text-sm text-slate-700">{detail.sessionFeedback.summary}</p>}
          {detail.sessionFeedback.improvementPlan && (
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-semibold">Gợi ý cải thiện:</span> {detail.sessionFeedback.improvementPlan}
            </p>
          )}
        </Section>
      )}

      <Section title={`Câu trả lời (${detail.answers.length})`}>
        {detail.answers.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có câu trả lời.</p>
        ) : (
          <div className="space-y-4">
            {detail.answers.map((a) => {
              const fb = feedbackByAnswer.get(a.id);
              return (
                <div key={a.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  {a.promptText && <p className="font-medium text-slate-900">{a.promptText}</p>}
                  {a.transcript && <p className="mt-1 text-slate-600">{a.transcript}</p>}
                  {fb && (
                    <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Điểm AI: {fb.score ?? "—"}</span>
                      {fb.strengths.length > 0 && <p className="mt-1">Điểm mạnh: {fb.strengths.join(", ")}</p>}
                      {fb.weaknesses.length > 0 && <p>Cần cải thiện: {fb.weaknesses.join(", ")}</p>}
                      {fb.tips.length > 0 && <p>Gợi ý: {fb.tips.join(", ")}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 text-center">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value ?? "—"}</div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
