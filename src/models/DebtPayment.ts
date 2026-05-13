import mongoose, { Schema, model, models, type Model } from 'mongoose';

export interface DebtPaymentDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  debtId: mongoose.Types.ObjectId;
  amount: number;
  interest: number;
  principal: number;
  balanceAfter: number;
  date: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const debtPaymentSchema = new Schema<DebtPaymentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    debtId: { type: Schema.Types.ObjectId, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    interest: { type: Number, required: true, min: 0 },
    principal: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    note: { type: String, default: null, trim: true, maxlength: 200 },
  },
  { timestamps: true, versionKey: false },
);

debtPaymentSchema.index({ userId: 1, debtId: 1, date: -1 });

export const DebtPayment: Model<DebtPaymentDoc> =
  (models.DebtPayment as Model<DebtPaymentDoc>) ||
  model<DebtPaymentDoc>('DebtPayment', debtPaymentSchema);
