import { createClient } from "@supabase/supabase-js";

function decodeProjectRef(apiKey: string) {
  try {
    const payload = apiKey.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { ref?: string };

    return parsed.ref ?? null;
  } catch {
    return null;
  }
}

function resolveSupabaseConfig() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const apiKey = serviceRoleKey ?? anonKey;

  if (!apiKey) {
    throw new Error("Missing Supabase API key");
  }

  const configuredUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const refFromKey = decodeProjectRef(apiKey);
  const derivedUrl = refFromKey ? `https://${refFromKey}.supabase.co` : null;

  const url =
    configuredUrl && (!derivedUrl || configuredUrl === derivedUrl)
      ? configuredUrl
      : derivedUrl;

  if (!url) {
    throw new Error("Missing Supabase URL");
  }

  return { url, apiKey };
}

export function createInterviewSupabaseClient() {
  const { url, apiKey } = resolveSupabaseConfig();

  return createClient(url, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
