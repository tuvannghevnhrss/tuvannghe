/* src/components/StatBox.tsx */
export default function StatBox(
  { label, value }: { label: string; value: string }
) {
  return (
    <div className="border rounded p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
