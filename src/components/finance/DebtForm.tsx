'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Calculator, Trash2, Layers, Link2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTHB } from '@/lib/finance';
import {
  buildSchedule,
  DEBT_KIND_LABELS_TH,
  DEBT_KINDS,
  INTEREST_METHOD_LABELS_TH,
  INTEREST_CONVENTIONS,
  INTEREST_CONVENTION_LABELS_TH,
  parseAmount,
  parseRateInput,
  type BenchmarkRate,
  type DebtKind,
  type InterestMethod,
  type InterestConvention,
  type InterestTier,
} from '@/lib/debt';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-sm focus:outline-none focus:border-gold-300/60 focus:bg-ink-800/90 transition-colors [color-scheme:dark]';

const smallInputClass =
  'w-full px-2.5 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600 text-xs focus:outline-none focus:border-gold-300/60 [color-scheme:dark]';

type TierDraft = {
  months: string;
  rateInput: string;
  rateLabel: string;
  monthlyPayment: string;
};

export type ParentDebtOption = {
  id: string;
  name: string;
};

export type DebtFormInitial = {
  id: string;
  name: string;
  kind: DebtKind;
  principal: number;
  balance: number;
  interestRate: number;
  termMonths: number;
  method: InterestMethod;
  convention: InterestConvention;
  startDate: string;
  notes: string | null;
  interestTiers: InterestTier[];
  parentDebtId: string | null;
};

type Props = {
  parentOptions?: ParentDebtOption[];
  benchmarks?: BenchmarkRate[];
  initial?: DebtFormInitial;
  onCancel?: () => void;
  onSuccess?: () => void;
};

function tiersFromInitial(initial?: DebtFormInitial): TierDraft[] {
  if (initial?.interestTiers && initial.interestTiers.length > 0) {
    return initial.interestTiers.map((t) => ({
      months: String(t.months),
      rateInput: t.rateFormula ?? String(t.ratePercent),
      rateLabel: t.rateLabel ?? '',
      monthlyPayment: t.monthlyPayment != null ? String(t.monthlyPayment) : '',
    }));
  }
  return [{ months: '12', rateInput: '', rateLabel: 'ปีที่ 1', monthlyPayment: '' }];
}

