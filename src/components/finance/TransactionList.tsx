'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowDownCircle, ArrowUpCircle, Pencil, Check, X, Loader2 } from 'lucide-react';
import { formatTHB, CATEGORY_LABELS_TH } from '@/lib/finance';
import { cn } from '@/lib/utils';
import type { PlainCategory } from '@/lib/categories';

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
  categories?: PlainCategory[];
};

export default function TransactionList({ transactions, categoryNames, categories = [] }: Props) {
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
            <Row key={t.id} t={t} categoryNames={categoryNames} categories={categories} />
          ))}
        </ul>
      )}
    </div>
  );
}

function resolveCategoryName(slug: string, names?: Record<string, string>) {
  return names?.[slug] ?? CATEGORY_LABELS_TH[slug] ?? slug;
}

const editInputClass =
  'w-full px-2.5 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-xs focus:outline-none focus:border-gold-300/60 [color-scheme:dark]';

function Row({
  t,
  categoryNames,
  categories,
}: {
  t: ListedTransaction;
  categoryNames?: Record<string, string>;
  categories: PlainCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
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

  if (editing) {
    return (
      <li className="px-4 sm:px-6 py-3 sm:py-3.5 bg-ink-800/40">
        <EditForm
          t={t}
          categories={categories}
          pending={pending}
          onCancel={() => setEditing(false)}
          onSave={(payload) => {
            startTransition(async () => {
              const res = await fetch(`/api/finance/transactions/${t.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (res.ok) {
                setEditing(false);
                router.refresh();
              }
            });
          }}
        />
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-3.5 hover:bg-ink-800/50 transition-colors">
      <div
        className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center ${
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
        <div className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">{dateLabel}</div>
      </div>

      <div className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-emerald-300' : 'text-rose-300'}`}>
        {isIncome ? '+' : '−'}
        {formatTHB(t.amount)}
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={pending}
        aria-label="แก้ไข"
        className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-500 hover:text-gold-200 transition-all disabled:opacity-30"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="ลบ"
        className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-500 hover:text-rose-300 transition-all disabled:opacity-30"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

function EditForm({
  t,
  categories,
  pending,
  onCancel,
  onSave,
}: {
  t: ListedTransaction;
  categories: PlainCategory[];
  pending: boolean;
  onCancel: () => void;
  onSave: (payload: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string | null;
    date: string;
  }) => void;
}) {
  const [type, setType] = useState<'income' | 'expense'>(t.type);
  const [amount, setAmount] = useState(String(t.amount));
  const [category, setCategory] = useState(t.category);
  const [description, setDescription] = useState(t.description ?? '');
  const [date, setDate] = useState(new Date(t.date).toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter((c) => c.type === type);
  const categoryExists = filtered.some((c) => c.slug === category);

  function submit() {
    setError(null);
    const amt = Number(amount.replace(/,/g, ''));
    if (!isFinite(amt) || amt <= 0) {
      setError('จำนวนเงินไม่ถูกต้อง');
      return;
    }
    if (!category) {
      setError('กรุณาเลือกหมวด');
      return;
    }
    onSave({
      type,
      amount: amt,
      category,
      description: description.trim() || null,
      date,
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={cn(
            'py-1.5 rounded-lg text-xs font-medium transition-colors border',
            type === 'expense'
              ? 'bg-rose-500/15 text-rose-200 border-rose-400/40'
              : 'text-neutral-500 hover:text-neutral-300 border-transparent',
          )}
        >
          รายจ่าย
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={cn(
            'py-1.5 rounded-lg text-xs font-medium transition-colors border',
            type === 'income'
              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
              : 'text-neutral-500 hover:text-neutral-300 border-transparent',
          )}
        >
          รายรับ
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="จำนวน"
          className={editInputClass}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={editInputClass} />
      </div>

      {filtered.length > 0 ? (
        <select value={categoryExists ? category : ''} onChange={(e) => setCategory(e.target.value)} className={editInputClass}>
          <option value="" disabled>
            เลือกหมวด…
          </option>
          {!categoryExists && t.category && (
            <option value={t.category} className="bg-ink-900">
              {resolveCategoryName(t.category)} (หมวดเดิม)
            </option>
          )}
          {filtered.map((c) => (
            <option key={c.id} value={c.slug} className="bg-ink-900">
              {c.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="หมวด"
          className={editInputClass}
        />
      )}

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        placeholder="โน้ต (ไม่บังคับ)"
        className={editInputClass}
      />

      {error && <p className="text-[11px] text-rose-300">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] font-medium bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          บันทึก
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.2em] border border-neutral-700 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
