export type TransactionType = 'income' | 'expense';

export const INCOME_CATEGORIES = ['salary', 'freelance', 'gift', 'investment', 'other'] as const;
export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'entertainment',
  'bills',
  'health',
  'education',
  'other',
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS_TH: Record<string, string> = {
  salary: 'เงินเดือน',
  freelance: 'ฟรีแลนซ์',
  gift: 'ของขวัญ',
  investment: 'การลงทุน',
  food: 'อาหาร',
  transport: 'เดินทาง',
  shopping: 'ช้อปปิ้ง',
  entertainment: 'บันเทิง',
  bills: 'บิล/ค่าใช้จ่ายประจำ',
  health: 'สุขภาพ',
  education: 'การศึกษา',
  other: 'อื่นๆ',
};

export function categoryLabel(category: string) {
  return CATEGORY_LABELS_TH[category] ?? category;
}

export function formatTHB(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTHBCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `฿${(value / 1_000).toFixed(1)}k`;
  return `฿${value.toFixed(0)}`;
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfDayAgo(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}
