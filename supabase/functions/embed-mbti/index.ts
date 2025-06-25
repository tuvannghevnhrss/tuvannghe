// supabase env automatically injects SUPABASE_URL & SERVICE_ROLE_KEY
import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_KEY") });

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { user_id, mbti_code } = await req.json();

  // nội dung để RAG
  const content = `Kết quả MBTI của user: ${mbti_code}`;

  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const [{ embedding }] = embeddingRes.data;

  await supabase.from("embeddings").insert({
    user_id,
    type: "mbti",
    content,
    embedding,
  });

  return new Response("ok", { status: 201 });
});
