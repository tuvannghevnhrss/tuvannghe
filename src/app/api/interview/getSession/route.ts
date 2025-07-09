import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("url,questions")
    .eq("id", id!)
    .single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
