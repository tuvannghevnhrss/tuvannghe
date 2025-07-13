import { PRICES, SERVICE, COMBO_COMPONENTS } from './constants';
import { SupabaseClient } from '@supabase/supabase-js';

/** Trả về số tiền thực sự phải thu cho user khi mua product */
export async function calcOutstandingPrice(
  supabase: SupabaseClient,
  userId: string,
  product: (typeof SERVICE)[keyof typeof SERVICE],
): Promise<number> {
  // Giá niêm yết
  let amount = PRICES[product];

  // Chỉ cần xử lý combo
  if (product !== SERVICE.COMBO) return amount;

  // Lấy tất cả khoản user đã trả, thuộc các thành phần combo
  const { data: paidRows, error } = await supabase
    .from('payments')
    .select('product')
    .eq('user_id', userId)
    .eq('status', 'PAID')
    .in('product', COMBO_COMPONENTS[SERVICE.COMBO]);

  if (error) throw error;

  // Tổng giá phần đã mua lẻ
  const alreadyPaid = paidRows?.reduce(
    (sum, row) => sum + PRICES[row.product as keyof typeof PRICES],
    0,
  ) ?? 0;

  // Số tiền còn thiếu (≥0)
  return Math.max(0, amount - alreadyPaid);
}
