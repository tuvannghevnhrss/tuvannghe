-- TTS audio cache: maps (text_hash, voice) → storage path
-- Avoids re-generating TTS for the same question text across sessions

CREATE TABLE IF NOT EXISTS interview_tts_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash    text NOT NULL,           -- first 16 hex chars of sha256(text:voice)
  voice        text NOT NULL DEFAULT 'shimmer',
  storage_path text NOT NULL,           -- path inside interview-audio bucket
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (text_hash, voice)
);

-- Allow authenticated users to read (to fetch signed URLs server-side)
ALTER TABLE interview_tts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON interview_tts_cache
  USING (true)
  WITH CHECK (true);

-- Index for fast cache lookup
CREATE INDEX IF NOT EXISTS idx_tts_cache_hash_voice
  ON interview_tts_cache (text_hash, voice);
