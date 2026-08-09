'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import type { WorkingHours } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { getOpenStatus } from '@/lib/hours';
import { getOpenStatusLabel } from '@/lib/open-status-label';

/**
 * Статус работы считается на клиенте: серверное «сейчас» может не совпасть
 * с временем гостя, а расхождение вызвало бы ошибку гидратации.
 */
export function VenueOpenStatus({
  workingHours,
  className,
}: {
  workingHours: WorkingHours;
  className?: string;
}) {
  const t = useT('venue');
  const [status, setStatus] = React.useState<ReturnType<typeof getOpenStatus> | null>(null);

  React.useEffect(() => {
    setStatus(getOpenStatus(workingHours));
    const timer = setInterval(() => setStatus(getOpenStatus(workingHours)), 60_000);
    return () => clearInterval(timer);
  }, [workingHours]);

  if (!status) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-muted-foreground', className)}>
        <Clock className="size-4 shrink-0" />
        {t('status.hours')}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        status.isOpen
          ? status.closingSoon
            ? 'text-warning'
            : 'text-success'
          : 'text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          status.isOpen
            ? status.closingSoon
              ? 'bg-warning'
              : 'bg-success'
            : 'bg-muted-foreground/50',
        )}
      />
      {getOpenStatusLabel(status, t)}
    </span>
  );
}
