// src/app/api/career/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

export async function PATCH(req: Request) {
  const supabase = createRouteHandlerSupabaseClient({ cookies, headers });
  const { goalId, step, what, why, plan } = await req.json();
  if (!goalId) return NextResponse.json({ error: "Missing goalId" }, { status: 400 });

  let updates: any = {};
  if (step === "focus") updates = { what, why };
  else if (step === "plan") updates = { plan };
  else return NextResponse.json({ error: "Invalid step" }, { status: 400 });

  const { error } = await supabase.from("career_goal").update(updates).eq("id", goalId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
