type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export default function ChartCard({ title, subtitle, children, rightSlot, className }: Props) {
  return (
    <div className={`rounded-2xl border border-gold-400/15 bg-ink-900/60 p-6 ${className ?? ''}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-1">{title}</div>
          {subtitle && <div className="text-xs text-neutral-500">{subtitle}</div>}
        </div>
        {rightSlot}
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </div>
  );
}
