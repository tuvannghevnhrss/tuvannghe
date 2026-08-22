import { createHash } from "crypto";
import { createInterviewSupabaseClient } from "../_lib/supabase";

const BUCKET = "interview-audio";
const SIGNED_URL_TTL = 3600; // 1 hour

function textHash(text: string, voice: string) {
  return createHash("sha256").update(`${text}:${voice}`).digest("hex").slice(0, 16);
}

/**
 * GET /api/interview/tts?text=...&voice=shimmer
 * Returns { url: string } for pre-generated audio only.
 *
 * Module 1 uses fixed question audio. Missing cache entries must be seeded via
 * POST /api/interview/tts/seed instead of generated during user sessions.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text")?.trim() ?? "";
  const voice = (searchParams.get("voice") ?? "shimmer") as "alloy" | "nova" | "shimmer";

  if (!text) return Response.json({ error: "TEXT_REQUIRED" }, { status: 400 });

  const hash = textHash(text, voice);
  const supabase = createInterviewSupabaseClient();

  // ── 1. Check cache ────────────────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("interview_tts_cache")
    .select("storage_path")
    .eq("text_hash", hash)
    .eq("voice", voice)
    .maybeSingle();

  if (cached?.storage_path) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(cached.storage_path, SIGNED_URL_TTL);

    if (signed?.signedUrl) {
      return Response.json({ url: signed.signedUrl, cached: true });
    }
  }

  return Response.json(
    { error: "TTS_CACHE_MISS", message: "Question audio has not been seeded yet." },
    { status: 404 }
  );
}
