import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const { list } = await req.json();              // ["Quản trị nhân sự", …]
  const supa = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauth" },{ status:401 });

  await supa.from("career_options").delete().eq("user_id", user.id);
  await supa.from("career_options").insert(
    list.map((name:string, idx:number)=>({ user_id:user.id, name, order:idx }))
  );
  return NextResponse.json({ ok:true });
}
