import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/constants";

export async function GET() {
  const supabase = await createSupabaseRouteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  /* A. đã TRẢ PHÍ holland? */
  const { data: paidRow } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("product", "holland")
    .eq("status", STATUS.PAID)
    .maybeSingle();

  /* B. đã có KẾT QUẢ holland? */
  const { data: prof } = await supabase
    .from("career_profiles")
    .select("holland")
    .eq("user_id", user.id)
    .maybeSingle();

  let code: string | null = null;
  if (prof?.holland) {
    code = typeof prof.holland === "string" ? prof.holland : prof.holland.code;
  }

  return NextResponse.json({
    paid: !!paidRow,
    finished: !!code,
    code,
  });
}
