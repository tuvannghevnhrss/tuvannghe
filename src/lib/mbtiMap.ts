import { MBTI_MAP } from '@/lib/mbtiMap'

function formatMbti(code: string) {
  const desc = MBTI_MAP[code as keyof typeof MBTI_MAP]
  if (!desc)
    return `Mã MBTI của bạn là **${code}** (chưa có mô tả chi tiết).`

  return [
    `**${code}** – ${desc.intro}`,
    '',
    '*Ưu điểm*:',
    ...desc.strengths.map((s) => `• ${s}`),
    '',
    '*Khuyết điểm*:',
    ...desc.flaws.map((f) => `• ${f}`),
    '',
    '*Gợi ý nghề nghiệp*:',
    ...desc.careers.map((c) => `• ${c}`),
    '',
    'Bạn muốn tìm hiểu thêm? Hãy đặt câu hỏi cho tôi nhé!',
  ].join('\n')
}
