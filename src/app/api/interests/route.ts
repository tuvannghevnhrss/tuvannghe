import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supa
    .from("knowdell_interests")
    .select("interest_key")
    .eq("user_id", user.id)
    .order("interest_key",{ascending:true});

  return NextResponse.json((data ?? []).map((r) => r.interest_key));
}

export async function POST(req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const list: string[] = await req.json();

  /* xóa cũ, rồi insert mới */
  await supa.from("knowdell_interests").delete().eq("user_id", user.id);
  if (list.length) {
    await supa.from("knowdell_interests").insert(
      list.map((vi) => ({
        user_id: user.id,
        interest_key: vi,
        bucket: "very_interested",
      }))
    );
  }
  return NextResponse.json({ ok: true });
}
