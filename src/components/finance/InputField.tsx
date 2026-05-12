import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const InputField = forwardRef<HTMLInputElement, Props>(function InputField(
  { label, id, className, ...rest },
  ref,
) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[11px] uppercase tracking-[0.25em] text-gold-300/80 mb-2">{label}</span>
      <input
        ref={ref}
        id={id}
        {...rest}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-ink-800/60 border border-gold-400/15 text-neutral-50 placeholder:text-neutral-600',
          'focus:outline-none focus:border-gold-300/60 focus:bg-ink-800/90 transition-colors',
          className,
        )}
      />
    </label>
  );
});

export default InputField;
