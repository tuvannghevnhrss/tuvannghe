import Link from "next/link";

const TABS = [
  { key: "trait",   label: "1. Đặc tính" },
  { key: "options", label: "2. Lựa chọn" },
  { key: "focus",   label: "3. Mục tiêu" },
  { key: "plan",    label: "4. Kế hoạch" },
];

interface Props {
  step: "trait" | "options" | "focus" | "plan";
}

export default function StepTabs({ step }: Props) {
  return (
    <nav className="flex gap-2 mb-8">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/profile?step=${t.key}`}
          className={`px-4 py-2 rounded ${
            step === t.key
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          prefetch={false}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
