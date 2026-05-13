'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Percent, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_BENCHMARKS, DEFAULT_BENCHMARKS_AS_OF } from '@/lib/debt';

const DEFAULT_KEYS = ['MRR', 'MLR', 'MOR'] as const;

export type BenchmarkEntry = {
  key: string;
  value: number;
  updatedAt?: string | Date | null;
};

type Row = { key: string; value: string; locked: boolean; isDefault: boolean };

function buildRows(initial: BenchmarkEntry[]): Row[] {
  const map = new Map(initial.map((b) => [b.key.toUpperCase(), b.value]));
  const rows: Row[] = DEFAULT_KEYS.map((k) => {
    const saved = map.has(k);
    const fallback = DEFAULT_BENCHMARKS[k];
    return {
      key: k,
      value: saved ? String(map.get(k)) : fallback != null ? String(fallback) : '',
      locked: true,
      isDefault: !saved && fallback != null,
    };
  });
  for (const b of initial) {
    const k = b.key.toUpperCase();
    if (!DEFAULT_KEYS.includes(k as (typeof DEFAULT_KEYS)[number])) {
      rows.push({ key: k, value: String(b.value), locked: false, isDefault: false });
    }
  }
  return rows;
}

export default function BenchmarkPanel({ initial }: { initial: BenchmarkEntry[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => buildRows(initial));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, ...patch, isDefault: 'value' in patch ? false : r.isDefault } : r,
      ),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { key: '', value: '', locked: false, isDefault: false }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSave() {
    setError(null);
    const payload = rows
      .map((r) => ({ key: r.key.trim().toUpperCase(), value: Number(r.value) }))
      .filter((r) => r.key && r.value > 0);

    startTransition(async () => {
      const res = await fetch('/api/finance/benchmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benchmarks: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'บันทึกไม่สำเร็จ');
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-gold-400/15 bg-ink-900/60 p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold-300/80 mb-1">
            <Percent className="w-3.5 h-3.5" />
            อัตราอ้างอิง (Benchmark Rates)
          </div>
          <p className="text-xs text-neutral-500 max-w-md">
            กำหนดค่า MRR/MLR/MOR ปัจจุบัน เพื่อให้ระบบคำนวณดอกเบี้ยลอยตัวให้อัตโนมัติ
            <br />
            ใช้ในช่อง “ดอก%” ของหนี้ — พิมพ์ <code className="text-gold-200">MRR-2</code> ระบบจะแทนค่าให้
          </p>
        </div>
        {savedAt && (
          <span className="text-[10px] text-emerald-300/80">
            บันทึก {savedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/90">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          ค่าเริ่มต้นเป็นค่าเฉลี่ยตลาด (อัปเดต {DEFAULT_BENCHMARKS_AS_OF}) — กรุณาปรับให้ตรงกับธนาคารของท่านแล้วกด “บันทึก”
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              value={r.key}
              onChange={(e) => updateRow(i, { key: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 16) })}
              readOnly={r.locked}
              placeholder="KEY"
              className={cn(
                'col-span-4 sm:col-span-3 px-3 py-2 rounded-lg text-sm bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 focus:outline-none focus:border-gold-300/60',
                r.locked && 'text-gold-200 font-medium',
              )}
            />
            <div className="col-span-7 sm:col-span-8 relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={r.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="0.00"
                className={cn(
                  'w-full px-3 py-2 pr-16 rounded-lg text-sm bg-ink-800/60 border text-neutral-50 placeholder:text-neutral-600 focus:outline-none focus:border-gold-300/60 scheme-dark tabular-nums',
                  r.isDefault ? 'border-amber-400/30 text-amber-100' : 'border-gold-400/15',
                )}
              />
              {r.isDefault && (
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.15em] text-amber-300/80 pointer-events-none">
                  default
                </span>
              )}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
                %
              </span>
            </div>
            {!r.locked ? (
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label="ลบ"
                className="col-span-1 flex justify-center text-neutral-500 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="col-span-1" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-gold-200 transition-colors px-2 py-1.5 rounded-md border border-gold-400/15 hover:border-gold-300/40"
        >
          <Plus className="w-3 h-3" />
          เพิ่มอัตรา
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em] font-medium',
            'border border-gold-400/30 text-gold-200 hover:border-gold-300/60 hover:text-white transition-colors',
            'disabled:opacity-50',
          )}
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          บันทึก
        </button>
      </div>
    </div>
  );
}
