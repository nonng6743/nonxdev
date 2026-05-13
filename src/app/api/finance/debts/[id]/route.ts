import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Debt } from '@/models/Debt';
import { DebtPayment } from '@/models/DebtPayment';
import { logger } from '@/lib/logger';

const tierSchema = z.object({
  months: z.coerce.number().int().min(1).max(600),
  ratePercent: z.coerce.number().min(0).max(100),
  rateLabel: z.string().trim().max(40).optional().nullable(),
  rateFormula: z.string().trim().max(40).optional().nullable(),
  monthlyPayment: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
});

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  kind: z.enum(['house', 'car', 'credit_card', 'personal', 'other']).optional(),
  principal: z.coerce.number().positive().max(1_000_000_000).optional(),
  balance: z.coerce.number().min(0).max(1_000_000_000).optional(),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  termMonths: z.coerce.number().int().min(1).max(600).optional(),
  method: z.enum(['amortized', 'flat']).optional(),
  convention: z.enum(['monthly', 'daily365', 'daily360']).optional(),
  startDate: z.coerce.date().optional(),
  notes: z.string().trim().max(200).optional(),
  status: z.enum(['active', 'paid']).optional(),
  interestTiers: z.array(tierSchema).max(20).optional(),
  parentDebtId: z.string().trim().nullable().optional(),
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
    const userId = new Types.ObjectId(session.user.id);
    const debtId = new Types.ObjectId(id);

    const update: Record<string, unknown> = { ...parsed.data };

    if ('parentDebtId' in parsed.data) {
      const raw = parsed.data.parentDebtId;
      if (raw == null || raw === '') {
        update.parentDebtId = null;
      } else {
        if (!Types.ObjectId.isValid(raw)) {
          return NextResponse.json({ error: 'parentDebtId ไม่ถูกต้อง' }, { status: 400 });
        }
        if (raw === id) {
          return NextResponse.json({ error: 'หนี้ไม่สามารถเป็น parent ของตัวเองได้' }, { status: 400 });
        }
        const parent = await Debt.findOne({ _id: new Types.ObjectId(raw), userId })
          .select('_id parentDebtId')
          .lean();
        if (!parent) {
          return NextResponse.json({ error: 'ไม่พบหนี้หลัก' }, { status: 400 });
        }
        if (parent.parentDebtId) {
          return NextResponse.json({ error: 'ไม่อนุญาตให้สร้างหนี้ซ้อนเกิน 2 ระดับ' }, { status: 400 });
        }
        update.parentDebtId = parent._id;
      }
    }

    const updated = await Debt.findOneAndUpdate(
      { _id: debtId, userId },
      { $set: update },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('debt_update_failed', {
      userId: session.user.id,
      debtId: id,
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
    const userId = new Types.ObjectId(session.user.id);
    const debtId = new Types.ObjectId(id);

    const result = await Debt.deleteOne({ _id: debtId, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await DebtPayment.deleteMany({ debtId, userId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('debt_delete_failed', {
      userId: session.user.id,
      debtId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
