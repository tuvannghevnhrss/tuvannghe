import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfTodayVN(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const midnightVN = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  return new Date(midnightVN.getTime() - VN_OFFSET_MS).toISOString();
}

function startOfMonthVN(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const monthStartVN = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1));
  return new Date(monthStartVN.getTime() - VN_OFFSET_MS).toISOString();
}

export type AiUsageSummary = {
  costToday: number;
  costMtd: number;
  callsToday: number;
  errorCallsToday: number;
  byRoute: { route: string; cost: number; calls: number }[];
  byModel: { model: string; cost: number; calls: number }[];
};

export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const supabase = createSupabaseAdminClient();
  const todayStart = startOfTodayVN();
  const monthStart = startOfMonthVN();

  const [todayRes, mtdRes] = await Promise.all([
    supabase.from("ai_usage_logs").select("cost_usd, route, model, status").gte("created_at", todayStart),
    supabase.from("ai_usage_logs").select("cost_usd").gte("created_at", monthStart),
  ]);

  const todayRows = (todayRes.data ?? []) as { cost_usd: number; route: string; model: string; status: string }[];
  const mtdRows = (mtdRes.data ?? []) as { cost_usd: number }[];

  const byRouteMap = new Map<string, { cost: number; calls: number }>();
  const byModelMap = new Map<string, { cost: number; calls: number }>();
  let errorCallsToday = 0;

  for (const r of todayRows) {
    const route = byRouteMap.get(r.route) ?? { cost: 0, calls: 0 };
    route.cost += r.cost_usd ?? 0;
    route.calls += 1;
    byRouteMap.set(r.route, route);

    const model = byModelMap.get(r.model) ?? { cost: 0, calls: 0 };
    model.cost += r.cost_usd ?? 0;
    model.calls += 1;
    byModelMap.set(r.model, model);

    if (r.status === "error") errorCallsToday += 1;
  }

  return {
    costToday: todayRows.reduce((s, r) => s + (r.cost_usd ?? 0), 0),
    costMtd: mtdRows.reduce((s, r) => s + (r.cost_usd ?? 0), 0),
    callsToday: todayRows.length,
    errorCallsToday,
    byRoute: Array.from(byRouteMap.entries())
      .map(([route, v]) => ({ route, ...v }))
      .sort((a, b) => b.cost - a.cost),
    byModel: Array.from(byModelMap.entries())
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost),
  };
}

export type RecentAiCall = {
  id: string;
  route: string;
  model: string;
  costUsd: number;
  latencyMs: number | null;
  status: string;
  createdAt: string;
};

export async function listRecentAiCalls(limit = 30): Promise<RecentAiCall[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("id, route, model, cost_usd, latency_ms, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    route: r.route,
    model: r.model,
    costUsd: r.cost_usd,
    latencyMs: r.latency_ms,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/** Ngưỡng cảnh báo chi phí AI/ngày (USD) — tĩnh cho tới khi có System Settings (M5). */
export const AI_DAILY_BUDGET_USD = 20;
