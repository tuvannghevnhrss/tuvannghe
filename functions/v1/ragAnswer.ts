// /functions/v1/ragAnswer.ts
const systemPrompt = `
Bạn đang là chuyên gia hướng nghiệp.
HỒ SƠ NGƯỜI DÙNG:
MBTI: ${mbti.result}
Holland: ${holland.code}
Career Plan: ${plan.goal}
Chỉ tư vấn trong phạm vi trên, tối đa 150 từ, không lan man.
`;

const contextChunks = await sql`
select content from embeddings
where user_id = ${uid}
order by embedding <-> ${queryEmbedding} limit 8;
`.then(r=>r.map(row=>row.content).join('\n---\n'));

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  stream: true,
  messages: [
    { role:'system', content: systemPrompt + contextChunks },
    { role:'user', content: userMessage }
  ]
});
