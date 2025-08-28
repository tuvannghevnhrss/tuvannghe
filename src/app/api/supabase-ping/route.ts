export const runtime = 'nodejs';

export async function GET() {
  try {
    // Gọi Auth settings – endpoint nhẹ, dùng được với ANON KEY
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    );

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || 'fetch failed' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}