import mongoose, { Schema, model, models, type Model } from 'mongoose';
import type { TransactionType } from '@/lib/finance';

export interface CategoryDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  slug: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

categorySchema.index({ userId: 1, type: 1, slug: 1 }, { unique: true });
categorySchema.index({ userId: 1, type: 1, order: 1 });

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) || model<CategoryDoc>('Category', categorySchema);
