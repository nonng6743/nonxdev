'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Home,
  Car,
  CreditCard,
  Wallet,
  Coins,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  CheckCircle2,
  Link2,
  CalendarClock,
  RefreshCcw,
  Pencil,
  Rocket,
  TrendingDown,
  Target,
} from 'lucide-react';
import DebtForm, { type ParentDebtOption } from './DebtForm';
import { formatTHB } from '@/lib/finance';
import {
  buildSchedule,
  summarizeTiers,
  projectedBalanceAt,
  simulatePayoff,
  requiredExtraToPayoff,
  DEBT_KIND_LABELS_TH,
  INTEREST_METHOD_LABELS_TH,
  type BenchmarkRate,
  type DebtKind,
  type InterestMethod,
  type InterestConvention,
  type DebtStatus,
  type InterestTier,
  type ProjectedSnapshot,
  type PayoffScenario,
} from '@/lib/debt';
import { cn } from '@/lib/utils';

export type ListedDebt = {
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
  status: DebtStatus;
  notes: string | null;
  interestTiers: InterestTier[];
  parentDebtId: string | null;
};

const KIND_ICONS: Record<DebtKind, React.ComponentType<{ className?: string }>> = {
  house: Home,
  car: Car,
  credit_card: CreditCard,
  personal: Wallet,
  other: Coins,
};

type Group = {
  parent: ListedDebt;
  children: ListedDebt[];
};

function groupDebts(debts: ListedDebt[]): { groups: Group[]; orphans: ListedDebt[] } {
  const byId = new Map(debts.map((d) => [d.id, d]));
  const groups: Group[] = [];
  const orphans: ListedDebt[] = [];

  for (const d of debts) {
    if (d.parentDebtId && byId.has(d.parentDebtId)) continue;
    if (!d.parentDebtId) {
      groups.push({
        parent: d,
        children: debts.filter((x) => x.parentDebtId === d.id),
      });
    } else {
      orphans.push(d);
    }
  }
  return { groups, orphans };
}

