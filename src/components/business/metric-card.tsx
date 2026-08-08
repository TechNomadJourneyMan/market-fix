import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDelta } from '@/lib/format';

interface MetricCardProps {
  label: string;
  value: string;
  /** Изменение в процентах к прошлому периоду. */
  delta?: number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Для метрик, где падение — это хорошо (например, отмены). */
  invertDelta?: boolean;
}

export function MetricCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  invertDelta,
}: MetricCardProps) {
  const isPositive = delta === undefined ? null : invertDelta ? delta < 0 : delta > 0;

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-success' : 'text-destructive',
            )}
          >
            {delta > 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {formatDelta(delta)}
          </span>
        ) : null}
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
