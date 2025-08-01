/**
 * Tiện ích gộp class (vừa clsx vừa tailwind-merge).
 * Dùng giống hàm `cn()` của shadcn/ui.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
