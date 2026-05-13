export type DebtKind = 'house' | 'car' | 'credit_card' | 'personal' | 'other';
export type InterestMethod = 'amortized' | 'flat';
export type DebtStatus = 'active' | 'paid';
export type InterestConvention = 'monthly' | 'daily365' | 'daily360';

export const INTEREST_CONVENTIONS: InterestConvention[] = ['monthly', 'daily365', 'daily360'];

export const INTEREST_CONVENTION_LABELS_TH: Record<InterestConvention, string> = {
  monthly: 'รายเดือน (เร็ว)',
  daily365: 'รายวัน 365 (เหมือนธนาคาร)',
  daily360: 'รายวัน 360 (Banker)',
};

export const DEBT_KINDS: DebtKind[] = ['house', 'car', 'credit_card', 'personal', 'other'];

export const DEBT_KIND_LABELS_TH: Record<DebtKind, string> = {
  house: 'บ้าน',
  car: 'รถยนต์',
  credit_card: 'บัตรเครดิต',
  personal: 'สินเชื่อส่วนบุคคล',
  other: 'อื่นๆ',
};

export const INTEREST_METHOD_LABELS_TH: Record<InterestMethod, string> = {
  amortized: 'ลดต้นลดดอก',
  flat: 'อัตราคงที่ (Flat)',
};

export type ScheduleRow = {
  index: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  tierIndex?: number;
};

export type LoanSummary = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  payoffDate: Date | null;
  schedule: ScheduleRow[];
};

export type InterestTier = {
  months: number;
  ratePercent: number;
  rateLabel?: string | null;
  rateFormula?: string | null;
  monthlyPayment?: number | null;
};

export type BenchmarkRate = {
  key: string;
  value: number;
};

/**
 * Reference rates from major Thai commercial banks (average, Q1 2026).
 * Used to prefill BenchmarkPanel when the user has nothing saved yet —
 * user is expected to verify against their actual bank's published rate.
 */
export const DEFAULT_BENCHMARKS: Record<string, number> = {
  MRR: 7.08,
  MLR: 6.85,
  MOR: 7.20,
};

export const DEFAULT_BENCHMARKS_AS_OF = '2026-01';

/**
 * Normalize a user-typed rate string into a canonical ASCII form. Handles
 * common copy-paste / autocorrect quirks so the parser doesn't reject input
 * that looks correct to the user.
 *
 * Why: en/em dashes, minus sign, full-width plus, NBSP, percent signs, and
 * thousands separators routinely sneak in from mobile keyboards or pastes
 * from bank statements. Without this, "MRR–2" (en-dash) or "1.80%" silently
 * fail parsing and the tier gets dropped on save.
 */
function normalizeRateString(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[\uFF0B\uFE62]/g, '+')
    .replace(/[\u00A0\u2000-\u200D\u202F\u205F\u2060\uFEFF]/g, '')
    .replace(/%+$/g, '')
    .replace(/,/g, '')
    .trim();
}

/**
 * Resolve a benchmark-relative formula like "MRR-2", "MLR+0.5", or "MRR"
 * against the user's stored benchmark rates. Returns null if the formula
 * is malformed or the referenced benchmark is missing.
 *
 * Why: Thai mortgages quote floating rates as "MRR-2%" — storing the
 * formula instead of a fixed % means a single MRR update propagates to
 * every tier that references it.
 */
export function resolveRateFormula(formula: string, benchmarks: BenchmarkRate[]): number | null {
  const normalized = normalizeRateString(formula).toUpperCase().replace(/\s+/g, '');
  const m = normalized.match(/^([A-Z]+)([+\-]\d+(?:\.\d+)?)?$/);
  if (!m) return null;
  const key = m[1];
  const adjust = m[2] ? Number(m[2]) : 0;
  const bench = benchmarks.find((b) => b.key.toUpperCase() === key);
  if (!bench) return null;
  const result = bench.value + adjust;
  if (result < 0 || result > 100) return null;
  return result;
}

