import type { ComponentType, SVGProps } from "react";
import { MicrophoneIcon, PlayCircleIcon, SignalIcon } from "@heroicons/react/24/outline";

export type InterviewModuleNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const interviewModules: InterviewModuleNavItem[] = [
  { href: "/interview/module-1", label: "Module 1", description: "Luyện trả lời từng câu", icon: MicrophoneIcon },
  { href: "/interview/module-2", label: "Module 2", description: "Phỏng vấn Live theo lượt", icon: SignalIcon },
  { href: "/interview/module-3", label: "Module 3", description: "Mô phỏng phỏng vấn thực tế", icon: PlayCircleIcon },
];

export const INTERVIEW_SIDEBAR_STORAGE_KEY = "interview_sidebar_collapsed";

// Màn hình cần tập trung tối đa (ghi âm/live/mô phỏng) — sidebar mặc định
// thu gọn khi mới vào, nhưng chỉ khi user chưa từng tự chọn trạng thái nào.
export function isInterviewFocusPage(pathname: string): boolean {
  return (
    pathname.startsWith("/interview/session/") ||
    pathname.startsWith("/interview/live/") ||
    pathname.startsWith("/interview/module-3/live")
  );
}
