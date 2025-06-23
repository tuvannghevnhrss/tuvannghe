// src/app/mbti-test/[qid]/page.tsx

import QuestionClient from './QuestionClient'

export default async function QuestionPage({
  params,
}: {
  params: { qid: string }
}) {
  // unwrap params promise
  const { qid } = await params  
  return <QuestionClient qid={qid} />
}
