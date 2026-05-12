import mongoose, { Schema, model, models, type Model } from 'mongoose';

export type TransactionType = 'income' | 'expense';

export interface TransactionDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

transactionSchema.index({ userId: 1, date: -1 });

export const Transaction: Model<TransactionDoc> =
  (models.Transaction as Model<TransactionDoc>) || model<TransactionDoc>('Transaction', transactionSchema);
