/**
 * Interview access control helpers
 *
 * DB module_type mapping (legacy, do not change — would break existing records):
 *   1 → Module 1  (audio recording + feedback)
 *   3 → Module 2  (live turn-by-turn with TTS)
 *   2 → Module 3  (realtime WebRTC — tracked when session is created)
 */
import { INTERVIEW_PACKAGES } from "@/lib/constants";
import { createInterviewSupabaseClient } from "./supabase";

const DB_MODULE_TYPE = { module1: 1, module2: 3, module3: 2 } as const;

const PACKAGE_PRIORITY: Record<string, number> = {
  interview_premium: 3,
  interview_pro: 2,
  interview_starter: 1,
};

export type AccessInfo = {
  package: string | null;
  packageName: string | null;
  limits: { module1: number | "unlimited"; module2: number | "unlimited"; module3: number | "unlimited" };
  used: { module1: number; module2: number; module3: number };
  remaining: { module1: number | null; module2: number | null; module3: number | null };
};

export async function getInterviewAccess(userId: string): Promise<AccessInfo> {
  const supabase = createInterviewSupabaseClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", userId)
    .eq("status", "paid")
    .in("product", ["interview_starter", "interview_pro", "interview_premium"]);

  const bestPackageId =
    (payments ?? [])
      .sort((a, b) => (PACKAGE_PRIORITY[b.product] ?? 0) - (PACKAGE_PRIORITY[a.product] ?? 0))[0]
      ?.product ?? null;

  const packageMeta = INTERVIEW_PACKAGES.find((p) => p.id === bestPackageId) ?? null;
  const limits = packageMeta?.limits ?? { module1: 0, module2: 0, module3: 0 };

  const [m1, m2, m3] = await Promise.all(
    (["module1", "module2", "module3"] as const).map((key) =>
      supabase
        .from("interview_sessions_v2")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("module_type", DB_MODULE_TYPE[key])
        .then(({ count }) => count ?? 0)
    )
  );

  const used = { module1: m1, module2: m2, module3: m3 };

  const remaining = {
    module1: limits.module1 === "unlimited" ? null : Math.max(0, (limits.module1 as number) - m1),
    module2: limits.module2 === "unlimited" ? null : Math.max(0, (limits.module2 as number) - m2),
    module3: limits.module3 === "unlimited" ? null : Math.max(0, (limits.module3 as number) - m3),
  };

  return { package: bestPackageId, packageName: packageMeta?.name ?? null, limits, used, remaining };
}

/** Trả về true nếu user còn lượt dùng cho module này */
export async function canUseModule(
  userId: string,
  moduleKey: "module1" | "module2" | "module3"
): Promise<boolean> {
  const access = await getInterviewAccess(userId);
  const rem = access.remaining[moduleKey];
  return rem === null /* unlimited */ || rem > 0;
}

export { DB_MODULE_TYPE };
