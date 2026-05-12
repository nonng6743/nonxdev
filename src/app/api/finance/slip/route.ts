import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { audit, extractRequestMeta } from '@/lib/audit';
import { verifySlipImage } from '@/lib/slip2go';
import { logger } from '@/lib/logger';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const meta = extractRequestMeta(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'กรุณาแนบไฟล์สลิป (field: file)' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 5MB' }, { status: 413 });
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'ไฟล์ต้องเป็นรูปภาพ (jpg/png/webp/heic)' }, { status: 415 });
  }

  const buffer = await file.arrayBuffer();
  const result = await verifySlipImage({
    buffer,
    filename: file.name || 'slip.jpg',
    mime: file.type || 'image/jpeg',
  });

  if (!result.ok) {
    await audit({
      action: 'slip.verification_failed',
      level: 'warn',
      userId: session.user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { code: result.code, status: result.status, message: result.message },
    });
    const status = result.code === 'not_configured' ? 503 : 502;
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status },
    );
  }

  await audit({
    action: 'slip.verified',
    userId: session.user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: {
      amount: result.amount,
      ref: result.ref,
      receiverBank: result.receiver.bank,
    },
  });

  logger.info('slip_verified', {
    userId: session.user.id,
    amount: result.amount,
    ref: result.ref,
  });

  return NextResponse.json({
    slip: {
      amount: result.amount,
      date: result.date,
      time: result.time,
      ref: result.ref,
      sender: result.sender,
      receiver: result.receiver,
    },
  });
}
