// src/components/ProfileTabsWrapper.tsx
"use client";
import StepTabs from "./StepTabs";
import { useSearchParams } from "next/navigation";

export default function ProfileTabsWrapper() {
  const search = useSearchParams();
  const step = search.get("step") || "trait";
  return <StepTabs step={step} />;
}
