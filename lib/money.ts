export const NORMAL_AMOUNT = 5_000;
export const BURN_AMOUNT = 10_000;
export const PENALTY_BASE_AMOUNT = 10_000;

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function roundTypeLabel(type: string): string {
  switch (type) {
    case "NORMAL":
      return "Thắng thường";
    case "BURN":
      return "Đốt / cháy nhà";
    case "PENALTY":
      return "Đền làng";
    default:
      return type;
  }
}
