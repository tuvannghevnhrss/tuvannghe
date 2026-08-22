import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

// Trạng thái sản phẩm chuẩn hoá theo UX spec — không hiển thị trạng thái kỹ
// thuật thô (paid/pending/...) ra người dùng.
export type ProductStatus = "owned_completed" | "owned_unused" | "owned_active" | "not_owned";

const STATUS_META: Record<ProductStatus, { label: string; className: string }> = {
  owned_completed: { label: "✓ Đã hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  owned_unused: { label: "◷ Chưa sử dụng", className: "bg-amber-50 text-amber-700" },
  // Dành cho sản phẩm dạng "dùng liên tục" (Interview AI, Combo, sau này là
  // Tư vấn 1:1) — không có khái niệm "hoàn thành" một lần như bài đánh giá.
  owned_active: { label: "✓ Đã sở hữu", className: "bg-emerald-100 text-emerald-700" },
  not_owned: { label: "○ Chưa sở hữu", className: "bg-slate-100 text-slate-400" },
};

// Trọng lượng thị giác theo trạng thái sở hữu — sản phẩm đã sở hữu/hoàn
// thành nổi bật hơn hẳn, sản phẩm chưa sở hữu nhẹ đi để không cạnh tranh.
const CARD_WEIGHT: Record<ProductStatus, string> = {
  owned_completed: "border-emerald-100 bg-emerald-50/40 shadow-[0_4px_20px_rgba(16,185,129,0.08)]",
  owned_active: "border-emerald-100 bg-emerald-50/40 shadow-[0_4px_20px_rgba(16,185,129,0.08)]",
  owned_unused: "border-slate-200 bg-white shadow-sm",
  not_owned: "border-slate-100 bg-slate-50/50 shadow-none",
};

export type ProductCTA = { label: string; href: string };

export type ProductCardProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  name: string;
  description?: string;
  status: ProductStatus;
  resultLabel?: string;
  entitlementLabel?: string;
  cta?: ProductCTA;
  /** Card sản phẩm nhóm (Phỏng vấn AI, Combo) — hiển thị nổi bật hơn assessment đơn lẻ. */
  featured?: boolean;
  /** Nội dung tuỳ biến — dùng cho subProducts (Module 1/2/3) hoặc checklist (Combo). */
  children?: ReactNode;
};

/**
 * Card sản phẩm dùng chung cho toàn bộ "Sản phẩm & quyền sử dụng" — nhận dữ
 * liệu đã được tính sẵn ở tầng page (không tự tính entitlement/quota ở đây)
 * để không tạo thêm một nguồn logic thứ hai ngoài các API/hàm hiện có.
 */
export default function ProductCard({
  icon: Icon,
  name,
  description,
  status,
  resultLabel,
  entitlementLabel,
  cta,
  featured = false,
  children,
}: ProductCardProps) {
  const meta = STATUS_META[status];
  const isOwned = status === "owned_completed" || status === "owned_active";

  return (
    <div
      className={`rounded-[24px] border p-5 transition sm:p-6 ${CARD_WEIGHT[status]} ${
        featured ? "sm:col-span-2" : ""
      } ${status === "not_owned" ? "opacity-80" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl ${
              featured ? "h-12 w-12" : "h-10 w-10"
            } ${isOwned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
          >
            <Icon className={featured ? "h-6 w-6" : "h-5 w-5"} />
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-slate-900 ${featured ? "text-base" : "text-sm"}`}>{name}</p>
            {description && <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      {resultLabel &&
        (status === "owned_completed" ? (
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{resultLabel}</p>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-700">{resultLabel}</p>
        ))}
      {entitlementLabel && <p className="mt-1.5 text-xs text-slate-500">{entitlementLabel}</p>}

      {children}

      {cta && (
        <div className="mt-5">
          <Link
            href={cta.href}
            className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold transition ${
              status === "not_owned"
                ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}
