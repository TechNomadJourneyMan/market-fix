import { cn } from '@/lib/utils';

/** Логотип платформы. Знак — «пин на карте», собранный из двух форм. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="size-[18px] text-white" fill="none" aria-hidden>
          <path
            d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" fill="currentColor" />
        </svg>
      </span>
      {!compact ? (
        <span className="text-[17px] font-semibold tracking-tight">
          Мезгіл
          <span className="text-primary">.</span>
        </span>
      ) : null}
    </span>
  );
}