/**
 * Parse a money/amount string into a number, tolerating thousands separators,
 * trailing currency symbols, and various Unicode whitespace.
 *
 * Why: users routinely paste values like "3,636,171.20" or "฿3,636,171.20"
 * from bank statements. The default `Number()` returns NaN for those,
 * JSON.stringify turns NaN into null, and zod's coerce on null becomes 0 —
 * silently zeroing out the saved balance.
 */
export function parseAmount(input: string | number | null | undefined): number {
  if (input == null) return NaN;
  if (typeof input === 'number') return input;
  const normalized = input
    .normalize('NFKC')
    .replace(/[\u00A0\u2000-\u200D\u202F\u205F\u2060\uFEFF\s]/g, '')
    .replace(/[฿$€£¥]/g, '')
    .replace(/,/g, '')
    .trim();
  if (!normalized) return NaN;
  const n = Number(normalized);
  return n;
}

/**
 * Parse a user-entered rate input that may be either a plain number ("5.08",
 * "1.80%") or a benchmark formula ("MRR-2", "MRR-2%"). Returns the resolved
 * effective rate plus the canonical formula string for storage, or null if
 * the input is invalid.
 */
export function parseRateInput(
  input: string,
  benchmarks: BenchmarkRate[],
): { ratePercent: number; rateFormula: string | null } | null {
  const normalized = normalizeRateString(input);
  if (!normalized) return null;
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const num = Number(normalized);
    if (isNaN(num) || num < 0 || num > 100) return null;
    return { ratePercent: num, rateFormula: null };
  }
  const resolved = resolveRateFormula(normalized, benchmarks);
  if (resolved == null) return null;
  return { ratePercent: resolved, rateFormula: normalized.toUpperCase().replace(/\s+/g, '') };
}

/**
 * Apply current benchmark values to each tier's stored formula, overriding
 * the cached ratePercent. Used at read time so MRR/MLR updates propagate
 * without needing to migrate stored debts.
 */
export function resolveDebtTiers(tiers: InterestTier[], benchmarks: BenchmarkRate[]): InterestTier[] {
  return tiers.map((t) => {
    if (!t.rateFormula) return t;
    const r = resolveRateFormula(t.rateFormula, benchmarks);
    return r != null ? { ...t, ratePercent: r } : t;
  });
}

export type TierSummaryRow = {
  index: number;
  startMonth: number;
  endMonth: number;
  ratePercent: number;
  rateLabel: string | null;
  monthlyPayment: number;
};

/**
 * Annual % → monthly rate as a fraction (e.g. 6 → 0.005)
 */
function monthlyRate(annualPercent: number) {
  return annualPercent / 100 / 12;
}

/**
 * Add N months to a date, clamping the day to the last day of the target
 * month if the source day doesn't exist there (e.g., Jan 31 + 1m → Feb 28).
 */
export function addMonthsClamped(d: Date, months: number): Date {
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + months;
  const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d.getDate(), lastDayOfTarget);
  const out = new Date(targetYear, targetMonth, day);
  out.setHours(0, 0, 0, 0);
  return out;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Rate applied for a single amortization period, honoring the chosen
 * interest convention. For 'monthly', returns the simple annual/12 rate
 * (independent of calendar). For 'daily365'/'daily360', returns
 * annual × days_between_payments / basis — matches the way banks bill.
 */
export function periodInterestRate(
  annualPercent: number,
  convention: InterestConvention,
  startDate: Date,
  periodIndex: number,
): number {
  if (convention === 'monthly') return annualPercent / 100 / 12;
  const prev = periodIndex <= 1 ? startDate : addMonthsClamped(startDate, periodIndex - 1);
  const next = addMonthsClamped(startDate, periodIndex);
  const days = daysBetween(prev, next);
  const basis = convention === 'daily360' ? 360 : 365;
  return ((annualPercent / 100) * days) / basis;
}

