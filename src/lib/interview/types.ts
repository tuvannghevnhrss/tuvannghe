export type InterviewModuleId = "module-1" | "module-2" | "module-3";

export type InterviewNavItem = {
  href: string;
  label: string;
  description: string;
  moduleId?: InterviewModuleId;
};

export type InterviewDashboardStat = {
  label: string;
  value: string;
  hint: string;
};

export type InterviewRecentSession = {
  id: string;
  title: string;
  moduleId: InterviewModuleId;
  role: string;
  level: string;
  score: number;
  status: "draft" | "processing" | "completed";
  createdAt: string;
};

export type InterviewInsight = {
  title: string;
  text: string;
};

export type InterviewHistoryItem = {
  id: string;
  moduleId: InterviewModuleId;
  role: string;
  level: string;
  score: number;
  createdAt: string;
  summary: string;
  status: "draft" | "processing" | "completed";
};

export type InterviewResultPayload = {
  id: string;
  moduleId: InterviewModuleId;
  role: string;
  level: string;
  createdAt?: string;
  overallScore: number;
  communicationScore: number;
  contentScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  transcriptPreview: string;
};
