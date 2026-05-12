import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function AuthCard({ title, subtitle, children, footer, className }: Props) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-24 sm:py-32 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_60%)]" />

      <div className={cn(
        'relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-gold-400/20 bg-ink-900/70 backdrop-blur p-6 sm:p-8 md:p-10',
        'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]',
        className,
      )}>
        {/* Gold corner accents */}
        <span className="pointer-events-none absolute top-0 left-0 w-12 h-px bg-linear-to-r from-gold-400/70 to-transparent" />
        <span className="pointer-events-none absolute top-0 left-0 w-px h-12 bg-linear-to-b from-gold-400/70 to-transparent" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-12 h-px bg-linear-to-l from-gold-400/70 to-transparent" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-px h-12 bg-linear-to-t from-gold-400/70 to-transparent" />

        <Link href="/" className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold-300/80 hover:text-gold-200 transition-colors">
          <Wallet className="w-4 h-4" />
          nonxdev · Finance
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gold-gradient-text mb-2 sm:mb-3">{title}</h1>
        <p className="text-sm sm:text-base text-neutral-400 mb-6 sm:mb-8">{subtitle}</p>

        {children}

        {footer && <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gold-400/10 text-sm text-neutral-400">{footer}</div>}
      </div>
    </div>
  );
}
