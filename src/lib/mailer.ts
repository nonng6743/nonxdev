import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '@/lib/logger';

let cached: Transporter | null = null;

function getTransporter(): Transporter {
  if (cached) return cached;

  const user = process.env.EMAIL_USER;
  // Gmail App Passwords are displayed as "xxxx xxxx xxxx xxxx" but must be sent
  // without spaces. Strip whitespace defensively.
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '');

  if (!user || !pass) {
    logger.error('mailer_env_missing', { hasUser: !!user, hasPass: !!pass });
    throw new Error('EMAIL_USER and EMAIL_PASS must be set');
  }

  cached = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  return cached;
}

export async function verifyMailer() {
  try {
    const ok = await getTransporter().verify();
    logger.info('mailer_verify_ok', { ok });
    return { ok: true as const };
  } catch (err) {
    const e = err as { code?: string; response?: string; message?: string };
    logger.error('mailer_verify_failed', {
      code: e.code,
      response: e.response,
      message: e.message,
    });
    return { ok: false as const, error: e.message ?? String(err) };
  }
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(input: SendMailInput) {
  const user = process.env.EMAIL_USER;
  const from = `nonxdev Studio <${user}>`;
  try {
    const info = await getTransporter().sendMail({ from, ...input });
    logger.info('mail_sent', {
      to: input.to,
      subject: input.subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return info;
  } catch (err) {
    const e = err as { code?: string; command?: string; response?: string; responseCode?: number; message?: string };
    logger.error('mail_send_failed', {
      to: input.to,
      subject: input.subject,
      code: e.code,
      command: e.command,
      responseCode: e.responseCode,
      response: e.response,
      message: e.message,
    });
    throw err;
  }
}

export function renderVerificationEmail(verifyUrl: string, displayName?: string | null) {
  const greeting = displayName ? `สวัสดี ${displayName},` : 'สวัสดี,';
  const html = `<!doctype html>
<html lang="th">
  <body style="margin:0;padding:0;background:#050403;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f7f3eb;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-weight:700;font-size:20px;letter-spacing:-0.02em;">
        <span style="color:#fafafa;">nonx</span><span style="color:#d4af37;">dev</span>
      </div>
      <h1 style="font-size:28px;line-height:1.2;margin:32px 0 12px;color:#fdf8e7;">ยืนยันอีเมลของคุณ</h1>
      <p style="color:#a3a3a3;line-height:1.6;margin:0 0 24px;">${greeting} ขอบคุณที่สมัครใช้งาน Personal Finance Tracker กรุณายืนยันอีเมลภายใน 24 ชั่วโมงเพื่อเริ่มใช้งานระบบ</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:linear-gradient(180deg,#f6d97a,#d4af37,#8c6a1f);color:#0a0907;text-decoration:none;font-weight:600;letter-spacing:0.02em;">ยืนยันอีเมล</a>
      <p style="color:#737373;font-size:12px;line-height:1.6;margin:32px 0 0;">หรือคัดลอกลิงก์นี้: <br/><a href="${verifyUrl}" style="color:#d4af37;word-break:break-all;">${verifyUrl}</a></p>
      <p style="color:#525252;font-size:11px;margin:32px 0 0;">ถ้าคุณไม่ได้สมัคร โปรดละเลยอีเมลนี้</p>
    </div>
  </body>
</html>`;
  const text = `${greeting}\n\nยืนยันอีเมลของคุณที่ลิงก์นี้ (หมดอายุใน 24 ชั่วโมง):\n${verifyUrl}\n\nถ้าคุณไม่ได้สมัคร โปรดละเลยอีเมลนี้`;
  return { html, text };
}
