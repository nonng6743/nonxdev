import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ArrowLeft, Landmark, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Debt } from '@/models/Debt';
import { BenchmarkRate } from '@/models/BenchmarkRate';
import { formatTHB } from '@/lib/finance';
import {
  buildSchedule,
  resolveDebtTiers,
  projectedBalanceAt,
  DEFAULT_BENCHMARKS,
  type BenchmarkRate as BenchmarkRateValue,
  type DebtKind,
  type InterestMethod,
  type InterestConvention,
  type DebtStatus,
  type InterestTier,
} from '@/lib/debt';
import DebtForm from '@/components/finance/DebtForm';
import DebtList, { type ListedDebt } from '@/components/finance/DebtList';
import BenchmarkPanel from '@/components/finance/BenchmarkPanel';

export default async function DebtsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/finance/login');

  await dbConnect();
  const userId = new Types.ObjectId(session.user.id);
  const [debts, benchmarkDocs] = await Promise.all([
    Debt.find({ userId }).sort({ status: 1, createdAt: -1 }).lean(),
    BenchmarkRate.find({ userId }).lean(),
  ]);

  const savedKeys = new Set(benchmarkDocs.map((b) => b.key.toUpperCase()));
  const benchmarks: BenchmarkRateValue[] = [
    ...benchmarkDocs.map((b) => ({ key: b.key, value: b.value })),
    ...Object.entries(DEFAULT_BENCHMARKS)
      .filter(([k]) => !savedKeys.has(k))
      .map(([key, value]) => ({ key, value })),
  ];
  const benchmarkEntries = benchmarkDocs.map((b) => ({
    key: b.key,
    value: b.value,
    updatedAt: b.updatedAt.toISOString(),
  }));

  const listed: ListedDebt[] = debts.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    kind: d.kind as DebtKind,
    principal: d.principal,
    balance: d.balance,
    interestRate: d.interestRate,
    termMonths: d.termMonths,
    method: d.method as InterestMethod,
    convention: (d.convention ?? 'monthly') as InterestConvention,
    startDate: new Date(d.startDate).toISOString(),
    status: d.status as DebtStatus,
    notes: d.notes,
    interestTiers: resolveDebtTiers((d.interestTiers ?? []) as InterestTier[], benchmarks),
    parentDebtId: d.parentDebtId ? d.parentDebtId.toString() : null,
  }));

  const activeDebts = listed.filter((d) => d.status === 'active');
  const totalBalance = activeDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalPrincipal = activeDebts.reduce((sum, d) => sum + d.principal, 0);

  let totalMonthly = 0;
  let totalInterestRemaining = 0;
  let totalProjectedBalance = 0;
  let totalProjectedPrincipalPaid = 0;
  for (const d of activeDebts) {
    const s = buildSchedule({
      principal: d.balance,
      annualPercent: d.interestRate,
      termMonths: d.termMonths,
      method: d.method,
      startDate: new Date(d.startDate),
      tiers: d.interestTiers.length > 0 ? d.interestTiers : null,
      convention: d.convention,
    });
    totalMonthly += s.monthlyPayment;
    totalInterestRemaining += s.totalInterest;

    const proj = projectedBalanceAt({
      principal: d.principal,
      annualPercent: d.interestRate,
      termMonths: d.termMonths,
      method: d.method,
      startDate: new Date(d.startDate),
      tiers: d.interestTiers.length > 0 ? d.interestTiers : null,
      convention: d.convention,
    });
    totalProjectedBalance += proj.expectedBalance;
    totalProjectedPrincipalPaid += proj.paidPrincipal;
  }

  const parentOptions = activeDebts
    .filter((d) => !d.parentDebtId)
    .map((d) => ({ id: d.id, name: d.name }));

  return (
    <main className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <Link
            href="/finance/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-500 hover:text-gold-200 transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับ Dashboard
          </Link>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold-300/80 mb-2 sm:mb-3">
            <Landmark className="w-4 h-4" />
            หนี้สิน
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold gold-gradient-text">หนี้สินของฉัน</h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl">
            รองรับดอกเบี้ยแบ่งช่วง (เช่น ปีที่ 1/2/3, MRR-X%) และจัดกลุ่มหนี้คู่ (ประกันชีวิต, อัคคีภัย) พร้อมสรุปยอดผ่อนรวมตามช่วงปี
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            label="ยอดหนี้คงเหลือ"
            amount={formatTHB(totalBalance)}
            sub={
              totalProjectedBalance !== totalBalance && totalProjectedPrincipalPaid > 0
                ? `ตามแผน ${formatTHB(totalProjectedBalance)}`
                : undefined
            }
            icon={Wallet}
            accent="text-rose-300"
          />
          <StatCard
            label="ยอดกู้รวม"
            amount={formatTHB(totalPrincipal)}
            icon={ArrowDownCircle}
            accent="text-neutral-100"
          />
          <StatCard
            label="ผ่อนเดือนแรกรวม"
            amount={formatTHB(totalMonthly)}
            icon={ArrowUpCircle}
            accent="text-gold-300"
          />
          <StatCard
            label="ดอกเบี้ยที่เหลือ"
            amount={formatTHB(totalInterestRemaining)}
            icon={TrendingUp}
            accent="text-rose-300"
          />
        </div>

        <div className="mb-5 sm:mb-6">
          <BenchmarkPanel initial={benchmarkEntries} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6 sm:mb-8">
          <DebtForm parentOptions={parentOptions} benchmarks={benchmarks} />
          <DebtList debts={listed} parentOptions={parentOptions} benchmarks={benchmarks} />
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  amount,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  amount: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="relative rounded-2xl border border-gold-400/15 bg-ink-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-1">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gold-300/80 truncate">
          {label}
        </span>
        <Icon className={`w-4 h-4 shrink-0 ${accent}`} />
      </div>
      <div className="text-xl sm:text-2xl font-bold text-neutral-50 tabular-nums break-all">{amount}</div>
      {sub && <div className="mt-1 text-[10px] text-emerald-300/80 tabular-nums truncate">{sub}</div>}
    </div>
  );
}
