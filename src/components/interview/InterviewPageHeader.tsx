type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function InterviewPageHeader({ eyebrow, title, description }: Props) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
