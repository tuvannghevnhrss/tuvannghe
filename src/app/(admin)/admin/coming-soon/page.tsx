type Props = { searchParams: Promise<{ title?: string }> };

export default async function ComingSoonPage({ searchParams }: Props) {
  const { title } = await searchParams;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900">{title ?? "Module"}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Module này chưa được triển khai. Xem lộ trình milestone (M0–M6) trong tài liệu thiết kế Back Office để biết
        thứ tự triển khai.
      </p>
    </div>
  );
}
