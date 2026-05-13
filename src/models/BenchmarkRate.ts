import mongoose, { Schema, model, models, type Model } from 'mongoose';

export interface BenchmarkRateDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  key: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

const benchmarkRateSchema = new Schema<BenchmarkRateDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    key: { type: String, required: true, trim: true, uppercase: true, maxlength: 16 },
    value: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true, versionKey: false },
);

benchmarkRateSchema.index({ userId: 1, key: 1 }, { unique: true });

export const BenchmarkRate: Model<BenchmarkRateDoc> =
  (models.BenchmarkRate as Model<BenchmarkRateDoc>) ||
  model<BenchmarkRateDoc>('BenchmarkRate', benchmarkRateSchema);
