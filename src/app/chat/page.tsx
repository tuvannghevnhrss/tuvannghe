import ChatShell from "@/components/ChatShell";
import { getUser } from "@/lib/supabaseServer";   // hàm bạn đã có

export default async function ChatPage() {
  const user = await getUser();     // hoặc null nếu chưa đăng nhập
  return <ChatShell userId={user?.id ?? null} />;
}
