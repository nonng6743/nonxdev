import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { audit, extractRequestMeta } from '@/lib/audit';
import { createEmailVerificationToken, buildVerificationUrl } from '@/lib/tokens';
import { sendMail, renderVerificationEmail } from '@/lib/mailer';
import { logger } from '@/lib/logger';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const meta = extractRequestMeta(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase();
  await dbConnect();
  const user = await User.findOne({ email });

  await audit({
    action: 'verification.resend_requested',
    userId: user?._id?.toString() ?? null,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { email, exists: !!user, alreadyVerified: !!user?.emailVerifiedAt },
  });

  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({ ok: true });
  }

  try {
    const userId = user._id.toString();
    const { raw } = await createEmailVerificationToken(userId);
    const verifyUrl = buildVerificationUrl(raw);
    const { html, text } = renderVerificationEmail(verifyUrl, user.name);

    await sendMail({
      to: user.email,
      subject: 'ยืนยันอีเมล · nonxdev Finance',
      html,
      text,
    });
    await audit({
      action: 'verification.email_sent',
      userId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  } catch (err) {
    logger.error('resend_verification_failed', {
      userId: user._id.toString(),
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({ ok: true });
}
