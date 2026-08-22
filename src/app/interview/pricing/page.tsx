import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function InterviewPricingPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  redirect(`/pricing${query}`);
}
