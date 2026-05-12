import { Types } from 'mongoose';
import { dbConnect } from '@/lib/mongoose';
import { AuditLog } from '@/models/AuditLog';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'user.registered'
  | 'user.email_verified'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'verification.email_sent'
  | 'verification.resend_requested'
  | 'verification.token_invalid'
  | 'verification.token_expired'
  | 'slip.verified'
  | 'slip.verification_failed';

export type AuditInput = {
  action: AuditAction;
  level?: 'info' | 'warn' | 'error';
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

function toObjectId(s?: string | null): Types.ObjectId | null {
  if (!s) return null;
  if (!Types.ObjectId.isValid(s)) return null;
  return new Types.ObjectId(s);
}

export async function audit(input: AuditInput) {
  const { action, level = 'info', userId, ip, userAgent, metadata } = input;

  logger[level](`audit:${action}`, { userId, ip, userAgent, ...(metadata ?? {}) });

  try {
    await dbConnect();
    await AuditLog.create({
      level,
      action,
      userId: toObjectId(userId),
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    logger.error('audit_persist_failed', {
      action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function extractRequestMeta(req: Request) {
  const headers = req.headers;
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;
  const userAgent = headers.get('user-agent') ?? null;
  return { ip, userAgent };
}
