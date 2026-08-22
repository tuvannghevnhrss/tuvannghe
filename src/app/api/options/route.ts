import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { list } = await req.json();              // ["Quản trị nhân sự", …]
  const supa = await createSupabaseRouteServerClient();
  const { data:{ user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauth" },{ status:401 });

  await supa.from("career_options").delete().eq("user_id", user.id);
  await supa.from("career_options").insert(
    list.map((name:string, idx:number)=>({ user_id:user.id, name, order:idx }))
  );
  return NextResponse.json({ ok:true });
}
