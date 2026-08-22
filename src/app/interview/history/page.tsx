import { redirect } from "next/navigation";

// Lịch sử đã được gộp vào trang Tiến độ (Dashboard) — giữ route này để
// không phá các link cũ (backward compatibility), chỉ redirect.
export default function InterviewHistoryRedirectPage() {
  redirect("/interview/dashboard");
}
