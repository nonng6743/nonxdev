import mongoose, { Schema, model, models, type Model } from 'mongoose';

export interface AuditLogDoc {
  _id: mongoose.Types.ObjectId;
  level: 'info' | 'warn' | 'error';
  action: string;
  userId: mongoose.Types.ObjectId | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

const auditSchema = new Schema<AuditLogDoc>(
  {
    level: { type: String, enum: ['info', 'warn', 'error'], required: true },
    action: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, default: null, index: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

auditSchema.index({ createdAt: -1 });

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) || model<AuditLogDoc>('AuditLog', auditSchema);
