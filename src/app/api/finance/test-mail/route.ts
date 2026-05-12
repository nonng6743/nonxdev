import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendMail, verifyMailer } from '@/lib/mailer';
import { logger } from '@/lib/logger';

const emailSchema = z.string().email();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get('to');

  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=you@example.com' }, { status: 400 });
  }

  const valid = emailSchema.safeParse(to);
  if (!valid.success) {
    return NextResponse.json(
      {
        ok: false,
        stage: 'validate',
        error: `"${to}" is not a valid email address. Check for typos (e.g. double @domain).`,
      },
      { status: 400 },
    );
  }

  const verify = await verifyMailer();
  if (!verify.ok) {
    return NextResponse.json({ ok: false, stage: 'verify', error: verify.error }, { status: 500 });
  }

  try {
    const info = await sendMail({
      to,
      subject: 'Test · nonxdev mailer',
      html: '<p>Test from <b>nonxdev</b> mailer. If you see this, SMTP works.</p>',
      text: 'Test from nonxdev mailer. If you see this, SMTP works.',
    });
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    const e = err as { code?: string; command?: string; response?: string; responseCode?: number; message?: string };
    logger.error('test_mail_failed', { to, error: e.message });
    return NextResponse.json(
      {
        ok: false,
        stage: 'send',
        code: e.code,
        command: e.command,
        responseCode: e.responseCode,
        response: e.response,
        message: e.message,
      },
      { status: 500 },
    );
  }
}
