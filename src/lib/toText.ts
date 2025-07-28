/* gom mảng/đối-tượng Knowdell → chuỗi hiển thị tiếng Việt */
export function toText(
  raw: any[] | any | undefined,
  dicts: Record<string, string>[]
): string[] {
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const out: string[] = [];

  arr.forEach((it) => {
    // 1. trực tiếp là string
    if (typeof it === "string") return out.push(it.trim());

    // 2. tra cứu theo key thường gặp
    for (const k of ["value_key", "skill_key", "interest_key", "name_vi"]) {
      if (it?.[k]) {
        const key = String(it[k]);
        const vi =
          dicts.reduce<string | undefined>((a, d) => a ?? d[key], undefined) ??
          key;
        return out.push(vi.trim());
      }
    }

    // 3. fallback: chuỗi đầu tiên trong object
    const first = Object.values(it).find((v) => typeof v === "string");
    if (first) out.push(String(first).trim());
  });

  return Array.from(new Set(out)); // loại trùng
}