export default function DebtList({
  debts,
  parentOptions = [],
  benchmarks = [],
}: {
  debts: ListedDebt[];
  parentOptions?: ParentDebtOption[];
  benchmarks?: BenchmarkRate[];
}) {
  const { groups, orphans } = useMemo(() => groupDebts(debts), [debts]);

  return (
    <div className="rounded-2xl border border-gold-400/15 bg-ink-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/10">
        <h3 className="text-sm uppercase tracking-[0.25em] text-gold-300/80">หนี้สินทั้งหมด</h3>
        <span className="text-xs text-neutral-500">{debts.length} รายการ</span>
      </div>

      {debts.length === 0 ? (
        <div className="px-6 py-12 text-center text-neutral-500 text-sm">
          ยังไม่มีหนี้สิน เพิ่มรายการแรกเพื่อเริ่มต้นคำนวณ
        </div>
      ) : (
        <ul className="divide-y divide-gold-400/5">
          {groups.map((g) => (
            <DebtGroup key={g.parent.id} group={g} parentOptions={parentOptions} benchmarks={benchmarks} />
          ))}
          {orphans.map((d) => (
            <DebtRow key={d.id} debt={d} parentOptions={parentOptions} benchmarks={benchmarks} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DebtGroup({
  group,
  parentOptions,
  benchmarks,
}: {
  group: Group;
  parentOptions: ParentDebtOption[];
  benchmarks: BenchmarkRate[];
}) {
  if (group.children.length === 0) {
    return <DebtRow debt={group.parent} parentOptions={parentOptions} benchmarks={benchmarks} />;
  }
  return (
    <li>
      <DebtRow
        debt={group.parent}
        group={group}
        variant="parent"
        parentOptions={parentOptions}
        benchmarks={benchmarks}
      />
      <ul className="border-t border-gold-400/5 bg-ink-950/40">
        {group.children.map((c) => (
          <DebtRow key={c.id} debt={c} variant="child" parentOptions={parentOptions} benchmarks={benchmarks} />
        ))}
      </ul>
    </li>
  );
}

function DebtRow({
  debt,
  group,
  variant = 'standalone',
  parentOptions,
  benchmarks,
}: {
  debt: ListedDebt;
  group?: Group;
  variant?: 'standalone' | 'parent' | 'child';
  parentOptions: ParentDebtOption[];
  benchmarks: BenchmarkRate[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [proposedBalance, setProposedBalance] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [payAmount, setPayAmount] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);

  const Icon = KIND_ICONS[debt.kind] ?? Coins;
  const progress = debt.principal > 0 ? Math.min(100, ((debt.principal - debt.balance) / debt.principal) * 100) : 0;
  const hasTiers = debt.interestTiers && debt.interestTiers.length > 0;

  const summary = useMemo(
    () =>
      buildSchedule({
        principal: debt.balance > 0 ? debt.balance : debt.principal,
        annualPercent: debt.interestRate,
        termMonths: debt.termMonths,
        method: debt.method,
        startDate: new Date(debt.startDate),
        tiers: hasTiers ? debt.interestTiers : null,
        convention: debt.convention,
      }),
    [debt.balance, debt.principal, debt.interestRate, debt.termMonths, debt.method, debt.startDate, debt.interestTiers, hasTiers, debt.convention],
  );

  const tierSummary = useMemo(
    () =>
      hasTiers
        ? summarizeTiers({
            principal: debt.balance > 0 ? debt.balance : debt.principal,
            termMonths: debt.termMonths,
            tiers: debt.interestTiers,
            startDate: new Date(debt.startDate),
            convention: debt.convention,
          })
        : [],
    [debt.balance, debt.principal, debt.termMonths, debt.interestTiers, hasTiers, debt.startDate, debt.convention],
  );

  const projected = useMemo<ProjectedSnapshot>(
    () =>
      projectedBalanceAt({
        principal: debt.principal,
        annualPercent: debt.interestRate,
        termMonths: debt.termMonths,
        method: debt.method,
        startDate: new Date(debt.startDate),
        tiers: hasTiers ? debt.interestTiers : null,
        convention: debt.convention,
      }),
    [debt.principal, debt.interestRate, debt.termMonths, debt.method, debt.startDate, debt.interestTiers, hasTiers, debt.convention],
  );

  const balanceGap = debt.balance - projected.expectedBalance;

  function onDelete() {
    if (!confirm(`ลบหนี้ "${debt.name}"? ประวัติการชำระทั้งหมดจะถูกลบด้วย`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/finance/debts/${debt.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    });
  }

  function onSyncProjected() {
    if (projected.monthsElapsed === 0) return;
    setProposedBalance(projected.expectedBalance);
    setEditing(true);
    setExpanded(true);
  }

  function onPay(e: React.FormEvent) {
    e.preventDefault();
    setPayError(null);
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('กรุณาระบุจำนวนเงิน');
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/finance/debts/${debt.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPayError(body.error ?? 'บันทึกไม่สำเร็จ');
        return;
      }
      setPayAmount('');
      router.refresh();
    });
  }

  const isPaid = debt.status === 'paid';
  const isChild = variant === 'child';

  return (
    <li className={cn(isChild && 'border-l-2 border-gold-400/20 ml-4 sm:ml-6')}>
      <div className={cn(
        'flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-ink-800/40 transition-colors',
        isChild && 'py-3 pl-3 sm:pl-5',
      )}>
        <div
          className={cn(
            'shrink-0 rounded-xl border flex items-center justify-center',
            isChild ? 'w-8 h-8' : 'w-10 h-10',
            isPaid
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
              : isChild
                ? 'border-gold-400/20 bg-gold-400/5 text-gold-300/80'
                : 'border-gold-400/30 bg-gold-400/10 text-gold-200',
          )}
        >
          {isPaid ? <CheckCircle2 className="w-4 h-4" /> : isChild ? <Link2 className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium text-neutral-100 truncate', isChild && 'text-neutral-200')}>
              {debt.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {DEBT_KIND_LABELS_TH[debt.kind]}
            </span>
            {hasTiers && !isPaid && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold-300/80">
                {debt.interestTiers.length} ช่วง
              </span>
            )}
            {isPaid && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">ชำระครบ</span>
            )}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-ink-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isPaid ? 'bg-emerald-400/70' : 'bg-linear-to-r from-gold-400 to-gold-200',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-500 tabular-nums flex-wrap">
            <span>คงเหลือ {formatTHB(debt.balance)}</span>
            <span className="text-neutral-700">·</span>
            <span>จาก {formatTHB(debt.principal)}</span>
            {!hasTiers && (
              <>
                <span className="text-neutral-700">·</span>
                <span>{debt.interestRate}% ต่อปี</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 hidden sm:flex flex-col items-end text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">งวด/เดือน</div>
          <div className="text-sm font-semibold text-gold-200 tabular-nums">
            {formatTHB(summary.monthlyPayment)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-neutral-500 hover:text-gold-200 transition-colors"
          aria-label={expanded ? 'ย่อ' : 'ขยาย'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setExpanded(true);
          }}
          aria-label="แก้ไข"
          className="shrink-0 text-neutral-500 hover:text-gold-200 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label="ลบ"
          className="shrink-0 text-neutral-500 hover:text-rose-300 transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && editing && (
        <div className={cn('px-4 sm:px-6 pb-5 sm:pb-6 pt-1', isChild && 'pl-7 sm:pl-12')}>
          <DebtForm
            initial={{
              id: debt.id,
              name: debt.name,
              kind: debt.kind,
              principal: debt.principal,
              balance: proposedBalance ?? debt.balance,
              interestRate: debt.interestRate,
              termMonths: debt.termMonths,
              method: debt.method,
              convention: debt.convention,
              startDate: debt.startDate,
              notes: debt.notes,
              interestTiers: debt.interestTiers,
              parentDebtId: debt.parentDebtId,
            }}
            parentOptions={parentOptions.filter((p) => p.id !== debt.id)}
            benchmarks={benchmarks}
            onCancel={() => {
              setEditing(false);
              setProposedBalance(null);
            }}
            onSuccess={() => {
              setEditing(false);
              setProposedBalance(null);
            }}
          />
        </div>
      )}

      {expanded && !editing && (
        <div className={cn('px-4 sm:px-6 pb-5 sm:pb-6 pt-1 space-y-5', isChild && 'pl-7 sm:pl-12')}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <MiniStat label="งวดเดือนแรก" value={formatTHB(summary.monthlyPayment)} accent="text-gold-200" />
            <MiniStat label="ดอกเบี้ยคงเหลือ" value={formatTHB(summary.totalInterest)} accent="text-rose-300" />
            <MiniStat label="ยอดต้องชำระ" value={formatTHB(summary.totalPayment)} accent="text-neutral-100" />
            <MiniStat
              label="ปิดยอดประมาณ"
              value={
                summary.payoffDate
                  ? summary.payoffDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
                  : '-'
              }
              accent="text-emerald-300"
            />
          </div>

          <div className="text-[11px] text-neutral-500">
            {hasTiers ? `ดอกเบี้ยแบ่งช่วง (${debt.interestTiers.length} ช่วง)` : INTEREST_METHOD_LABELS_TH[debt.method]}
            {' · '}ระยะเวลา {debt.termMonths} เดือน
            {debt.notes ? <> · {debt.notes}</> : null}
          </div>

          {!isPaid && projected.monthsElapsed > 0 && (
            <ProjectedPanel
              projected={projected}
              storedBalance={debt.balance}
              storedPrincipal={debt.principal}
              balanceGap={balanceGap}
              onSync={onSyncProjected}
              pending={pending}
            />
          )}

          {!isPaid && summary.monthlyPayment > 0 && (
            <ExtraPaymentSimulator
              debt={debt}
              scheduledMonthly={summary.monthlyPayment}
              monthsElapsed={projected.monthsElapsed}
            />
          )}

          {hasTiers && tierSummary.length > 0 && (
            <TierBreakdown rows={tierSummary} />
          )}

          {group && group.children.length > 0 && <CombinedTimeline group={group} />}

          {!isPaid && (
            <form
              onSubmit={onPay}
              className="flex items-end gap-2 rounded-xl border border-gold-400/15 bg-ink-800/40 p-3"
            >
              <label className="flex-1 block">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-300/80 mb-1">
                  ชำระงวดนี้ (บาท)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={summary.monthlyPayment > 0 ? Math.round(summary.monthlyPayment).toString() : '0'}
                  className="w-full px-3 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 text-sm focus:outline-none focus:border-gold-300/60 scheme-dark"
                />
              </label>
              <button
                type="submit"
                disabled={pending || !payAmount}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] font-medium',
                  'border border-gold-400/30 text-gold-200 hover:border-gold-300/60 hover:text-white transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                ชำระ
              </button>
              {payError && <span className="text-xs text-rose-300">{payError}</span>}
            </form>
          )}

          <ScheduleTable rows={summary.schedule.slice(0, 12)} totalRows={summary.schedule.length} />
        </div>
      )}
    </li>
  );
}

function TierBreakdown({
  rows,
}: {
  rows: Array<{ index: number; startMonth: number; endMonth: number; ratePercent: number; rateLabel: string | null; monthlyPayment: number }>;
}) {
  return (
    <div className="rounded-xl border border-gold-400/10 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gold-400/10 bg-ink-800/40">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300/80">ดอกเบี้ยตามช่วง</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-ink-800/30 text-neutral-500">
            <tr>
              <th className="text-left px-3 py-2 font-normal">ช่วง</th>
              <th className="text-left px-3 py-2 font-normal">เดือนที่</th>
              <th className="text-right px-3 py-2 font-normal">ดอกเบี้ย</th>
              <th className="text-right px-3 py-2 font-normal">งวด/เดือน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-400/5">
            {rows.map((r) => (
              <tr key={r.index} className="hover:bg-ink-800/40 transition-colors">
                <td className="px-3 py-2 text-neutral-200">{r.rateLabel || `ช่วงที่ ${r.index + 1}`}</td>
                <td className="px-3 py-2 text-neutral-500 tabular-nums">
                  {r.startMonth}–{r.endMonth}
                </td>
                <td className="px-3 py-2 text-right text-rose-300 tabular-nums">{r.ratePercent}%</td>
                <td className="px-3 py-2 text-right text-gold-200 tabular-nums">{formatTHB(r.monthlyPayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Combined timeline: shows parent's tier windows and overlays each child's
 * monthly contribution active during that window. Mirrors the user's
 * "รวมยอดผ่อน ช่วงปีแรก 14,900 / ช่วงปีที่ 2 17,100..." breakdown.
 */
function CombinedTimeline({ group }: { group: Group }) {
  const parent = group.parent;
  const hasTiers = parent.interestTiers && parent.interestTiers.length > 0;

  type Window = { label: string; startMonth: number; endMonth: number; parentPayment: number };
  const windows: Window[] = useMemo(() => {
    if (hasTiers) {
      const sum = summarizeTiers({
        principal: parent.balance > 0 ? parent.balance : parent.principal,
        termMonths: parent.termMonths,
        tiers: parent.interestTiers,
        startDate: new Date(parent.startDate),
        convention: parent.convention,
      });
      return sum.map((s) => ({
        label: s.rateLabel || `ช่วงที่ ${s.index + 1}`,
        startMonth: s.startMonth,
        endMonth: s.endMonth,
        parentPayment: s.monthlyPayment,
      }));
    }
    const s = buildSchedule({
      principal: parent.balance > 0 ? parent.balance : parent.principal,
      annualPercent: parent.interestRate,
      termMonths: parent.termMonths,
      method: parent.method,
      startDate: new Date(parent.startDate),
      convention: parent.convention,
    });
    return [
      {
        label: 'ตลอดสัญญา',
        startMonth: 1,
        endMonth: parent.termMonths,
        parentPayment: s.monthlyPayment,
      },
    ];
  }, [parent, hasTiers]);

  const childMonthlies = useMemo(() => {
    return group.children.map((c) => {
      const s = buildSchedule({
        principal: c.balance > 0 ? c.balance : c.principal,
        annualPercent: c.interestRate,
        termMonths: c.termMonths,
        method: c.method,
        tiers: c.interestTiers && c.interestTiers.length > 0 ? c.interestTiers : null,
        startDate: new Date(c.startDate),
        convention: c.convention,
      });
      return {
        name: c.name,
        termMonths: c.termMonths,
        monthlyPayment: s.monthlyPayment,
      };
    });
  }, [group.children]);

  return (
    <div className="rounded-xl border border-gold-400/15 bg-gold-400/4 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gold-400/15 bg-gold-400/6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300">รวมยอดผ่อนทั้งกลุ่ม</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-neutral-500">
            <tr>
              <th className="text-left px-3 py-2 font-normal">ช่วง</th>
              <th className="text-right px-3 py-2 font-normal">หลัก</th>
              {childMonthlies.map((c, i) => (
                <th key={i} className="text-right px-3 py-2 font-normal truncate max-w-30">
                  {c.name}
                </th>
              ))}
              <th className="text-right px-3 py-2 font-normal text-gold-200">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-400/5">
            {windows.map((w, i) => {
              const childContribs = childMonthlies.map((c) => {
                const active = w.startMonth <= c.termMonths;
                return active ? c.monthlyPayment : 0;
              });
              const total = w.parentPayment + childContribs.reduce((s, v) => s + v, 0);
              return (
                <tr key={i} className="hover:bg-ink-800/30 transition-colors">
                  <td className="px-3 py-2 text-neutral-200">{w.label}</td>
                  <td className="px-3 py-2 text-right text-neutral-100 tabular-nums">{formatTHB(w.parentPayment)}</td>
                  {childContribs.map((v, j) => (
                    <td key={j} className="px-3 py-2 text-right text-neutral-300 tabular-nums">
                      {v > 0 ? formatTHB(v) : <span className="text-neutral-600">—</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold text-gold-200 tabular-nums">{formatTHB(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMonthSpan(m: number): string {
  if (m <= 0) return '0 เดือน';
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r} เดือน`;
  if (r === 0) return `${y} ปี`;
  return `${y} ปี ${r} เดือน`;
}

const PRESET_EXTRAS = [1000, 2000, 5000, 10000];

function ExtraPaymentSimulator({
  debt,
  scheduledMonthly,
  monthsElapsed,
}: {
  debt: ListedDebt;
  scheduledMonthly: number;
  monthsElapsed: number;
}) {
  const [mode, setMode] = useState<'by-extra' | 'by-time'>('by-extra');
  const [extra, setExtra] = useState<string>('');
  const [targetYears, setTargetYears] = useState<string>('');
  const [targetMonths, setTargetMonthsInput] = useState<string>('');
  const targetTotalMonths = (Number(targetYears) || 0) * 12 + (Number(targetMonths) || 0);
  const hasTiers = debt.interestTiers && debt.interestTiers.length > 0;
  const hasTierPayments = hasTiers && debt.interestTiers.some((t) => t.monthlyPayment != null && t.monthlyPayment > 0);

  const requiredResult = useMemo(() => {
    if (mode !== 'by-time' || targetTotalMonths <= 0) return null;
    return requiredExtraToPayoff({
      balance: debt.balance,
      annualPercent: debt.interestRate,
      monthlyPayment: scheduledMonthly,
      useTierPayments: hasTierPayments,
      startMonth: monthsElapsed,
      tiers: hasTiers ? debt.interestTiers : null,
      originalStartDate: new Date(debt.startDate),
      convention: debt.convention,
      targetMonths: targetTotalMonths,
    });
  }, [mode, targetTotalMonths, debt.balance, debt.interestRate, scheduledMonthly, hasTierPayments, monthsElapsed, hasTiers, debt.interestTiers, debt.startDate, debt.convention]);

  const effectiveExtra = mode === 'by-extra' ? Number(extra) || 0 : (requiredResult?.extraPerMonth ?? 0);
  const extraNum = effectiveExtra;

  const tierSummary = useMemo(
    () =>
      hasTiers
        ? summarizeTiers({
            principal: debt.balance > 0 ? debt.balance : debt.principal,
            termMonths: debt.termMonths,
            tiers: debt.interestTiers,
            startDate: new Date(debt.startDate),
            convention: debt.convention,
          })
        : [],
    [debt.balance, debt.principal, debt.termMonths, debt.interestTiers, hasTiers, debt.startDate, debt.convention],
  );

  const baseline = useMemo<PayoffScenario | null>(
    () =>
      simulatePayoff({
        balance: debt.balance,
        annualPercent: debt.interestRate,
        monthlyPayment: scheduledMonthly,
        extraPerMonth: 0,
        useTierPayments: hasTierPayments,
        startMonth: monthsElapsed,
        tiers: hasTiers ? debt.interestTiers : null,
        startDate: new Date(),
        originalStartDate: new Date(debt.startDate),
        convention: debt.convention,
      }),
    [debt.balance, debt.interestRate, debt.interestTiers, hasTiers, hasTierPayments, scheduledMonthly, monthsElapsed, debt.startDate, debt.convention],
  );

  const scenario = useMemo<PayoffScenario | null>(() => {
    if (extraNum <= 0) return null;
    return simulatePayoff({
      balance: debt.balance,
      annualPercent: debt.interestRate,
      monthlyPayment: scheduledMonthly,
      extraPerMonth: extraNum,
      useTierPayments: hasTierPayments,
      startMonth: monthsElapsed,
      tiers: hasTiers ? debt.interestTiers : null,
      startDate: new Date(),
      originalStartDate: new Date(debt.startDate),
      convention: debt.convention,
    });
  }, [debt.balance, debt.interestRate, debt.interestTiers, hasTiers, hasTierPayments, scheduledMonthly, monthsElapsed, extraNum, debt.startDate, debt.convention]);

  const monthsSaved = baseline && scenario ? baseline.monthsToPayoff - scenario.monthsToPayoff : 0;
  const interestSaved = baseline && scenario ? baseline.totalInterest - scenario.totalInterest : 0;

  return (
    <div className="rounded-xl border border-gold-400/15 bg-gold-400/4 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gold-400/15 bg-gold-400/6 flex items-center gap-2 flex-wrap">
        <Rocket className="w-3.5 h-3.5 text-gold-300" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300">จำลองการจ่าย</span>
        {hasTierPayments && (
          <span className="text-[9px] uppercase tracking-[0.15em] text-gold-300/60 ml-1">
            (ใช้ step-up ตามสัญญา)
          </span>
        )}
        <div className="ml-auto flex gap-1 rounded-full border border-gold-400/20 bg-ink-900/60 p-0.5">
          <button
            type="button"
            onClick={() => setMode('by-extra')}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.2em] transition-colors',
              mode === 'by-extra' ? 'bg-gold-400/20 text-gold-100' : 'text-neutral-500 hover:text-neutral-200',
            )}
          >
            จ่ายเพิ่ม → เวลา
          </button>
          <button
            type="button"
            onClick={() => setMode('by-time')}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.2em] transition-colors',
              mode === 'by-time' ? 'bg-gold-400/20 text-gold-100' : 'text-neutral-500 hover:text-neutral-200',
            )}
          >
            เวลา → จ่ายเพิ่ม
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {hasTierPayments && tierSummary.length > 0 ? (
          <div className="rounded-lg border border-gold-400/10 bg-ink-800/40 overflow-hidden">
            <div className="px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-neutral-500 border-b border-gold-400/10">
              ค่างวดตามสัญญา
            </div>
            <div className="divide-y divide-gold-400/5">
              {tierSummary.map((t) => (
                <div key={t.index} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-neutral-300 truncate">{t.rateLabel || `ช่วงที่ ${t.index + 1}`}</span>
                  <span className="text-neutral-500 text-[10px] tabular-nums">
                    เดือน {t.startMonth}–{t.endMonth}
                  </span>
                  <span className="text-gold-200 tabular-nums font-medium">
                    {formatTHB(t.monthlyPayment)}
                    {extraNum > 0 && (
                      <span className="text-emerald-300/80 ml-1">+ {formatTHB(extraNum)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-gold-400/10 bg-ink-800/40 px-3 py-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">ค่างวดตามสัญญา</span>
            <span className="text-sm font-semibold text-gold-200 tabular-nums">{formatTHB(scheduledMonthly)}</span>
          </div>
        )}

        {mode === 'by-extra' ? (
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-300/80 mb-1">จ่ายเพิ่ม/เดือน (บนค่างวด)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 text-sm focus:outline-none focus:border-gold-300/60 scheme-dark tabular-nums"
            />
          </label>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold-300/80">
              <Target className="w-3 h-3" />
              ต้องการผ่อนหมดใน
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] text-neutral-500 mb-1">ปี</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={targetYears}
                  onChange={(e) => setTargetYears(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 text-sm focus:outline-none focus:border-gold-300/60 scheme-dark tabular-nums"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] text-neutral-500 mb-1">เดือน (เพิ่มเติม)</span>
                <input
                  type="number"
                  min="0"
                  max="11"
                  step="1"
                  value={targetMonths}
                  onChange={(e) => setTargetMonthsInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-ink-900/70 border border-gold-400/15 text-neutral-50 text-sm focus:outline-none focus:border-gold-300/60 scheme-dark tabular-nums"
                />
              </label>
            </div>
            {requiredResult ? (
              <div className="rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold-300 mb-0.5">ต้องจ่ายเพิ่ม</div>
                  <div className="text-lg font-bold text-gold-100 tabular-nums">
                    {requiredResult.extraPerMonth === 0 ? 'ไม่ต้อง' : `${formatTHB(requiredResult.extraPerMonth)} / เดือน`}
                  </div>
                </div>
                {requiredResult.extraPerMonth === 0 && (
                  <span className="text-[10px] text-emerald-300/80 text-right max-w-32">
                    ผ่อนตามแผนเดิมก็ปิดได้ในเวลานี้
                  </span>
                )}
              </div>
            ) : targetTotalMonths > 0 ? (
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
                ระยะเวลาที่ระบุสั้นเกินไป — จำเป็นต้องจ่ายเพิ่มจำนวนมหาศาลหรือเกินกว่าระบบจะคำนวณได้
              </div>
            ) : (
              <div className="text-[11px] text-neutral-500">
                ใส่ระยะเวลาที่ต้องการ ระบบจะคำนวณจำนวนเงินที่ต้องจ่ายเพิ่มต่อเดือนให้
              </div>
            )}
          </div>
        )}

        {mode === 'by-extra' && (
          <div className="flex flex-wrap gap-1.5">
            {PRESET_EXTRAS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setExtra(String(v))}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[10px] uppercase tracking-[0.2em] border transition-colors',
                  String(v) === extra
                    ? 'border-gold-300/60 text-gold-100 bg-gold-400/10'
                    : 'border-gold-400/20 text-neutral-400 hover:border-gold-300/40 hover:text-gold-200',
                )}
              >
                +{v.toLocaleString()}
              </button>
            ))}
            {extra && (
              <button
                type="button"
                onClick={() => setExtra('')}
                className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-[0.2em] border border-neutral-700 text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                ล้าง
              </button>
            )}
          </div>
        )}

        {baseline && scenario ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-gold-400/10 bg-ink-800/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">แผนเดิม</div>
              <div className="text-base font-semibold text-neutral-100 tabular-nums">
                {formatMonthSpan(baseline.monthsToPayoff)}
              </div>
              <div className="text-[11px] text-rose-300/90 tabular-nums mt-1">
                ดอก {formatTHB(baseline.totalInterest)}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 mb-1">แผนใหม่</div>
              <div className="text-base font-semibold text-emerald-200 tabular-nums">
                {formatMonthSpan(scenario.monthsToPayoff)}
              </div>
              <div className="text-[11px] text-rose-300/90 tabular-nums mt-1">
                ดอก {formatTHB(scenario.totalInterest)}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                ปิดยอด {scenario.payoffDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="rounded-lg border border-gold-400/30 bg-gold-400/8 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold-300 mb-1">
                <TrendingDown className="w-3 h-3" />
                ประหยัด
              </div>
              <div className="text-base font-semibold text-gold-100 tabular-nums">
                เร็วขึ้น {formatMonthSpan(monthsSaved)}
              </div>
              <div className="text-[11px] text-emerald-300 tabular-nums mt-1">
                ลดดอก {formatTHB(interestSaved)}
              </div>
            </div>
          </div>
        ) : baseline && extraNum === 0 ? (
          <div className="text-[11px] text-neutral-500 pt-1">
            ใส่จำนวนเงินที่จ่ายเพิ่มต่อเดือน ระบบจะคำนวณว่าปิดยอดเร็วขึ้นกี่ปี และประหยัดดอกเบี้ยเท่าไร
          </div>
        ) : extraNum > 0 ? (
          <div className="text-[11px] text-rose-300 pt-1">
            จำนวนเงินไม่พอจ่ายดอกเบี้ยรายเดือน — กรุณาเพิ่มจำนวนเงิน
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectedPanel({
  projected,
  storedBalance,
  storedPrincipal,
  balanceGap,
  onSync,
  pending,
}: {
  projected: ProjectedSnapshot;
  storedBalance: number;
  storedPrincipal: number;
  balanceGap: number;
  onSync: () => void;
  pending: boolean;
}) {
  const inSync = Math.abs(balanceGap) < 1;
  const ahead = balanceGap < -1;
  const actualPrincipalReduced = Math.max(0, storedPrincipal - storedBalance);

  return (
    <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/4 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-emerald-400/15 bg-emerald-500/6 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-3.5 h-3.5 text-emerald-300/90" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">ความคืบหน้า ณ วันนี้</span>
        </div>
        <span className="text-[10px] text-neutral-500">ผ่าน {projected.monthsElapsed} งวด</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5">
        <MiniStat
          label="คงเหลือ (จริง)"
          value={formatTHB(storedBalance)}
          accent="text-emerald-200"
        />
        <MiniStat
          label="ลดต้นไปแล้ว (จริง)"
          value={formatTHB(actualPrincipalReduced)}
          accent="text-emerald-300"
        />
        <MiniStat
          label="ผ่อนแล้ว (ตามแผน)"
          value={formatTHB(projected.paidTotal)}
          accent="text-neutral-100"
        />
        <MiniStat
          label="ดอกเบี้ย (ตามแผน)"
          value={formatTHB(projected.paidInterest)}
          accent="text-rose-300"
        />
      </div>
      {!inSync && (
        <div className="px-3.5 pb-3.5 flex items-center justify-between gap-2 flex-wrap">
          <span className={cn('text-[11px]', ahead ? 'text-emerald-300' : 'text-amber-300')}>
            ตามแผนควรเหลือ {formatTHB(projected.expectedBalance)} ({ahead ? 'จ่ายเร็วกว่าแผน' : 'จ่ายช้ากว่าแผน'} {formatTHB(Math.abs(balanceGap))})
          </span>
          <button
            type="button"
            onClick={onSync}
            disabled={pending}
            title="เปิดฟอร์มแก้ไขโดยใส่ยอดตามแผนให้ในช่อง ‘ยอดคงเหลือปัจจุบัน’"
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-medium',
              'border border-emerald-400/40 text-emerald-200 hover:border-emerald-300/70 hover:text-white transition-colors',
              'disabled:opacity-50',
            )}
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
            ใช้ยอดตามแผน
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-gold-400/10 bg-ink-800/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">{label}</div>
      <div className={cn('font-semibold tabular-nums break-all', accent)}>{value}</div>
    </div>
  );
}

function ScheduleTable({
  rows,
  totalRows,
}: {
  rows: Array<{ index: number; payment: number; interest: number; principal: number; balance: number }>;
  totalRows: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-gold-400/10 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gold-400/10 flex items-center justify-between bg-ink-800/40">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold-300/80">ตารางผ่อนชำระ</span>
        <span className="text-[10px] text-neutral-500">
          แสดง {rows.length} / {totalRows} งวด
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-ink-800/30 text-neutral-500">
            <tr>
              <th className="text-left px-3 py-2 font-normal">งวด</th>
              <th className="text-right px-3 py-2 font-normal">ค่างวด</th>
              <th className="text-right px-3 py-2 font-normal">ดอกเบี้ย</th>
              <th className="text-right px-3 py-2 font-normal">เงินต้น</th>
              <th className="text-right px-3 py-2 font-normal">คงเหลือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-400/5">
            {rows.map((r) => (
              <tr key={r.index} className="hover:bg-ink-800/40 transition-colors">
                <td className="px-3 py-2 text-neutral-400">{r.index}</td>
                <td className="px-3 py-2 text-right text-neutral-100 tabular-nums">{formatTHB(r.payment)}</td>
                <td className="px-3 py-2 text-right text-rose-300 tabular-nums">{formatTHB(r.interest)}</td>
                <td className="px-3 py-2 text-right text-emerald-300 tabular-nums">{formatTHB(r.principal)}</td>
                <td className="px-3 py-2 text-right text-neutral-400 tabular-nums">{formatTHB(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
