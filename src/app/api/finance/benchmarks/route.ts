import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { BenchmarkRate } from '@/models/BenchmarkRate';
import { logger } from '@/lib/logger';

const itemSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'กรุณาระบุชื่อ')
    .max(16)
    .regex(/^[A-Za-z]+$/, 'ใช้ได้เฉพาะตัวอักษร A-Z'),
  value: z.coerce.number().min(0, 'ต้องไม่ติดลบ').max(100),
});

const putSchema = z.object({
  benchmarks: z.array(itemSchema).max(20),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await dbConnect();
    const rates = await BenchmarkRate.find({ userId: new Types.ObjectId(session.user.id) }).lean();
    return NextResponse.json({
      benchmarks: rates.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt })),
    });
  } catch (err) {
    logger.error('benchmark_list_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    await Promise.all(
      parsed.data.benchmarks.map((b) =>
        BenchmarkRate.updateOne(
          { userId, key: b.key.toUpperCase() },
          { $set: { value: b.value } },
          { upsert: true },
        ),
      ),
    );
    const rates = await BenchmarkRate.find({ userId }).lean();
    return NextResponse.json({
      benchmarks: rates.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt })),
    });
  } catch (err) {
    logger.error('benchmark_save_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
