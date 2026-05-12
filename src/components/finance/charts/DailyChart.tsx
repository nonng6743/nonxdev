'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import { formatTHB, formatTHBCompact } from '@/lib/finance';

export type DailyPoint = {
  date: string; // ISO yyyy-MM-dd
  label: string; // short label e.g. "5 พ.ค."
  income: number;
  expense: number;
};

export default function DailyChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartCard title="รายรับ vs รายจ่าย — 30 วันล่าสุด" subtitle="รายวัน">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86efac" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#86efac" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fda4af" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#fda4af" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#737373', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(212,175,55,0.15)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#737373', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTHBCompact}
          />
          <Tooltip
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
          <Area
            type="monotone"
            dataKey="income"
            stroke="#86efac"
            fill="url(#incomeFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#fda4af"
            fill="url(#expenseFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
