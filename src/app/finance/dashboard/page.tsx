import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, ListChecks, Tags, Landmark } from 'lucide-react';
import { auth, signOut } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Transaction } from '@/models/Transaction';
import { Debt } from '@/models/Debt';
import { BenchmarkRate } from '@/models/BenchmarkRate';
import { formatTHB, startOfMonth, startOfDayAgo } from '@/lib/finance';
import { ensureDefaultCategories, listUserCategories, buildCategoryNameMap } from '@/lib/categories';
import {
  buildSchedule,
  resolveDebtTiers,
  DEFAULT_BENCHMARKS,
  type BenchmarkRate as BenchmarkRateValue,
  type DebtKind,
  type InterestTier,
} from '@/lib/debt';
import TransactionForm from '@/components/finance/TransactionForm';
import TransactionList, { type ListedTransaction } from '@/components/finance/TransactionList';
import SlipUploader from '@/components/finance/SlipUploader';
import DailyChart, { type DailyPoint } from '@/components/finance/charts/DailyChart';
import CategoryChart, { type CategoryPoint } from '@/components/finance/charts/CategoryChart';
import MonthlyChart, { type MonthlyPoint } from '@/components/finance/charts/MonthlyChart';
import DebtMonthlyChart, { type DebtMonthlyPoint } from '@/components/finance/charts/DebtMonthlyChart';
import ExpenseForecastChart, { type ForecastPoint } from '@/components/finance/charts/ExpenseForecastChart';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/finance/login');

  const userId = new Types.ObjectId(session.user.id);
  await dbConnect();
  await ensureDefaultCategories(userId);

  const categories = await listUserCategories(userId);
  const categoryNames = buildCategoryNameMap(categories);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [txs, activeDebts, benchmarkDocs] = await Promise.all([
    Transaction.find({ userId, date: { $gte: sixMonthsAgo } })
      .sort({ date: -1, createdAt: -1 })
      .lean(),
    Debt.find({ userId, status: 'active' }).lean(),
    BenchmarkRate.find({ userId }).lean(),
  ]);

  const savedBenchmarkKeys = new Set(benchmarkDocs.map((b) => b.key.toUpperCase()));
  const benchmarks: BenchmarkRateValue[] = [
    ...benchmarkDocs.map((b) => ({ key: b.key, value: b.value })),
    ...Object.entries(DEFAULT_BENCHMARKS)
      .filter(([k]) => !savedBenchmarkKeys.has(k))
      .map(([key, value]) => ({ key, value })),
  ];

  const debtMonthlyData: DebtMonthlyPoint[] = activeDebts.map((d) => {
    const resolvedTiers = resolveDebtTiers((d.interestTiers ?? []) as InterestTier[], benchmarks);
    const s = buildSchedule({
      principal: d.balance > 0 ? d.balance : d.principal,
      annualPercent: d.interestRate,
      termMonths: d.termMonths,
      method: d.method,
      startDate: new Date(d.startDate),
      tiers: resolvedTiers.length > 0 ? resolvedTiers : null,
      convention: d.convention,
    });
    return {
      id: d._id.toString(),
      name: d.name,
      kind: d.kind as DebtKind,
      monthlyPayment: s.monthlyPayment,
    };
  });
  const totalDebtMonthly = debtMonthlyData.reduce((sum, d) => sum + d.monthlyPayment, 0);

  const forecastWindowStart = new Date();
  forecastWindowStart.setMonth(forecastWindowStart.getMonth() - 3);
  forecastWindowStart.setDate(1);
  forecastWindowStart.setHours(0, 0, 0, 0);
  const currentMonthStart = startOfMonth();

  const pastCategoryTotals: Record<string, number> = {};
  const pastMonths = new Set<string>();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const d = new Date(t.date);
    if (d >= forecastWindowStart && d < currentMonthStart) {
      pastCategoryTotals[t.category] = (pastCategoryTotals[t.category] ?? 0) + t.amount;
      pastMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
  }
  const sampleMonths = Math.max(1, pastMonths.size);

  const forecastData: ForecastPoint[] = [];
  if (totalDebtMonthly > 0) {
    forecastData.push({
      source: 'debt',
      key: '__debt__',
      label: 'ภาระผ่อนหนี้สิน',
      value: totalDebtMonthly,
    });
  }
  for (const [cat, total] of Object.entries(pastCategoryTotals)) {
    forecastData.push({
      source: 'category',
      key: cat,
      label: cat,
      value: total / sampleMonths,
    });
  }

  const monthStart = startOfMonth();
  let monthIncome = 0;
  let monthExpense = 0;
  let monthCount = 0;
  const categoryTotals: Record<string, number> = {};

  const last30Start = startOfDayAgo(29);
  const dailyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30Start);
    d.setDate(d.getDate() + i);
    dailyMap.set(dayKey(d), { income: 0, expense: 0 });
  }

  const monthlyMap = new Map<string, { income: number; expense: number; label: string }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    monthlyMap.set(monthKey(d), { income: 0, expense: 0, label: TH_MONTHS[d.getMonth()] });
  }

  for (const t of txs) {
    const d = new Date(t.date);

    if (d >= monthStart) {
      monthCount += 1;
      if (t.type === 'income') monthIncome += t.amount;
      else {
        monthExpense += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
      }
    }

    if (d >= last30Start) {
      const bucket = dailyMap.get(dayKey(d));
      if (bucket) {
        if (t.type === 'income') bucket.income += t.amount;
        else bucket.expense += t.amount;
      }
    }

    const mKey = monthKey(d);
    const mBucket = monthlyMap.get(mKey);
    if (mBucket) {
      if (t.type === 'income') mBucket.income += t.amount;
      else mBucket.expense += t.amount;
    }
  }

  const dailyData: DailyPoint[] = Array.from(dailyMap.entries()).map(([key, v]) => {
    const d = new Date(key);
    return {
      date: key,
      label: `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`,
      income: v.income,
      expense: v.expense,
    };
  });

  const monthlyData: MonthlyPoint[] = Array.from(monthlyMap.values()).map((v) => ({
    label: v.label,
    income: v.income,
    expense: v.expense,
  }));

  const categoryData: CategoryPoint[] = Object.entries(categoryTotals)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  const net = monthIncome - monthExpense;
  const displayName = session.user.name || session.user.email || 'Member';

  const recent: ListedTransaction[] = txs.slice(0, 50).map((t) => ({
    id: t._id.toString(),
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: new Date(t.date).toISOString(),
  }));

  return (
    <main className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 sm:mb-10 gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-2 sm:mb-3">
              <Wallet className="w-4 h-4" />
              Finance Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold gold-gradient-text break-words">
              สวัสดี, {displayName}
            </h1>
            <p className="text-neutral-400 mt-2 text-sm sm:text-base">ภาพรวมรายรับรายจ่ายของคุณ</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/finance/debts"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-400 hover:text-gold-200 border border-gold-400/20 hover:border-gold-300/50 rounded-full px-3 sm:px-4 py-2 transition-colors"
            >
              <Landmark className="w-3.5 h-3.5" />
              หนี้สิน
            </Link>
            <Link
              href="/finance/categories"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-400 hover:text-gold-200 border border-gold-400/20 hover:border-gold-300/50 rounded-full px-3 sm:px-4 py-2 transition-colors"
            >
              <Tags className="w-3.5 h-3.5" />
              จัดการหมวด
            </Link>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/finance/login' });
              }}
            >
              <button
                type="submit"
                className="text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-400 hover:text-gold-200 border border-gold-400/20 hover:border-gold-300/50 rounded-full px-3 sm:px-4 py-2 transition-colors"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard label="รายรับเดือนนี้" amount={formatTHB(monthIncome)} icon={ArrowDownCircle} accent="text-emerald-300" />
          <StatCard
            label="รายจ่ายเดือนนี้"
            amount={formatTHB(monthExpense)}
            sub={totalDebtMonthly > 0 ? `+ ภาระผ่อนคงที่ ${formatTHB(totalDebtMonthly)}` : undefined}
            icon={ArrowUpCircle}
            accent="text-rose-300"
          />
          <StatCard
            label="คงเหลือสุทธิ"
            amount={formatTHB(net)}
            icon={TrendingUp}
            accent={net >= 0 ? 'text-emerald-300' : 'text-rose-300'}
          />
          <StatCard label="จำนวนรายการ" amount={String(monthCount)} icon={ListChecks} accent="text-gold-300" />
        </div>

        <div className="mb-5 sm:mb-6">
          <DailyChart data={dailyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6">
          <MonthlyChart data={monthlyData} />
          <CategoryChart data={categoryData} categoryNames={categoryNames} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-10">
          <DebtMonthlyChart data={debtMonthlyData} />
          <ExpenseForecastChart data={forecastData} categoryNames={categoryNames} sampleMonths={sampleMonths} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6">
          <TransactionForm categories={categories} />
          <SlipUploader categories={categories} />
        </div>

        <TransactionList transactions={recent} categoryNames={categoryNames} />
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
      {sub && <div className="mt-1 text-[10px] text-rose-300/80 tabular-nums truncate">{sub}</div>}
    </div>
  );
}
