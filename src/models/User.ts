import mongoose, { Schema, model, models, type Model } from 'mongoose';

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