export function amortizedMonthlyPayment(principal: number, annualPercent: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = monthlyRate(annualPercent);
  if (r === 0) return principal / termMonths;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

export function flatMonthlyPayment(principal: number, annualPercent: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) return 0;
  const years = termMonths / 12;
  const totalInterest = principal * (annualPercent / 100) * years;
  return (principal + totalInterest) / termMonths;
}

/**
 * Compute the full amortization schedule (or flat-rate schedule).
 *
 * Why: front-end shows payoff date and monthly breakdown; backend uses it
 * to attribute a recorded payment to principal vs interest.
 */
export function buildSchedule(params: {
  principal: number;
  annualPercent: number;
  termMonths: number;
  method: InterestMethod;
  startDate?: Date;
  tiers?: InterestTier[] | null;
  convention?: InterestConvention;
}): LoanSummary {
  const { principal, annualPercent, termMonths, method, tiers } = params;
  const convention: InterestConvention = params.convention ?? 'monthly';

  if (principal <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, payoffDate: null, schedule: [] };
  }

  if (tiers && tiers.length > 0) {
    return buildTieredSchedule({
      principal,
      termMonths,
      tiers,
      startDate: params.startDate,
      convention,
    });
  }

  const start = params.startDate ? new Date(params.startDate) : new Date();
  const schedule: ScheduleRow[] = [];

  let balance = principal;
  let totalInterest = 0;
  let totalPayment = 0;

  if (method === 'amortized') {
    const monthly = amortizedMonthlyPayment(principal, annualPercent, termMonths);
    for (let i = 1; i <= termMonths; i++) {
      const r = periodInterestRate(annualPercent, convention, start, i);
      const interest = balance * r;
      let principalPortion = monthly - interest;
      if (i === termMonths || balance - principalPortion < 0.01) {
        principalPortion = balance;
      }
      const payment = interest + principalPortion;
      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      totalPayment += payment;
      schedule.push({ index: i, payment, interest, principal: principalPortion, balance });
      if (balance <= 0) break;
    }
  } else {
    const monthly = flatMonthlyPayment(principal, annualPercent, termMonths);
    const principalPerMonth = principal / termMonths;
    const interestPerMonth = monthly - principalPerMonth;
    for (let i = 1; i <= termMonths; i++) {
      balance = Math.max(0, balance - principalPerMonth);
      totalInterest += interestPerMonth;
      totalPayment += monthly;
      schedule.push({
        index: i,
        payment: monthly,
        interest: interestPerMonth,
        principal: principalPerMonth,
        balance,
      });
    }
  }

  const payoffDate = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + termMonths);

  const monthlyPayment = schedule[0]?.payment ?? 0;
  return { monthlyPayment, totalPayment, totalInterest, payoffDate, schedule };
}

/**
 * Tiered amortization: each tier covers a fixed number of months at its own
 * rate (and optional explicit monthly payment). Used for Thai mortgages with
 * promotional step-up rates (ปีแรก/ปีที่ 2/MRR-x%).
 *
 * Why: bank quotes the monthly payment for each tier rather than letting it
 * be derived from re-amortization, so we honor the explicit value when given.
 * Last tier auto-extends to fill termMonths if tier total is shorter.
 */
