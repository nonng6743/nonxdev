import { Types } from 'mongoose';
import { Category } from '@/models/Category';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_LABELS_TH,
  type TransactionType,
} from '@/lib/finance';

export function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 7);
  return ascii ? `${ascii}-${suffix}` : `cat-${suffix}`;
}

/**
 * Idempotent: seeds default categories for the user if they have none yet.
 */
export async function ensureDefaultCategories(userId: Types.ObjectId) {
  const count = await Category.countDocuments({ userId });
  if (count > 0) return;

  const docs = [
    ...EXPENSE_CATEGORIES.map((slug, i) => ({
      userId,
      type: 'expense' as TransactionType,
      slug,
      name: CATEGORY_LABELS_TH[slug] ?? slug,
      order: i,
    })),
    ...INCOME_CATEGORIES.map((slug, i) => ({
      userId,
      type: 'income' as TransactionType,
      slug,
      name: CATEGORY_LABELS_TH[slug] ?? slug,
      order: i,
    })),
  ];
  await Category.insertMany(docs, { ordered: false });
}

export type PlainCategory = {
  id: string;
  type: TransactionType;
  slug: string;
  name: string;
  order: number;
};

export async function listUserCategories(userId: Types.ObjectId): Promise<PlainCategory[]> {
  const docs = await Category.find({ userId })
    .sort({ type: 1, order: 1, name: 1 })
    .lean();

  return docs.map((d) => ({
    id: d._id.toString(),
    type: d.type,
    slug: d.slug,
    name: d.name,
    order: d.order,
  }));
}

export function buildCategoryNameMap(categories: { slug: string; name: string }[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const c of categories) m[c.slug] = c.name;
  return m;
}
