import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { audit, extractRequestMeta } from '@/lib/audit';
import { consumeEmailVerificationToken, getAppUrl } from '@/lib/tokens';

function redirectTo(path: string) {
  return NextResponse.redirect(`${getAppUrl().replace(/\/$/, '')}${path}`);
}

export async function GET(req: Request) {
  const meta = extractRequestMeta(req);
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    await audit({ action: 'verification.token_invalid', level: 'warn', ip: meta.ip, userAgent: meta.userAgent });
    return redirectTo('/finance/verify-email?status=invalid');
  }

  const result = await consumeEmailVerificationToken(token);
  if (!result) {
    await audit({ action: 'verification.token_invalid', level: 'warn', ip: meta.ip, userAgent: meta.userAgent });
    return redirectTo('/finance/verify-email?status=invalid');
  }

  await dbConnect();
  await User.updateOne(
    { _id: new Types.ObjectId(result.userId) },
    { $set: { emailVerifiedAt: new Date() } },
  );

  await audit({
    action: 'user.email_verified',
    userId: result.userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return redirectTo('/finance/login?verified=1');
}
