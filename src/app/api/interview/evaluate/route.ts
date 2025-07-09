import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  const { id, qIndex, answer } = await req.json();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("questions")
    .eq("id", id)
    .single();

  const question = session.questions[qIndex].question;
  const prompt = `
    Evaluate ANSWER with STAR (score 0-5 each) + short advice.
    Return JSON {score:{S,T,A,R}, overall, advice}.
    Q: ${question}
    A: ${answer}`;
  const gpt = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  const result = JSON.parse(gpt.choices[0].message.content!);

  await supabase.from("interview_answers").insert({
    id,
    q_index: qIndex,
    answer,
    result,
  });

  return NextResponse.json(result);
}
