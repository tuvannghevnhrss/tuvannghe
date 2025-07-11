// src/lib/formatVND.ts
/**
 * Định dạng số tiền thành chuỗi VND, không có phần lẻ.
 * 10000  ➜  "10.000 ₫"
 */
const formatVND = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
};

export default formatVND;