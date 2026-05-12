'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatTHB, CATEGORY_LABELS_TH } from '@/lib/finance';

export type ListedTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string | null;
  date: string;
};

type Props = {
  transactions: ListedTransaction[];
  categoryNames?: Record<string, string>;
};

export default function TransactionList({ transactions, categoryNames }: Props) {
  return (
    <div className="rounded-2xl border border-gold-400/15 bg-ink-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/10">
        <h3 className="text-sm uppercase tracking-[0.25em] text-gold-300/80">รายการล่าสุด</h3>
        <span className="text-xs text-neutral-500">{transactions.length} รายการ</span>
      </div>

      {transactions.length === 0 ? (
        <div className="px-6 py-12 text-center text-neutral-500 text-sm">
          ยังไม่มีรายการ เริ่มเพิ่มรายการแรกได้เลย
        </div>
      ) : (
        <ul className="divide-y divide-gold-400/5 max-h-[420px] overflow-y-auto">
          {transactions.map((t) => (
            <Row key={t.id} t={t} categoryNames={categoryNames} />
          ))}
        </ul>
      )}
    </div>
  );
}

function resolveCategoryName(slug: string, names?: Record<string, string>) {
  return names?.[slug] ?? CATEGORY_LABELS_TH[slug] ?? slug;
}

function Row({ t, categoryNames }: { t: ListedTransaction; categoryNames?: Record<string, string> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isIncome = t.type === 'income';

  function onDelete() {
    if (!confirm('ลบรายการนี้?')) return;
    startTransition(async () => {
      const res = await fetch(`/api/finance/transactions/${t.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    });
  }

  const d = new Date(t.date);
  const dateLabel = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });

  return (
    <li className="group flex items-center gap-4 px-6 py-3.5 hover:bg-ink-800/50 transition-colors">
      <div
        className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${
          isIncome
            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
            : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
        }`}
      >
        {isIncome ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-100 truncate">
          {resolveCategoryName(t.category, categoryNames)}
          {t.description ? <span className="text-neutral-500 font-normal"> · {t.description}</span> : null}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">{dateLabel}</div>
      </div>

      <div className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-300' : 'text-rose-300'}`}>
        {isIncome ? '+' : '−'}
        {formatTHB(t.amount)}
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="ลบ"
        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-300 transition-all disabled:opacity-30"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
