import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  /** Компактный вариант — для встраивания в карточки. */
  compact?: boolean;
}

/**
 * Пустое состояние: всегда объясняет причину и даёт следующий шаг.
 * Без CTA пустой экран выглядит как тупик — поэтому action почти всегда задан.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 text-center',
        compact ? 'gap-2 px-5 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-soft',
            compact ? 'size-11 [&_svg]:size-5' : 'size-14 [&_svg]:size-6',
          )}
        >
          {icon}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <p className={cn('font-semibold', compact ? 'text-sm' : 'text-lg')}>{title}</p>
        {description ? (
          <p
            className={cn(
              'mx-auto text-muted-foreground',
              compact ? 'max-w-sm text-xs' : 'max-w-md text-sm',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action ? (
            action.href ? (
              <Button asChild size={compact ? 'sm' : 'default'}>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button size={compact ? 'sm' : 'default'} onClick={action.onClick}>
                {action.label}
              </Button>
            )
          ) : null}
          {secondaryAction ? (
            secondaryAction.href ? (
              <Button asChild variant="ghost" size={compact ? 'sm' : 'default'}>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size={compact ? 'sm' : 'default'}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
