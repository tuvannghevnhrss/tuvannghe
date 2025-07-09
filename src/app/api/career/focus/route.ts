import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { what, why } = await req.json();
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  await supabase
    .from("career_goals")
    .upsert({ user_id: user.id, what, why, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