export function buildTieredSchedule(params: {
  principal: number;
  termMonths: number;
  tiers: InterestTier[];
  startDate?: Date;
  convention?: InterestConvention;
}): LoanSummary {
  const { principal, termMonths, tiers } = params;
  const convention: InterestConvention = params.convention ?? 'monthly';
  if (principal <= 0 || termMonths <= 0 || tiers.length === 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, payoffDate: null, schedule: [] };
  }

  const start = params.startDate ? new Date(params.startDate) : new Date();
  const schedule: ScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPayment = 0;
  let monthCounter = 0;

  const expanded = tiers.map((t, i) => ({
    ...t,
    months: i === tiers.length - 1 ? Math.max(0, termMonths - tiers.slice(0, i).reduce((s, x) => s + x.months, 0)) : t.months,
  }));

  for (let tIdx = 0; tIdx < expanded.length; tIdx++) {
    const tier = expanded[tIdx];
    const rMonthly = monthlyRate(tier.ratePercent);
    const remainingMonths = termMonths - monthCounter;
    const tierMonths = Math.min(tier.months, remainingMonths);
    if (tierMonths <= 0) break;

    const computedAmortized = (() => {
      if (rMonthly === 0) return balance / remainingMonths;
      const f = Math.pow(1 + rMonthly, remainingMonths);
      return (balance * rMonthly * f) / (f - 1);
    })();
    const tierPayment = tier.monthlyPayment && tier.monthlyPayment > 0 ? tier.monthlyPayment : computedAmortized;

    for (let m = 0; m < tierMonths; m++) {
      monthCounter += 1;
      const r = periodInterestRate(tier.ratePercent, convention, start, monthCounter);
      const interest = balance * r;
      let principalPortion = tierPayment - interest;
      let payment = tierPayment;
      if (monthCounter === termMonths || balance - principalPortion < 0.01) {
        principalPortion = balance;
        payment = interest + principalPortion;
      }
      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      totalPayment += payment;
      schedule.push({
        index: monthCounter,
        payment,
        interest,
        principal: principalPortion,
        balance,
        tierIndex: tIdx,
      });
      if (balance <= 0) break;
    }
    if (balance <= 0) break;
  }

  const payoffDate = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + monthCounter);

  return {
    monthlyPayment: schedule[0]?.payment ?? 0,
    totalPayment,
    totalInterest,
    payoffDate,
    schedule,
  };
}

/**
 * Per-tier summary (tier index, month range, effective monthly payment).
 * Used to render the "ผ่อนตามช่วงปี" table.
 */
export function summarizeTiers(params: {
  principal: number;
  termMonths: number;
  tiers: InterestTier[];
  startDate?: Date;
  convention?: InterestConvention;
}): TierSummaryRow[] {
  const summary = buildTieredSchedule({ ...params });
  const rows: TierSummaryRow[] = [];
  const byTier = new Map<number, ScheduleRow[]>();
  for (const r of summary.schedule) {
    const k = r.tierIndex ?? 0;
    if (!byTier.has(k)) byTier.set(k, []);
    byTier.get(k)!.push(r);
  }
  for (let i = 0; i < params.tiers.length; i++) {
    const rows_ = byTier.get(i);
    if (!rows_ || rows_.length === 0) continue;
    const first = rows_[0];
    const last = rows_[rows_.length - 1];
    rows.push({
      index: i,
      startMonth: first.index,
      endMonth: last.index,
      ratePercent: params.tiers[i].ratePercent,
      rateLabel: params.tiers[i].rateLabel ?? null,
      monthlyPayment: first.payment,
    });
  }
  return rows;
}

/**
 * Inverse of simulatePayoff: given a target number of months to fully repay,
 * binary-search the minimum extraPerMonth (on top of the tier or fixed
 * payment) that closes the loan within that horizon.
 *
 * Why: lets the user ask "I want this paid off in 15 years — how much extra
 * do I need to pay each month?" — the dual of the "+X/mo → Y years" view.
 */
export function requiredExtraToPayoff(params: {
  balance: number;
  annualPercent: number;
  monthlyPayment: number;
  useTierPayments?: boolean;
  startMonth?: number;
  tiers?: InterestTier[] | null;
  startDate?: Date;
  originalStartDate?: Date;
  convention?: InterestConvention;
  targetMonths: number;
}): { extraPerMonth: number; scenario: PayoffScenario } | null {
  const { targetMonths } = params;
  if (targetMonths <= 0 || params.balance <= 0) return null;

  const noExtra = simulatePayoff({ ...params, extraPerMonth: 0, maxMonths: 1200 });
  if (!noExtra) return null;
  if (noExtra.monthsToPayoff <= targetMonths) {
    return { extraPerMonth: 0, scenario: noExtra };
  }

  let lo = 0;
  let hi = Math.max(params.balance, params.monthlyPayment * 10);

  const hiCheck = simulatePayoff({ ...params, extraPerMonth: hi, maxMonths: 1200 });
  if (!hiCheck || hiCheck.monthsToPayoff > targetMonths) {
    return null;
  }

  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    const result = simulatePayoff({ ...params, extraPerMonth: mid, maxMonths: 1200 });
    if (!result || result.monthsToPayoff > targetMonths) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.5) break;
  }

  const extra = Math.ceil(hi);
  const final = simulatePayoff({ ...params, extraPerMonth: extra, maxMonths: 1200 });
  if (!final || final.monthsToPayoff > targetMonths) return null;
  return { extraPerMonth: extra, scenario: final };
}

