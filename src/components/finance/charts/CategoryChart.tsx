'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { formatTHB, CATEGORY_LABELS_TH } from '@/lib/finance';

export type CategoryPoint = { category: string; value: number };

const COLORS = [
  '#d4af37',
  '#f6d97a',
  '#fbeec0',
  '#b8902b',
  '#f0c14b',
  '#8c6a1f',
  '#fda4af',
  '#86efac',
];

type Props = {
  data: CategoryPoint[];
  categoryNames?: Record<string, string>;
};

function resolveName(slug: string, names?: Record<string, string>) {
  return names?.[slug] ?? CATEGORY_LABELS_TH[slug] ?? slug;
}

export default function CategoryChart({ data, categoryNames }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title="รายจ่ายตามหมวด" subtitle="เดือนนี้">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-neutral-500">
          ยังไม่มีรายจ่ายเดือนนี้
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 h-full">
          <div className="h-40 sm:h-full w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                    return [
                      `${formatTHB(v)} (${total ? ((v / total) * 100).toFixed(0) : 0}%)`,
                      resolveName((item.payload as CategoryPoint).category, categoryNames),
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex-1 space-y-2 max-h-40 sm:max-h-full overflow-y-auto pr-1 text-sm">
            {data.map((d, i) => {
              const pct = total ? (d.value / total) * 100 : 0;
              return (
                <li key={d.category} className="flex items-center gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-neutral-200 flex-1 truncate">
                    {resolveName(d.category, categoryNames)}
                  </span>
                  <span className="text-neutral-500 tabular-nums text-xs">{pct.toFixed(0)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
