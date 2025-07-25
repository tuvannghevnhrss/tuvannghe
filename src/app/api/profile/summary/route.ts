import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";     // dùng service-role

export async function GET() {
  const supabase = createSupabaseRouteServerClient(cookies);
  const { data: { session }} = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "AUTH" }, { status: 401 });

  const { data, error } = await supabase
    .from("career_profiles")
    .select("knowdell_summary, suggested_jobs")
    .eq("user_id", session.user.id)
    .single();

  if (error) return NextResponse.json({ error: "DB" }, { status: 500 });
  return NextResponse.json(data);
}
