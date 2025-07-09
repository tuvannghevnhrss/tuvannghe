import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const body = await req.json();        // { what, why }
  const { data, error } = await supa
    .from("career_goal")
    .upsert({ user_id: session.user.id, ...body })
    .select("id, what, why")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  if (!session) return NextResponse.json({ goal: null });

  const { data } = await supa
    .from("career_goal")
    .select("id, what, why")
    .eq("user_id", session.user.id)
    .single();
  return NextResponse.json({ goal: data });
}
