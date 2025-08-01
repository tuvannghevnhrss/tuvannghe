import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) return NextResponse.json([]);

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at");

  return NextResponse.json(data ?? []);
}
