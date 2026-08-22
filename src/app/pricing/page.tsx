import type { Metadata } from "next";
import PricingOverview from "@/components/PricingOverview";

export const metadata: Metadata = {
  title: "Bảng giá Hướng nghiệp & Phỏng vấn AI | TuVanNghe",
  description:
    "Xem bảng giá rõ ràng cho các công cụ hướng nghiệp và gói luyện phỏng vấn AI. Chọn đúng nhu cầu để bắt đầu nhanh và nâng cấp khi cần.",
};

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function PricingPage({ searchParams }: Props) {
  const { reason } = await searchParams;

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PricingOverview reason={reason} />
      </div>
    </div>
  );
}
