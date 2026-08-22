export const dynamic = "force-dynamic";

import PaymentContent from "./PaymentContent";
import { SERVICE, type ServiceKey } from "@/lib/constants";

type Props = { searchParams: Promise<{ product?: string }> };

const VALID_PRODUCTS = new Set<string>(Object.values(SERVICE));

export default async function PaymentPage({ searchParams }: Props) {
  const { product = "mbti" } = await searchParams;
  const safeProduct: ServiceKey = VALID_PRODUCTS.has(product)
    ? (product as ServiceKey)
    : "mbti";
  return <PaymentContent product={safeProduct} />;
}
