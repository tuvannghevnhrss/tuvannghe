import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const { code } = await req.json();              // { code:"RIA" }
  const supabase = createRouteHandlerClient({ cookies });

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  await supabase.from("holland_results").insert({ user_id: uid, code });

  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: uid, holland: { code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
