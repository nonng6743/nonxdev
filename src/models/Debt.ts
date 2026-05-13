import mongoose, { Schema, model, models, type Model } from 'mongoose';
import type { DebtKind, DebtStatus, InterestConvention, InterestMethod, InterestTier } from '@/lib/debt';

export interface DebtDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  kind: DebtKind;
  principal: number;
  balance: number;
  interestRate: number;
  termMonths: number;
  method: InterestMethod;
  convention: InterestConvention;
  startDate: Date;
  status: DebtStatus;
  notes: string | null;
  interestTiers: InterestTier[];
  parentDebtId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const interestTierSchema = new Schema<InterestTier>(
  {
    months: { type: Number, required: true, min: 1, max: 600 },
    ratePercent: { type: Number, required: true, min: 0, max: 100 },
    rateLabel: { type: String, default: null, trim: true, maxlength: 40 },
    rateFormula: { type: String, default: null, trim: true, maxlength: 40 },
    monthlyPayment: { type: Number, default: null, min: 0 },
  },
  { _id: false },
);

const debtSchema = new Schema<DebtDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    kind: {
      type: String,
      enum: ['house', 'car', 'credit_card', 'personal', 'other'],
      required: true,
    },
    principal: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 },
    termMonths: { type: Number, required: true, min: 1, max: 600 },
    method: { type: String, enum: ['amortized', 'flat'], default: 'amortized' },
    convention: { type: String, enum: ['monthly', 'daily365', 'daily360'], default: 'monthly' },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'paid'], default: 'active', index: true },
    notes: { type: String, default: null, trim: true, maxlength: 200 },
    interestTiers: { type: [interestTierSchema], default: [] },
    parentDebtId: { type: Schema.Types.ObjectId, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

debtSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Debt: Model<DebtDoc> =
  (models.Debt as Model<DebtDoc>) || model<DebtDoc>('Debt', debtSchema);