export default function DebtForm({ parentOptions = [], benchmarks = [], initial, onCancel, onSuccess }: Props) {
  const router = useRouter();
  const isEdit = !!initial;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<DebtKind>(initial?.kind ?? 'house');
  const [principal, setPrincipal] = useState<string>(initial ? String(initial.principal) : '');
  const [balance, setBalance] = useState<string>(initial ? String(initial.balance) : '');
  const [interestRate, setInterestRate] = useState<string>(
    initial && (!initial.interestTiers || initial.interestTiers.length === 0)
      ? String(initial.interestRate)
      : '',
  );
  const [termMonths, setTermMonths] = useState<string>(initial ? String(initial.termMonths) : '');
  const [method, setMethod] = useState<InterestMethod>(initial?.method ?? 'amortized');
  const [convention, setConvention] = useState<InterestConvention>(initial?.convention ?? 'daily365');
  const [startDate, setStartDate] = useState<string>(
    initial ? new Date(initial.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [parentDebtId, setParentDebtId] = useState<string>(initial?.parentDebtId ?? '');

  const [useTiers, setUseTiers] = useState(!!(initial?.interestTiers && initial.interestTiers.length > 0));
  const [tiers, setTiers] = useState<TierDraft[]>(() => tiersFromInitial(initial));

  const parsedTiers = useMemo(
    () => tiers.map((t) => parseRateInput(t.rateInput, benchmarks)),
    [tiers, benchmarks],
  );

  const cleanTiers = useMemo<InterestTier[]>(() => {
    if (!useTiers) return [];
    const result: InterestTier[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const months = Number(t.months);
      const parsed = parsedTiers[i];
      if (!months || !parsed) continue;
      result.push({
        months,
        ratePercent: parsed.ratePercent,
        rateLabel: t.rateLabel.trim() || parsed.rateFormula || null,
        rateFormula: parsed.rateFormula,
        monthlyPayment: t.monthlyPayment ? Number(t.monthlyPayment) : null,
      });
    }
    return result;
  }, [tiers, useTiers, parsedTiers]);

  const preview = useMemo(() => {
    const p = Number(principal);
    const r = Number(interestRate);
    const n = Number(termMonths);
    if (!p || !n) return null;
    if (useTiers && cleanTiers.length > 0) {
      return buildSchedule({
        principal: p,
        annualPercent: r || 0,
        termMonths: n,
        method: 'amortized',
        startDate: startDate ? new Date(startDate) : new Date(),
        tiers: cleanTiers,
        convention,
      });
    }
    if (r < 0) return null;
    return buildSchedule({
      principal: p,
      annualPercent: r,
      termMonths: n,
      method,
      startDate: startDate ? new Date(startDate) : new Date(),
      convention,
    });
  }, [principal, interestRate, termMonths, method, startDate, useTiers, cleanTiers, convention]);

  const tiersMonthsTotal = useMemo(() => tiers.reduce((s, t) => s + (Number(t.months) || 0), 0), [tiers]);

  const hadInitialTiers = !!(initial?.interestTiers && initial.interestTiers.length > 0);

  function onToggleTiers(checked: boolean) {
    if (!checked && hadInitialTiers && useTiers) {
      if (!confirm('ปิด "ดอกเบี้ยแบ่งช่วง" จะลบช่วงทั้งหมดของหนี้นี้เมื่อบันทึก ดำเนินการต่อหรือไม่?')) {
        return;
      }
    }
    setUseTiers(checked);
    if (checked) {
      setTiers((prev) => {
        if (prev.length === 0) return prev;
        const first = prev[0];
        if (first.rateInput.trim() === '' && interestRate.trim() !== '' && Number(interestRate) > 0) {
          return [{ ...first, rateInput: interestRate.trim() }, ...prev.slice(1)];
        }
        return prev;
      });
    }
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        months: '12',
        rateInput: '',
        rateLabel: `ปีที่ ${prev.length + 1}`,
        monthlyPayment: '',
      },
    ]);
  }

  function removeTier(i: number) {
    setTiers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTier(i: number, patch: Partial<TierDraft>) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function fillRemaining() {
    const total = Number(termMonths) || 0;
    if (!total) return;
    const used = tiers.slice(0, -1).reduce((s, t) => s + (Number(t.months) || 0), 0);
    const remain = Math.max(0, total - used);
    setTiers((prev) => prev.map((t, idx) => (idx === prev.length - 1 ? { ...t, months: String(remain) } : t)));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (useTiers && cleanTiers.length === 0) {
      setError('เปิด "ดอกเบี้ยแบ่งช่วง" ไว้แต่ยังไม่มีช่วงที่กรอกครบ — กรุณาใส่จำนวนเดือนและดอกเบี้ยให้ครบ หรือปิดสวิตช์ก่อนบันทึก');
      return;
    }

    const principalNum = parseAmount(principal);
    const termMonthsNum = parseAmount(termMonths);
    const interestRateNum = Number(interestRate) || 0;
    if (!isFinite(principalNum) || principalNum <= 0) {
      setError('ยอดเงินกู้ไม่ถูกต้อง');
      return;
    }
    if (!isFinite(termMonthsNum) || termMonthsNum < 1) {
      setError('ระยะเวลาไม่ถูกต้อง');
      return;
    }

    let balanceNum = NaN;
    if (isEdit) {
      balanceNum = parseAmount(balance);
      if (!isFinite(balanceNum) || balanceNum < 0) {
        setError('ยอดคงเหลือไม่ถูกต้อง — กรุณากรอกตัวเลข (เช่น 3636171.20)');
        return;
      }
      if (balanceNum > principalNum * 1.5) {
        setError(`ยอดคงเหลือ (${formatTHB(balanceNum)}) สูงผิดปกติเกินยอดกู้ — กรุณาตรวจสอบ`);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      kind,
      principal: principalNum,
      interestRate: interestRateNum,
      termMonths: termMonthsNum,
      method: useTiers ? 'amortized' : method,
      convention,
      startDate: startDate || undefined,
      notes: notes.trim() || undefined,
      interestTiers: useTiers && cleanTiers.length > 0 ? cleanTiers : isEdit ? [] : undefined,
    };
    if (isEdit) {
      payload.balance = balanceNum;
      payload.parentDebtId = parentDebtId || null;
    } else {
      payload.parentDebtId = parentDebtId || undefined;
    }

    startTransition(async () => {
      const url = isEdit ? `/api/finance/debts/${initial!.id}` : '/api/finance/debts';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'บันทึกไม่สำเร็จ');
        return;
      }
      if (isEdit) {
        router.refresh();
        onSuccess?.();
        return;
      }
      setName('');
      setPrincipal('');
      setInterestRate('');
      setTermMonths('');
      setNotes('');
      setParentDebtId('');
      setUseTiers(false);
      setTiers([{ months: '12', rateInput: '', rateLabel: 'ปีที่ 1', monthlyPayment: '' }]);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gold-400/15 bg-ink-900/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-[0.25em] text-gold-300/80">
          {isEdit ? 'แก้ไขหนี้สิน' : 'เพิ่มหนี้สิน'}
        </h3>
        <Calculator className="w-4 h-4 text-gold-300/80" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ชื่อหนี้">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="เช่น บ้านในฝัน"
              className={inputClass}
            />
          </Field>
          <Field label="ประเภท">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DebtKind)}
              className={inputClass}
            >
              {DEBT_KINDS.map((k) => (
                <option key={k} value={k} className="bg-ink-900">
                  {DEBT_KIND_LABELS_TH[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="ยอดเงินกู้ (บาท)">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <Field label={useTiers ? 'ดอกเบี้ยอ้างอิง (%/ปี)' : 'ดอกเบี้ย (% ต่อปี)'}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              required={!useTiers}
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="5.5"
              className={inputClass}
            />
          </Field>
          <Field label="ระยะเวลา (เดือน)">
            <input
              type="number"
              min="1"
              max="600"
              required
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              placeholder="360"
              className={inputClass}
            />
          </Field>
        </div>

        {isEdit && initial && (
          <Field label="ยอดคงเหลือปัจจุบัน (ปรับให้ตรงกับ Statement)">
            <input
              type="text"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] tabular-nums">
              <span className="text-neutral-500">
                เดิม {formatTHB(initial.balance)}
              </span>
              {(() => {
                const parsed = parseAmount(balance);
                if (!isFinite(parsed)) {
                  return <span className="text-rose-300">รูปแบบไม่ถูกต้อง</span>;
                }
                const diff = parsed - initial.balance;
                if (Math.abs(diff) < 0.01) {
                  return <span className="text-neutral-600">ไม่มีการเปลี่ยนแปลง</span>;
                }
                return (
                  <span className={diff < 0 ? 'text-emerald-300' : 'text-amber-300'}>
                    {diff < 0 ? '▼' : '▲'} {formatTHB(Math.abs(diff))} → {formatTHB(parsed)}
                  </span>
                );
              })()}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="วิธีคำนวณ">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as InterestMethod)}
              disabled={useTiers}
              className={cn(inputClass, useTiers && 'opacity-50 cursor-not-allowed')}
            >
              <option value="amortized" className="bg-ink-900">
                {INTEREST_METHOD_LABELS_TH.amortized}
              </option>
              <option value="flat" className="bg-ink-900">
                {INTEREST_METHOD_LABELS_TH.flat}
              </option>
            </select>
          </Field>
          <Field label="คิดดอกเบี้ย">
            <select
              value={convention}
              onChange={(e) => setConvention(e.target.value as InterestConvention)}
              className={inputClass}
            >
              {INTEREST_CONVENTIONS.map((c) => (
                <option key={c} value={c} className="bg-ink-900">
                  {INTEREST_CONVENTION_LABELS_TH[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันที่เริ่ม">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {parentOptions.length > 0 && (
          <Field label="รวมเป็นกลุ่มกับหนี้หลัก (ไม่บังคับ)">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
              <select
                value={parentDebtId}
                onChange={(e) => setParentDebtId(e.target.value)}
                className={cn(inputClass, 'pl-9')}
              >
                <option value="" className="bg-ink-900">
                  — ไม่มี (เป็นหนี้หลัก) —
                </option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id} className="bg-ink-900">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        )}

        <div className="rounded-xl border border-gold-400/10 bg-ink-800/30 p-3.5 space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold-300/80">
              <Layers className="w-3.5 h-3.5" />
              ดอกเบี้ยแบ่งช่วง (ปีที่ 1/2/3, MRR-X%)
            </span>
            <input
              type="checkbox"
              checked={useTiers}
              onChange={(e) => onToggleTiers(e.target.checked)}
              className="w-4 h-4 accent-gold-400"
            />
          </label>

          {useTiers && (
            <div className="space-y-2.5">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500 px-1">
                <span className="col-span-2">เดือน</span>
                <span className="col-span-3">ดอก% หรือ สูตร</span>
                <span className="col-span-3">ป้ายกำกับ</span>
                <span className="col-span-3">งวด/เดือน</span>
                <span className="col-span-1" />
              </div>
              {tiers.map((t, i) => {
                const parsed = parsedTiers[i];
                const hasFormula = parsed?.rateFormula != null;
                const showError = t.rateInput.trim().length > 0 && parsed === null;
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input
                      type="number"
                      min="1"
                      value={t.months}
                      onChange={(e) => updateTier(i, { months: e.target.value })}
                      placeholder="12"
                      className={cn(smallInputClass, 'col-span-3 sm:col-span-2')}
                    />
                    <div className="col-span-4 sm:col-span-3">
                      <input
                        type="text"
                        value={t.rateInput}
                        onChange={(e) => updateTier(i, { rateInput: e.target.value })}
                        placeholder="1.80 หรือ MRR-2"
                        className={cn(
                          smallInputClass,
                          'w-full',
                          showError && 'border-rose-400/60 text-rose-200',
                        )}
                      />
                      {hasFormula && parsed && (
                        <div className="mt-1 text-[10px] text-emerald-300/90 tabular-nums px-1">
                          = {parsed.ratePercent.toFixed(2)}%
                        </div>
                      )}
                      {showError && (
                        <div className="mt-1 text-[10px] text-rose-300 px-1 leading-tight">
                          รูปแบบไม่ถูกต้อง — ใช้ตัวเลข (เช่น 1.80) หรือสูตร (เช่น MRR-2)
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={t.rateLabel}
                      onChange={(e) => updateTier(i, { rateLabel: e.target.value })}
                      placeholder={hasFormula ? `${parsed?.rateFormula}%` : 'ปีที่ 1'}
                      maxLength={40}
                      className={cn(smallInputClass, 'col-span-12 sm:col-span-3 order-last sm:order-0')}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={t.monthlyPayment}
                      onChange={(e) => updateTier(i, { monthlyPayment: e.target.value })}
                      placeholder="13,500"
                      className={cn(smallInputClass, 'col-span-4 sm:col-span-3')}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      disabled={tiers.length === 1}
                      aria-label="ลบช่วง"
                      className="col-span-1 text-neutral-500 hover:text-rose-300 disabled:opacity-30 transition-colors flex justify-center pt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={cn(
                      'text-[11px] tabular-nums',
                      Number(termMonths) > 0 && tiersMonthsTotal !== Number(termMonths)
                        ? 'text-amber-300'
                        : 'text-neutral-500',
                    )}
                  >
                    รวม {tiersMonthsTotal} / {termMonths || 0} เดือน
                  </span>
                  <span
                    className={cn(
                      'text-[11px] tabular-nums',
                      cleanTiers.length === 0 ? 'text-rose-300' : 'text-emerald-300/80',
                    )}
                  >
                    {cleanTiers.length} / {tiers.length} ช่วงพร้อมบันทึก
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillRemaining}
                    className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-gold-200 transition-colors px-2 py-1 rounded-md border border-gold-400/15 hover:border-gold-300/40"
                  >
                    เติมช่วงสุดท้าย
                  </button>
                  <button
                    type="button"
                    onClick={addTier}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-gold-200 hover:text-white transition-colors px-2 py-1 rounded-md border border-gold-400/30 hover:border-gold-300/60"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่มช่วง
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                ดอก% รับเลขตรงๆ (เช่น <code className="text-gold-300">1.80</code>) หรือสูตรอ้างอิง (เช่น <code className="text-gold-300">MRR-2</code>)
                {benchmarks.length > 0 && (
                  <>
                    {' '}· ค่าปัจจุบัน:{' '}
                    {benchmarks.map((b, i) => (
                      <span key={b.key} className="text-gold-200/90 tabular-nums">
                        {i > 0 ? ', ' : ''}
                        {b.key}={b.value}%
                      </span>
                    ))}
                  </>
                )}
                <br />
                ปล่อยว่าง “งวด/เดือน” = ระบบคำนวณ amortization ให้อัตโนมัติ · ใส่ค่าเอง = ใช้ตามที่ธนาคารแจ้ง
              </p>
            </div>
          )}
        </div>

        <Field label="โน้ต (ไม่บังคับ)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder="เช่น ธนาคาร XYZ สาขา A"
            className={inputClass}
          />
        </Field>

        {preview && preview.monthlyPayment > 0 && (
          <div className="rounded-xl border border-gold-400/20 bg-gold-400/4 p-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-gold-300/80 mb-3">
              ตัวอย่างการคำนวณ
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="งวดเดือนแรก" value={formatTHB(preview.monthlyPayment)} accent="text-gold-200" />
              <Stat label="ดอกเบี้ยรวม" value={formatTHB(preview.totalInterest)} accent="text-rose-300" />
              <Stat label="ยอดชำระรวม" value={formatTHB(preview.totalPayment)} accent="text-neutral-100" />
              <Stat
                label="ปิดยอดประมาณ"
                value={
                  preview.payoffDate
                    ? preview.payoffDate.toLocaleDateString('th-TH', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'
                }
                accent="text-emerald-300"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-300 border border-red-400/30 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'group flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm tracking-wide',
              'bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow',
              'transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100',
            )}
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
              </>
            ) : isEdit ? (
              <>
                <Save className="w-4 h-4" /> บันทึกการแก้ไข
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> บันทึกหนี้สิน
              </>
            )}
          </button>
          {isEdit && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs uppercase tracking-[0.25em] font-medium border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              ยกเลิก
            </button>
          )}
        </div>
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

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">{label}</div>
      <div className={cn('font-semibold tabular-nums break-all', accent)}>{value}</div>
    </div>
  );
}
