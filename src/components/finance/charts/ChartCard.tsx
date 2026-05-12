type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export default function ChartCard({ title, subtitle, children, rightSlot, className }: Props) {
  return (
    <div className={`rounded-2xl border border-gold-400/15 bg-ink-900/60 p-4 sm:p-6 ${className ?? ''}`}>
      <div className="flex items-start justify-between mb-4 sm:mb-5 gap-2">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold-300/80 mb-1">{title}</div>
          {subtitle && <div className="text-xs text-neutral-500">{subtitle}</div>}
        </div>
        {rightSlot}
      </div>
      <div className="h-[280px] sm:h-[260px] w-full">{children}</div>
    </div>
  );
}
