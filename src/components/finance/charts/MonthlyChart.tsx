'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import { formatTHB, formatTHBCompact } from '@/lib/finance';

export type MonthlyPoint = { label: string; income: number; expense: number };

export default function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ChartCard title="สรุปรายเดือน" subtitle="6 เดือนล่าสุด">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#737373', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(212,175,55,0.15)' }}
          />
          <YAxis
            tick={{ fill: '#737373', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTHBCompact}
          />
          <Tooltip
            cursor={{ fill: 'rgba(212,175,55,0.05)' }}
            contentStyle={{
              background: '#0a0907',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 12,
              color: '#fafafa',
              fontSize: 12,
            }}
            labelStyle={{ color: '#d4af37', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}
            formatter={(value, name) => [formatTHB(Number(value ?? 0)), name === 'income' ? 'รายรับ' : 'รายจ่าย']}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#a3a3a3', paddingTop: 8 }}
            formatter={(value) => (value === 'income' ? 'รายรับ' : 'รายจ่าย')}
          />
          <Bar dataKey="income" fill="#86efac" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill="#fda4af" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
