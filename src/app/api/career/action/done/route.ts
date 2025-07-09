import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, done } = await req.json();
  if (!id || done === undefined)
    return NextResponse.json({ error: "missing field" }, { status: 400 });

  const supa = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { error } = await supa
    .from("career_actions")             // bảng PLURAL
    .update({ done })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
