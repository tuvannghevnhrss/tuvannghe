import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_KEY") });

serve(async (req) => {
  const { user_id, code, score } = await req.json();
  const content = `Holland result ${code}: ${JSON.stringify(score)}`;
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });
  await supabase.from("embeddings").insert({
    user_id,
    type: "holland",
    content,
    embedding: emb.data[0].embedding,
  });
  return new Response("ok", { status: 201 });
});