/**
 * Whole months elapsed from `from` to `to`, ignoring partial months.
 *
 * Why: amortization schedules are monthly — partial months don't reduce
 * principal until the next payment.
 */
export function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  let total = years * 12 + months;
  if (to.getDate() < from.getDate()) total -= 1;
  return Math.max(0, total);
}

export type ProjectedSnapshot = {
  monthsElapsed: number;
  expectedBalance: number;
  paidTotal: number;
  paidPrincipal: number;
  paidInterest: number;
};

/**
 * Roll the amortization schedule forward by the number of months elapsed
 * between startDate and asOf, returning the balance the user *should* have
 * if they followed the schedule exactly.
 *
 * Why: stored `balance` only updates when a payment is recorded. Most users
 * just pay their bank directly — this lets them see "based on what I set up,
 * what should I owe today?" without manually entering every payment.
 */
export function projectedBalanceAt(params: {
  principal: number;
  annualPercent: number;
  termMonths: number;
  method: InterestMethod;
  startDate: Date;
  tiers?: InterestTier[] | null;
  convention?: InterestConvention;
  asOf?: Date;
}): ProjectedSnapshot {
  const asOf = params.asOf ?? new Date();
  const monthsElapsed = monthsBetween(params.startDate, asOf);
  if (monthsElapsed <= 0 || params.principal <= 0) {
    return {
      monthsElapsed: 0,
      expectedBalance: params.principal,
      paidTotal: 0,
      paidPrincipal: 0,
      paidInterest: 0,
    };
  }

  const { schedule } = buildSchedule({
    principal: params.principal,
    annualPercent: params.annualPercent,
    termMonths: params.termMonths,
    method: params.method,
    tiers: params.tiers,
    startDate: params.startDate,
    convention: params.convention,
  });

  const cap = Math.min(monthsElapsed, schedule.length);
  let paidTotal = 0;
  let paidPrincipal = 0;
  let paidInterest = 0;
  let expectedBalance = params.principal;
  for (let i = 0; i < cap; i++) {
    const row = schedule[i];
    paidTotal += row.payment;
    paidPrincipal += row.principal;
    paidInterest += row.interest;
    expectedBalance = row.balance;
  }
  return { monthsElapsed: cap, expectedBalance, paidTotal, paidPrincipal, paidInterest };
}

export type PayoffScenario = {
  monthsToPayoff: number;
  totalInterest: number;
  totalPayment: number;
  payoffDate: Date;
};

/**
 * Simulate paying off a debt forward from the current balance with a chosen
 * monthly payment. Honors the tier schedule (each absolute month uses the
 * rate of the tier covering it; beyond all tiers, uses the last tier's
 * rate). Returns null if the payment cannot cover monthly interest.
 *
 * Why: lets the user model "if I pay 18,000 instead of 13,500, how soon
 * do I close the loan and how much interest do I save?"
 */
