import mongoose, { Schema, model, models, type Model } from 'mongoose';

export interface EmailVerificationTokenDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<EmailVerificationTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const EmailVerificationToken: Model<EmailVerificationTokenDoc> =
  (models.EmailVerificationToken as Model<EmailVerificationTokenDoc>) ||
  model<EmailVerificationTokenDoc>('EmailVerificationToken', tokenSchema);
