'use client';

import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { formatTHB } from '@/lib/finance';
import { DEBT_KIND_LABELS_TH, type DebtKind } from '@/lib/debt';

export type DebtMonthlyPoint = {
  id: string;
  name: string;
  kind: DebtKind;
  monthlyPayment: number;
};

const KIND_COLORS: Record<DebtKind, string> = {
  house: '#d4af37',
  car: '#86efac',
  credit_card: '#fda4af',
  personal: '#f0c14b',
  other: '#a3a3a3',
};

export default function DebtMonthlyChart({ data }: { data: DebtMonthlyPoint[] }) {
  const total = data.reduce((s, d) => s + d.monthlyPayment, 0);
  const sorted = [...data].sort((a, b) => b.monthlyPayment - a.monthlyPayment);
  const rightSlot = (
    <Link
      href="/finance/debts"
      className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-gold-200 transition-colors whitespace-nowrap"
    >
      จัดการ →
    </Link>
  );

  return (
    <ChartCard
      title="ภาระผ่อนต่อเดือน"
      subtitle={data.length > 0 ? `รวม ${formatTHB(total)} จาก ${data.length} รายการ` : 'ค่าใช้จ่ายคงที่จากหนี้สิน'}
      rightSlot={rightSlot}
    >
      {data.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-sm text-neutral-500 gap-2">
          <span>ยังไม่มีหนี้สินที่กำลังผ่อน</span>
          <Link
            href="/finance/debts"
            className="text-[11px] uppercase tracking-[0.25em] text-gold-200 hover:text-white border border-gold-400/30 hover:border-gold-300/60 rounded-full px-3 py-1.5 transition-colors"
          >
            เพิ่มหนี้สิน
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 h-full">
          <div className="relative h-40 sm:h-full w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="monthlyPayment"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {sorted.map((d) => (
                    <Cell key={d.id} fill={KIND_COLORS[d.kind] ?? KIND_COLORS.other} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0a0907',
                    border: '1px solid rgba(212,175,55,0.25)',
                    borderRadius: 12,
                    color: '#fafafa',
                    fontSize: 12,
                  }}
                  formatter={(value, _name, item) => {
                    const v = Number(value ?? 0);
                    const point = item.payload as DebtMonthlyPoint;
                    const pct = total ? ((v / total) * 100).toFixed(0) : '0';
                    return [
                      `${formatTHB(v)} (${pct}%)`,
                      `${point.name} · ${DEBT_KIND_LABELS_TH[point.kind] ?? '-'}`,
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500">รวม</span>
              <span className="text-sm sm:text-base font-bold text-gold-200 tabular-nums">{formatTHB(total)}</span>
            </div>
          </div>

          <ul className="flex-1 space-y-2 max-h-40 sm:max-h-full overflow-y-auto pr-1 text-sm">
            {sorted.map((d) => {
              const pct = total ? (d.monthlyPayment / total) * 100 : 0;
              return (
                <li key={d.id} className="flex items-center gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: KIND_COLORS[d.kind] ?? KIND_COLORS.other }}
                  />
                  <span className="text-neutral-200 flex-1 min-w-0 truncate">
                    {d.name}
                    <span className="text-neutral-500 text-[10px] ml-1">· {DEBT_KIND_LABELS_TH[d.kind]}</span>
                  </span>
                  <span className="text-gold-200 tabular-nums text-xs whitespace-nowrap">{formatTHB(d.monthlyPayment)}</span>
                  <span className="text-neutral-500 tabular-nums text-[10px] w-9 text-right">{pct.toFixed(0)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
