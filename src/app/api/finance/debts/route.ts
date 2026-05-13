import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Debt } from '@/models/Debt';
import { logger } from '@/lib/logger';

const tierSchema = z.object({
  months: z.coerce.number().int().min(1).max(600),
  ratePercent: z.coerce.number().min(0).max(100),
  rateLabel: z.string().trim().max(40).optional().nullable(),
  rateFormula: z.string().trim().max(40).optional().nullable(),
  monthlyPayment: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
});

const createSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อหนี้').max(60),
  kind: z.enum(['house', 'car', 'credit_card', 'personal', 'other']),
  principal: z.coerce.number().positive('ยอดเงินกู้ต้องมากกว่า 0').max(1_000_000_000),
  balance: z.coerce.number().min(0).max(1_000_000_000).optional(),
  interestRate: z.coerce.number().min(0, 'ดอกเบี้ยต้องไม่ติดลบ').max(100),
  termMonths: z.coerce.number().int().min(1).max(600),
  method: z.enum(['amortized', 'flat']).default('amortized'),
  convention: z.enum(['monthly', 'daily365', 'daily360']).default('monthly'),
  startDate: z.coerce.date().optional(),
  notes: z.string().trim().max(200).optional(),
  interestTiers: z.array(tierSchema).max(20).optional(),
  parentDebtId: z.string().trim().optional().nullable(),
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
    const d = parsed.data;
    const userId = new Types.ObjectId(session.user.id);

    let parentDebtId: Types.ObjectId | null = null;
    if (d.parentDebtId) {
      if (!Types.ObjectId.isValid(d.parentDebtId)) {
        return NextResponse.json({ error: 'parentDebtId ไม่ถูกต้อง' }, { status: 400 });
      }
      const parent = await Debt.findOne({ _id: new Types.ObjectId(d.parentDebtId), userId }).select('_id parentDebtId').lean();
      if (!parent) {
        return NextResponse.json({ error: 'ไม่พบหนี้หลัก' }, { status: 400 });
      }
      if (parent.parentDebtId) {
        return NextResponse.json({ error: 'ไม่อนุญาตให้สร้างหนี้ซ้อนเกิน 2 ระดับ' }, { status: 400 });
      }
      parentDebtId = parent._id;
    }

    const debt = await Debt.create({
      userId,
      name: d.name,
      kind: d.kind,
      principal: d.principal,
      balance: d.balance ?? d.principal,
      interestRate: d.interestRate,
      termMonths: d.termMonths,
      method: d.method,
      convention: d.convention,
      startDate: d.startDate ?? new Date(),
      status: 'active',
      notes: d.notes ?? null,
      interestTiers: d.interestTiers ?? [],
      parentDebtId,
    });

    return NextResponse.json({ debt: serializeDebt(debt.toObject()) }, { status: 201 });
  } catch (err) {
    logger.error('debt_create_failed', {
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
    const debts = await Debt.find({ userId: new Types.ObjectId(session.user.id) })
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ debts: debts.map(serializeDebt) });
  } catch (err) {
    logger.error('debt_list_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

type DebtLean = {
  _id: Types.ObjectId;
  name: string;
  kind: string;
  principal: number;
  balance: number;
  interestRate: number;
  termMonths: number;
  method: string;
  convention?: string;
  startDate: Date;
  status: string;
  notes: string | null;
  interestTiers?: Array<{ months: number; ratePercent: number; rateLabel?: string | null; monthlyPayment?: number | null }>;
  parentDebtId?: Types.ObjectId | null;
  createdAt: Date;
};

function serializeDebt(d: DebtLean) {
  return {
    id: d._id.toString(),
    name: d.name,
    kind: d.kind,
    principal: d.principal,
    balance: d.balance,
    interestRate: d.interestRate,
    termMonths: d.termMonths,
    method: d.method,
    convention: d.convention ?? 'monthly',
    startDate: d.startDate,
    status: d.status,
    notes: d.notes,
    interestTiers: d.interestTiers ?? [],
    parentDebtId: d.parentDebtId ? d.parentDebtId.toString() : null,
    createdAt: d.createdAt,
  };
}
