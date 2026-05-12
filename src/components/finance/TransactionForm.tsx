'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlainCategory } from '@/lib/categories';
import type { TransactionType } from '@/lib/finance';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-sm focus:outline-none focus:border-gold-300/60 focus:bg-ink-800/90 transition-colors [color-scheme:dark]';

type Props = {
  categories: PlainCategory[];
};

export default function TransactionForm({ categories }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>('expense');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter((c) => c.type === type);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      type,
      amount: Number(data.get('amount')),
      category: String(data.get('category')),
      description: String(data.get('description') || '').trim() || undefined,
      date: String(data.get('date') || '') || undefined,
    };

    startTransition(async () => {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'บันทึกไม่สำเร็จ');
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gold-400/15 bg-ink-900/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-[0.25em] text-gold-300/80">เพิ่มรายการ</h3>
        <Link
          href="/finance/categories"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-gold-200 transition-colors"
        >
          <Tags className="w-3 h-3" />
          จัดการหมวด
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl border border-gold-400/15 bg-ink-800/40 p-1">
        <TypeTab active={type === 'expense'} onClick={() => setType('expense')} label="รายจ่าย" accent="rose" />
        <TypeTab active={type === 'income'} onClick={() => setType('income')} label="รายรับ" accent="emerald" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="จำนวน (บาท)">
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <Field label="วันที่">
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="หมวด">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gold-400/30 bg-ink-800/30 px-3.5 py-3 text-sm text-neutral-400">
              ยังไม่มีหมวด —{' '}
              <Link href="/finance/categories" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
                เพิ่มหมวด
              </Link>{' '}
              ก่อนบันทึก
            </div>
          ) : (
            <select name="category" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                เลือกหมวด…
              </option>
              {filtered.map((c) => (
                <option key={c.id} value={c.slug} className="bg-ink-900">
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="โน้ต (ไม่บังคับ)">
          <input
            name="description"
            type="text"
            maxLength={200}
            placeholder="เช่น ข้าวกลางวัน"
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || filtered.length === 0}
          className={cn(
            'group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm tracking-wide',
            'bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow',
            'transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100',
          )}
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> บันทึกรายการ
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.25em] text-gold-300/80 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function TypeTab({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent: 'rose' | 'emerald';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? accent === 'rose'
            ? 'bg-rose-500/15 text-rose-200 border border-rose-400/40'
            : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40'
          : 'text-neutral-500 hover:text-neutral-300 border border-transparent',
      )}
    >
      {label}
    </button>
  );
}
