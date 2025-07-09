const DAILY_API = "https://api.daily.co/v1";

export async function createRoom(
  properties: Record<string, any> = {},          // tuỳ chọn
  privacy: "private" | "public" = "private"      // mặc định private
) {
  const exp = Math.floor(Date.now() / 1e3) + 60 * 60; // hết hạn 60′
  const res = await fetch(`${DAILY_API}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      privacy,                       // ⬅️ Ở cấp cao nhất!
      properties: { exp, ...properties },
    }),
  });
  return res.json();                 // {id,url,…} -hoặc- {error,info}
}
