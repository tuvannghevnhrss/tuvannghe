export type EmploymentType = "full_time" | "part_time" | "remote" | "internship" | "contract";
export type JobStatus = "draft" | "published" | "closed";

export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  employment_type: EmploymentType;
  category: string;
  level: string | null;
  salary_display: string | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  contact_email: string | null;
  apply_url: string | null;
  status: JobStatus;
  deadline: string | null;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  remote: "Từ xa",
  internship: "Thực tập",
  contract: "Hợp đồng",
};

export const EMPLOYMENT_TYPE_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value: value as EmploymentType, label })
);

export function formatJobDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function jobApplyHref(job: Pick<JobPosting, "apply_url" | "contact_email" | "title">) {
  if (job.apply_url) return job.apply_url;
  if (job.contact_email) {
    const subject = encodeURIComponent(`Ứng tuyển vị trí: ${job.title}`);
    return `mailto:${job.contact_email}?subject=${subject}`;
  }
  return null;
}
