import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Transaction } from '@/models/Transaction';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0').max(1_000_000_000),
  category: z.string().trim().min(1, 'กรุณาเลือกหมวด').max(40),
  description: z.string().trim().max(200).optional(),
  date: z.coerce.date().optional(),
});

export async function POST(req: Request) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    await dbConnect();
    const tx = await Transaction.create({
      userId: new Types.ObjectId(session.user.id),
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description ?? null,
      date: parsed.data.date ?? new Date(),
    });

    return NextResponse.json(
      {
        transaction: {
          id: tx._id.toString(),
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          date: tx.date,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error('transaction_create_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    const txs = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      transactions: txs.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      })),
    });
  } catch (err) {
    logger.error('transaction_list_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
