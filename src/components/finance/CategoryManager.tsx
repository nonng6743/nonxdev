'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlainCategory } from '@/lib/categories';
import type { TransactionType } from '@/lib/finance';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-sm focus:outline-none focus:border-gold-300/60 focus:bg-ink-800/90 transition-colors';

export default function CategoryManager({ initial }: { initial: PlainCategory[] }) {
  const expense = initial.filter((c) => c.type === 'expense');
  const income = initial.filter((c) => c.type === 'income');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Column type="expense" title="หมวดรายจ่าย" accent="rose" items={expense} allItems={initial} />
      <Column type="income" title="หมวดรายรับ" accent="emerald" items={income} allItems={initial} />
    </div>
  );
}

function Column({
  type,
  title,
  accent,
  items,
  allItems,
}: {
  type: TransactionType;
  title: string;
  accent: 'rose' | 'emerald';
  items: PlainCategory[];
  allItems: PlainCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'เพิ่มไม่สำเร็จ');
        return;
      }
      setNewName('');
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-gold-400/15 bg-ink-900/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full',
              accent === 'rose' ? 'bg-rose-300' : 'bg-emerald-300',
            )}
          />
          <h3 className="text-sm uppercase tracking-[0.25em] text-gold-300/80">{title}</h3>
        </div>
        <span className="text-xs text-neutral-500">{items.length} หมวด</span>
      </div>

      <ul className="space-y-2 mb-5">
        {items.map((c) => (
          <CategoryRow key={c.id} category={c} siblings={allItems.filter((x) => x.type === type && x.id !== c.id)} />
        ))}
        {items.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-4">ยังไม่มีหมวด</li>
        )}
      </ul>

      <form onSubmit={add} className="space-y-3 pt-4 border-t border-gold-400/10">
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.25em] text-gold-300/80 mb-1.5">
            เพิ่มหมวดใหม่
          </span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
            placeholder={type === 'expense' ? 'เช่น ทำผม' : 'เช่น โบนัส'}
            className={inputClass}
          />
        </label>
        {error && (
          <p className="text-xs text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !newName.trim()}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full text-xs uppercase tracking-[0.25em] font-medium',
            'border border-gold-400/30 text-gold-200 hover:border-gold-300/60 hover:text-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          เพิ่มหมวด
        </button>
      </form>
    </div>
  );
}

function CategoryRow({ category, siblings }: { category: PlainCategory; siblings: PlainCategory[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      setName(category.name);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/finance/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'แก้ไขไม่สำเร็จ');
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove(reassignToSlug?: string) {
    setError(null);
    startTransition(async () => {
      const url = reassignToSlug
        ? `/api/finance/categories/${category.id}?reassignTo=${encodeURIComponent(reassignToSlug)}`
        : `/api/finance/categories/${category.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'ลบไม่สำเร็จ');
        return;
      }
      setDeleting(false);
      router.refresh();
    });
  }

  if (deleting) {
    return (
      <li className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-3 space-y-2.5">
        <p className="text-sm text-rose-100">
          ลบหมวด <strong>{category.name}</strong>? รายการเก่าจะแสดงเป็นชื่อ slug เดิม
        </p>
        {siblings.length > 0 && (
          <details className="text-xs text-neutral-300">
            <summary className="cursor-pointer hover:text-gold-200">หรือย้ายรายการเก่าไปหมวดอื่น</summary>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {siblings.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => remove(s.slug)}
                  disabled={pending}
                  className="px-2 py-1.5 rounded-md border border-gold-400/20 hover:border-gold-300/60 text-left truncate"
                >
                  → {s.name}
                </button>
              ))}
            </div>
          </details>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => remove()}
            disabled={pending}
            className="flex-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-rose-100"
          >
            ลบเลย
          </button>
          <button
            type="button"
            onClick={() => setDeleting(false)}
            disabled={pending}
            className="flex-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] border border-neutral-700 text-neutral-300 hover:text-white"
          >
            ยกเลิก
          </button>
        </div>
        {error && <p className="text-xs text-rose-200">{error}</p>}
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 rounded-xl border border-gold-400/10 bg-ink-800/40 px-3.5 py-2.5 hover:border-gold-400/30 transition-colors">
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                setEditing(false);
                setName(category.name);
              }
            }}
            className="flex-1 bg-transparent border-b border-gold-400/40 focus:border-gold-300 outline-none text-sm text-neutral-50"
          />
          <button onClick={save} disabled={pending} className="text-emerald-300 hover:text-emerald-200" aria-label="บันทึก">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(category.name);
            }}
            disabled={pending}
            className="text-neutral-500 hover:text-neutral-200"
            aria-label="ยกเลิก"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-neutral-100 truncate">{category.name}</span>
          <span className="text-[10px] text-neutral-600 font-mono">{category.slug}</span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-gold-300 transition-opacity"
            aria-label="แก้ไข"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleting(true)}
            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-300 transition-opacity"
            aria-label="ลบ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {error && !editing && <span className="text-xs text-rose-300 ml-2">{error}</span>}
    </li>
  );
}
