import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, ListChecks, Tags } from 'lucide-react';
import { auth, signOut } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import { Transaction } from '@/models/Transaction';
import { formatTHB, startOfMonth, startOfDayAgo } from '@/lib/finance';
import { ensureDefaultCategories, listUserCategories, buildCategoryNameMap } from '@/lib/categories';
import TransactionForm from '@/components/finance/TransactionForm';
import TransactionList, { type ListedTransaction } from '@/components/finance/TransactionList';
import SlipUploader from '@/components/finance/SlipUploader';
import DailyChart, { type DailyPoint } from '@/components/finance/charts/DailyChart';
import CategoryChart, { type CategoryPoint } from '@/components/finance/charts/CategoryChart';
import MonthlyChart, { type MonthlyPoint } from '@/components/finance/charts/MonthlyChart';

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

  const txs = await Transaction.find({ userId, date: { $gte: sixMonthsAgo } })
    .sort({ date: -1, createdAt: -1 })
    .lean();

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
    <main className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-3">
              <Wallet className="w-4 h-4" />
              Finance Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-bold gold-gradient-text">สวัสดี, {displayName}</h1>
            <p className="text-neutral-400 mt-2">ภาพรวมรายรับรายจ่ายของคุณ</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/finance/categories"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-neutral-400 hover:text-gold-200 border border-gold-400/20 hover:border-gold-300/50 rounded-full px-4 py-2 transition-colors"
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
                className="text-xs uppercase tracking-[0.25em] text-neutral-400 hover:text-gold-200 border border-gold-400/20 hover:border-gold-300/50 rounded-full px-4 py-2 transition-colors"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="รายรับเดือนนี้" amount={formatTHB(monthIncome)} icon={ArrowDownCircle} accent="text-emerald-300" />
          <StatCard label="รายจ่ายเดือนนี้" amount={formatTHB(monthExpense)} icon={ArrowUpCircle} accent="text-rose-300" />
          <StatCard
            label="คงเหลือสุทธิ"
            amount={formatTHB(net)}
            icon={TrendingUp}
            accent={net >= 0 ? 'text-emerald-300' : 'text-rose-300'}
          />
          <StatCard label="จำนวนรายการ" amount={String(monthCount)} icon={ListChecks} accent="text-gold-300" />
        </div>

        <div className="mb-6">
          <DailyChart data={dailyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <MonthlyChart data={monthlyData} />
          <CategoryChart data={categoryData} categoryNames={categoryNames} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
  icon: Icon,
  accent,
}: {
  label: string;
  amount: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="relative rounded-2xl border border-gold-400/15 bg-ink-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300/80">{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className="text-2xl font-bold text-neutral-50 tabular-nums">{amount}</div>
    </div>
  );
}
