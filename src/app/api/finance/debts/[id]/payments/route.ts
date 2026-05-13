import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Debt } from '@/models/Debt';
import { DebtPayment } from '@/models/DebtPayment';
import { splitPayment, type InterestMethod } from '@/lib/debt';
import { logger } from '@/lib/logger';

const paySchema = z.object({
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0').max(1_000_000_000),
  date: z.coerce.date().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const parsed = paySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  try {
    await dbConnect();
    const userId = new Types.ObjectId(session.user.id);
    const debtId = new Types.ObjectId(id);

    const debt = await Debt.findOne({ _id: debtId, userId });
    if (!debt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (debt.status === 'paid' || debt.balance <= 0) {
      return NextResponse.json({ error: 'หนี้นี้ปิดยอดแล้ว' }, { status: 400 });
    }

    const cappedAmount = Math.min(parsed.data.amount, debt.balance + debt.balance * (debt.interestRate / 100 / 12));
    const { interest, principal, newBalance } = splitPayment({
      balance: debt.balance,
      annualPercent: debt.interestRate,
      amount: cappedAmount,
      method: debt.method as InterestMethod,
      principal: debt.principal,
      termMonths: debt.termMonths,
    });

    const payment = await DebtPayment.create({
      userId,
      debtId,
      amount: cappedAmount,
      interest,
      principal,
      balanceAfter: newBalance,
      date: parsed.data.date ?? new Date(),
      note: parsed.data.note ?? null,
    });

    debt.balance = newBalance;
    if (newBalance <= 0.01) {
      debt.balance = 0;
      debt.status = 'paid';
    }
    await debt.save();

    return NextResponse.json(
      {
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          interest: payment.interest,
          principal: payment.principal,
          balanceAfter: payment.balanceAfter,
          date: payment.date,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error('debt_payment_failed', {
      userId: session.user.id,
      debtId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    const payments = await DebtPayment.find({
      userId: new Types.ObjectId(session.user.id),
      debtId: new Types.ObjectId(id),
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p._id.toString(),
        amount: p.amount,
        interest: p.interest,
        principal: p.principal,
        balanceAfter: p.balanceAfter,
        date: p.date,
        note: p.note,
      })),
    });
  } catch (err) {
    logger.error('debt_payments_list_failed', {
      userId: session.user.id,
      debtId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
