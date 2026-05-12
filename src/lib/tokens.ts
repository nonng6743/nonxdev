import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { dbConnect } from '@/lib/mongoose';
import { EmailVerificationToken } from '@/models/EmailVerificationToken';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerificationToken(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId');
  }

  const raw = crypto.randomBytes(32).toString('base64url');
  const tokenHash = await bcrypt.hash(raw, 10);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const userObjectId = new Types.ObjectId(userId);

  await dbConnect();
  await EmailVerificationToken.deleteMany({ userId: userObjectId });
  await EmailVerificationToken.create({ userId: userObjectId, tokenHash, expiresAt });

  return { raw, expiresAt };
}

export async function consumeEmailVerificationToken(rawToken: string) {
  await dbConnect();
  const candidates = await EmailVerificationToken.find({ expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  for (const candidate of candidates) {
    const match = await bcrypt.compare(rawToken, candidate.tokenHash);
    if (match) {
      await EmailVerificationToken.deleteOne({ _id: candidate._id });
      return { userId: candidate.userId.toString() };
    }
  }
  return null;
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    'http://localhost:3000'
  );
}

export function buildVerificationUrl(rawToken: string) {
  const base = getAppUrl().replace(/\/$/, '');
  return `${base}/api/finance/verify-email?token=${encodeURIComponent(rawToken)}`;
}
