'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { formatTHB, CATEGORY_LABELS_TH } from '@/lib/finance';

export type ForecastPoint = {
  source: 'debt' | 'category';
  key: string;
  label: string;
  value: number;
};

const CATEGORY_COLORS = [
  '#f6d97a',
  '#fbeec0',
  '#b8902b',
  '#f0c14b',
  '#8c6a1f',
  '#fda4af',
  '#86efac',
  '#93c5fd',
  '#c4b5fd',
  '#fde68a',
];
const DEBT_COLOR = '#d4af37';

function resolveLabel(point: ForecastPoint, categoryNames?: Record<string, string>) {
  if (point.source === 'debt') return point.label;
  return categoryNames?.[point.key] ?? CATEGORY_LABELS_TH[point.key] ?? point.label;
}

type Props = {
  data: ForecastPoint[];
  categoryNames?: Record<string, string>;
  sampleMonths: number;
};

export default function ExpenseForecastChart({ data, categoryNames, sampleMonths }: Props) {
  const filtered = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="ค่าใช้จ่ายรวมเดือนถัดไป"
      subtitle={
        filtered.length > 0
          ? `คาดประมาณ ${formatTHB(total)} · ภาระผ่อน + ค่าใช้จ่ายเฉลี่ย ${sampleMonths} เดือนล่าสุด`
          : 'ยังไม่มีข้อมูลพอสำหรับคำนวณ'
      }
    >
      {filtered.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-neutral-500 text-center px-4">
          เพิ่มรายจ่ายและหนี้สินเพื่อให้ระบบประมาณการค่าใช้จ่ายเดือนหน้า
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 h-full">
          <div className="relative h-40 sm:h-full w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {filtered.map((d, i) => (
                    <Cell
                      key={d.key}
                      fill={d.source === 'debt' ? DEBT_COLOR : CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    />
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
                  formatter={(value, _n, item) => {
                    const v = Number(value ?? 0);
                    const point = item.payload as ForecastPoint;
                    const pct = total ? ((v / total) * 100).toFixed(0) : '0';
                    const prefix = point.source === 'debt' ? '🏠 ' : '';
                    return [`${formatTHB(v)} (${pct}%)`, `${prefix}${resolveLabel(point, categoryNames)}`];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500">รวมประมาณ</span>
              <span className="text-sm sm:text-base font-bold text-rose-200 tabular-nums">{formatTHB(total)}</span>
            </div>
          </div>

          <ul className="flex-1 space-y-2 max-h-40 sm:max-h-full overflow-y-auto pr-1 text-sm">
            {filtered.map((d, i) => {
              const pct = total ? (d.value / total) * 100 : 0;
              const color = d.source === 'debt' ? DEBT_COLOR : CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <li key={d.key} className="flex items-center gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-neutral-200 flex-1 min-w-0 truncate">
                    {resolveLabel(d, categoryNames)}
                    {d.source === 'debt' && (
                      <span className="text-gold-300/70 text-[10px] ml-1">· หนี้สิน</span>
                    )}
                  </span>
                  <span className="text-neutral-100 tabular-nums text-xs whitespace-nowrap">{formatTHB(d.value)}</span>
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