export function simulatePayoff(params: {
  balance: number;
  annualPercent: number;
  monthlyPayment: number;
  extraPerMonth?: number;
  useTierPayments?: boolean;
  startMonth?: number;
  tiers?: InterestTier[] | null;
  startDate?: Date;
  originalStartDate?: Date;
  convention?: InterestConvention;
  maxMonths?: number;
}): PayoffScenario | null {
  const defaultPayment = params.monthlyPayment;
  const extraPerMonth = params.extraPerMonth ?? 0;
  const useTierPayments = params.useTierPayments ?? false;
  const maxMonths = params.maxMonths ?? 600;
  const startMonth = params.startMonth ?? 0;
  const convention: InterestConvention = params.convention ?? 'monthly';
  const originalStart = params.originalStartDate ?? params.startDate ?? new Date();
  if (params.balance <= 0 || defaultPayment <= 0) return null;

  const tiers = params.tiers && params.tiers.length > 0 ? params.tiers : null;
  const tierCumulative: number[] = [];
  if (tiers) {
    let c = 0;
    for (const t of tiers) {
      c += t.months;
      tierCumulative.push(c);
    }
  }

  function rateAt(absoluteMonth: number): number {
    if (!tiers) return params.annualPercent;
    for (let i = 0; i < tiers.length; i++) {
      if (absoluteMonth < tierCumulative[i]) return tiers[i].ratePercent;
    }
    return tiers[tiers.length - 1].ratePercent;
  }

  function basePaymentAt(absoluteMonth: number): number {
    if (!useTierPayments || !tiers) return defaultPayment;
    for (let i = 0; i < tiers.length; i++) {
      if (absoluteMonth < tierCumulative[i]) {
        const tp = tiers[i].monthlyPayment;
        return tp != null && tp > 0 ? tp : defaultPayment;
      }
    }
    const last = tiers[tiers.length - 1];
    return last.monthlyPayment != null && last.monthlyPayment > 0 ? last.monthlyPayment : defaultPayment;
  }

  let balance = params.balance;
  let totalInterest = 0;
  let totalPayment = 0;
  let months = 0;

  while (balance > 0.01 && months < maxMonths) {
    const absMonth = startMonth + months + 1;
    const rPercent = rateAt(absMonth - 1);
    const r = periodInterestRate(rPercent, convention, originalStart, absMonth);
    const base = basePaymentAt(absMonth - 1);
    const monthlyPayment = base + extraPerMonth;
    const interest = balance * r;
    if (monthlyPayment <= interest + 0.0001) return null;
    let principalPortion = monthlyPayment - interest;
    let payment = monthlyPayment;
    if (balance - principalPortion < 0.01) {
      principalPortion = balance;
      payment = interest + principalPortion;
    }
    balance = Math.max(0, balance - principalPortion);
    totalInterest += interest;
    totalPayment += payment;
    months += 1;
  }
  if (balance > 0.01) return null;

  const payoffDate = new Date(params.startDate ?? new Date());
  payoffDate.setMonth(payoffDate.getMonth() + months);
  return { monthsToPayoff: months, totalInterest, totalPayment, payoffDate };
}

/**
 * Split a single payment into interest vs principal portions given the
 * current outstanding balance. Used when a user records a real payment.
 *
 * Why: matches how real lenders apply payments — interest is computed on
 * the outstanding balance at the moment of payment, the rest reduces
 * principal. Extra payments accelerate payoff.
 */
export function splitPayment(params: {
  balance: number;
  annualPercent: number;
  amount: number;
  method: InterestMethod;
  principal?: number;
  termMonths?: number;
}): { interest: number; principal: number; newBalance: number } {
  const { balance, annualPercent, amount, method } = params;
  if (amount <= 0 || balance <= 0) {
    return { interest: 0, principal: 0, newBalance: balance };
  }

  let interest: number;
  if (method === 'amortized') {
    interest = balance * monthlyRate(annualPercent);
  } else {
    const p = params.principal ?? balance;
    const n = params.termMonths ?? 1;
    const years = n / 12;
    interest = years > 0 ? (p * (annualPercent / 100) * years) / n : 0;
  }
  interest = Math.min(interest, amount);
  const principal = amount - interest;
  const newBalance = Math.max(0, balance - principal);
  return { interest, principal, newBalance };
}
