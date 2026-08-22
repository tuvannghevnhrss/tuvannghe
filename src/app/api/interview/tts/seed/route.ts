import { createHash } from "crypto";
import OpenAI from "openai";
import { createInterviewSupabaseClient } from "../../_lib/supabase";
import {
  createClassicInterviewQuestions,
  fallbackExperienceLevels,
  getFallbackQuestions,
  fallbackRoles,
  fallbackDifficultyLevels,
} from "../../_lib/data";

const BUCKET = "interview-audio";
const VOICE = "shimmer" as const;

function textHash(text: string, voice: string) {
  return createHash("sha256").update(`${text}:${voice}`).digest("hex").slice(0, 16);
}

/**
 * POST /api/interview/tts/seed
 * Pre-generates TTS for all fixed questions and uploads to cache.
 * Protected by SEED_SECRET header.
 *
 * Body (optional): { voice: "shimmer" | "nova" | "alloy" }
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const voice: "alloy" | "nova" | "shimmer" = body?.voice ?? VOICE;

  // ── Collect all unique question texts ────────────────────────────────────
  const texts = new Set<string>();

  // 1. Classic questions — 3 groups (junior, mid, senior)
  for (const level of fallbackExperienceLevels) {
    for (const q of createClassicInterviewQuestions(level.id)) {
      texts.add(q.content);
    }
  }

  // 2. Base fallback questions (all role × difficulty × experience combos from bank)
  for (const role of fallbackRoles) {
    for (const diff of fallbackDifficultyLevels) {
      for (const level of fallbackExperienceLevels) {
        for (const q of getFallbackQuestions(Number(role.id), Number(diff.id), Number(level.id))) {
          texts.add(q.content);
        }
      }
    }
  }

  const allTexts = [...texts];
  const supabase = createInterviewSupabaseClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ── Check which texts are already cached ─────────────────────────────────
  const hashes = allTexts.map((t) => textHash(t, voice));
  const { data: existing } = await supabase
    .from("interview_tts_cache")
    .select("text_hash")
    .eq("voice", voice)
    .in("text_hash", hashes);

  const cachedHashes = new Set((existing ?? []).map((r) => r.text_hash));
  const toGenerate = allTexts.filter((t) => !cachedHashes.has(textHash(t, voice)));

  if (toGenerate.length === 0) {
    return Response.json({ message: "All questions already cached", total: allTexts.length, generated: 0 });
  }

  // ── Generate missing TTS in batches of 5 ─────────────────────────────────
  const BATCH = 5;
  let generated = 0;
  const errors: string[] = [];

  for (let i = 0; i < toGenerate.length; i += BATCH) {
    const batch = toGenerate.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (text) => {
        const hash = textHash(text, voice);
        const storagePath = `tts/${voice}/${hash}.mp3`;
        try {
          const res = await openai.audio.speech.create({
            model: "tts-1",
            voice,
            input: text,
            response_format: "mp3",
          });
          const buf = Buffer.from(await res.arrayBuffer());
          const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, buf, { contentType: "audio/mpeg", upsert: true });
          if (uploadErr) throw uploadErr;

          await supabase
            .from("interview_tts_cache")
            .upsert({ text_hash: hash, voice, storage_path: storagePath }, { onConflict: "text_hash,voice" });

          generated++;
        } catch (err) {
          errors.push(`${text.slice(0, 50)}... — ${String(err)}`);
        }
      })
    );
  }

  return Response.json({
    total: allTexts.length,
    alreadyCached: cachedHashes.size,
    generated,
    errors: errors.length ? errors : undefined,
  });
}
