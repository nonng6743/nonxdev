'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, ScanLine, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTHB } from '@/lib/finance';
import type { PlainCategory } from '@/lib/categories';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-sm focus:outline-none focus:border-gold-300/60 focus:bg-ink-800/90 transition-colors [color-scheme:dark]';

type ParsedSlip = {
  amount: number;
  date: string | null;
  time: string | null;
  ref: string | null;
  sender: { name: string | null; bank: string | null; account: string | null };
  receiver: { name: string | null; bank: string | null; account: string | null };
};

type Props = { categories: PlainCategory[] };

export default function SlipUploader({ categories }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedSlip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, scanTransition] = useTransition();
  const [saving, saveTransition] = useTransition();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  function reset() {
    setPreview(null);
    setParsed(null);
    setError(null);
    setNote('');
    setCategorySlug('');
    if (fileInput.current) fileInput.current.value = '';
  }

  function handleFile(file: File) {
    setError(null);
    setParsed(null);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append('file', file);

    scanTransition(async () => {
      const res = await fetch('/api/finance/slip', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'อ่านสลิปไม่สำเร็จ');
        return;
      }
      setParsed(body.slip as ParsedSlip);
    });
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function save() {
    if (!parsed) return;
    if (!categorySlug) {
      setError('กรุณาเลือกหมวด');
      return;
    }
    setError(null);

    saveTransition(async () => {
      const payload = {
        type,
        amount: parsed.amount,
        category: categorySlug,
        description:
          note.trim() ||
          [parsed.receiver.name, parsed.ref ? `Ref ${parsed.ref}` : null].filter(Boolean).join(' · ') ||
          undefined,
        date: parsed.date || undefined,
      };
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
      reset();
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-gold-400/15 bg-ink-900/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-gold-300/80">
          <ScanLine className="w-4 h-4" />
          อ่านสลิป
        </div>
        {parsed && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-neutral-500 hover:text-gold-200 inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> เริ่มใหม่
          </button>
        )}
      </div>

      {!preview && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'block border-2 border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer transition-colors',
            dragOver
              ? 'border-gold-300/70 bg-ink-800/60'
              : 'border-gold-400/25 hover:border-gold-300/50 hover:bg-ink-800/30',
          )}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={onFilePick}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-3 text-gold-300/60" />
          <div className="text-sm text-neutral-200 mb-1">ลากภาพสลิปมาวาง หรือคลิกเลือก</div>
          <div className="text-xs text-neutral-500">JPG / PNG / WebP / HEIC · ไม่เกิน 5MB</div>
        </label>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gold-400/15 bg-ink-800/60">
            <Image src={preview} alt="slip preview" fill className="object-contain" unoptimized />
            {scanning && (
              <div className="absolute inset-0 bg-ink-900/70 flex flex-col items-center justify-center gap-2 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-gold-300" />
                <span className="text-gold-200">กำลังอ่านสลิปผ่าน slip2go…</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {parsed && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gold-400/20 bg-ink-800/40 px-4 py-3 space-y-2 text-sm">
                <Row label="จำนวน">
                  <span className="text-gold-100 font-semibold tabular-nums">{formatTHB(parsed.amount)}</span>
                </Row>
                <Row label="วันที่">{parsed.date ?? '—'}{parsed.time ? ` ${parsed.time}` : ''}</Row>
                <Row label="อ้างอิง">
                  <span className="font-mono text-xs">{parsed.ref ?? '—'}</span>
                </Row>
                <Row label="ผู้ส่ง">{parsed.sender.name ?? '—'}{parsed.sender.bank ? ` · ${parsed.sender.bank}` : ''}</Row>
                <Row label="ผู้รับ">{parsed.receiver.name ?? '—'}{parsed.receiver.bank ? ` · ${parsed.receiver.bank}` : ''}</Row>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-gold-400/15 bg-ink-800/40 p-1">
                <TypeTab active={type === 'expense'} onClick={() => { setType('expense'); setCategorySlug(''); }} label="รายจ่าย" accent="rose" />
                <TypeTab active={type === 'income'} onClick={() => { setType('income'); setCategorySlug(''); }} label="รายรับ" accent="emerald" />
              </div>

              <Field label="หมวด">
                <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={inputClass}>
                  <option value="" disabled>เลือกหมวด…</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-ink-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="โน้ต (ใช้ ผู้รับ/ref อัตโนมัติถ้าเว้นว่าง)">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="เช่น ค่าอาหารกับเพื่อน"
                  className={inputClass}
                />
              </Field>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className={cn(
                  'group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm tracking-wide',
                  'bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow',
                  'transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100',
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> บันทึกเป็น{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] uppercase tracking-[0.25em] text-gold-300/70">{label}</span>
      <span className="text-neutral-200 text-right truncate">{children}</span>
    </div>
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
