import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { audit, extractRequestMeta } from '@/lib/audit';
import { createEmailVerificationToken, buildVerificationUrl } from '@/lib/tokens';
import { sendMail, renderVerificationEmail } from '@/lib/mailer';
import { logger } from '@/lib/logger';

const registerSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร'),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(80).optional(),
});

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000;
}

export async function POST(req: Request) {
  const meta = extractRequestMeta(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  await dbConnect();

  let user: { _id: { toString(): string }; email: string; name: string | null };
  try {
    user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: name ?? null,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });
    }
    logger.error('register_failed', {
      email: normalizedEmail,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const userId = user._id.toString();

  await audit({
    action: 'user.registered',
    userId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  try {
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
  } catch (mailErr) {
    logger.error('verification_mail_failed', {
      userId,
      error: mailErr instanceof Error ? mailErr.message : String(mailErr),
    });
  }

  return NextResponse.json(
    { user: { id: userId, email: user.email, name: user.name }, verificationRequired: true },
    { status: 201 },
  );
}
