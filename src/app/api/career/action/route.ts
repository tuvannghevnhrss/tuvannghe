import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { what, who, deadline, goalId } = await req.json();   // ★ who + goalId
  if (!what || !who || !deadline)
    return NextResponse.json({ error:"missing field" }, { status:400 });

  const supabase = await createSupabaseRouteServerClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"unauth" }, { status:401 });

  const { error } = await supabase.from("career_actions").insert({
    user_id : user.id,
    goal_id : goalId ?? null,        // nếu bảng yêu cầu, truyền vào
    what,
    who,                             // ★ đúng tên cột
    deadline,
  });

  if (error) {
    console.error("career_actions insert error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
  return NextResponse.json({ ok:true });
}
