import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Transaction } from '@/models/Transaction';
import { logger } from '@/lib/logger';

const patchSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0').max(1_000_000_000).optional(),
  category: z.string().trim().min(1, 'กรุณาเลือกหมวด').max(40).optional(),
  description: z.string().trim().max(200).nullable().optional(),
  date: z.coerce.date().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    await dbConnect();
    const updated = await Transaction.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(session.user.id) },
      { $set: parsed.data },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('transaction_update_failed', {
      userId: session.user.id,
      txId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await dbConnect();
    const result = await Transaction.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(session.user.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('transaction_delete_failed', {
      userId: session.user.id,
      txId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
