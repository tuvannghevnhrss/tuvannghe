import { NextResponse } from 'next/server';
import { createSupabaseRouteServerClient } from '@/lib/supabase/server'
export async function PATCH(req: Request) {
  const { goalId, how, when, who } = await req.json();
  if (!goalId) {
    return new NextResponse('Missing goalId', { status: 400 });
  }
  const supabase = await createSupabaseRouteServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const { error } = await supabase
    .from('career_plan')
    .update({ how, when, who })
    .eq('id', goalId)
    .eq('user_id', user.id);
  if (error) {
    console.error("career_plan update error:", error);
    return new NextResponse('INTERNAL_SERVER_ERROR', { status: 500 });
  }
  return NextResponse.json({ success: true });
}
