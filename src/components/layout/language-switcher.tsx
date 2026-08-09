'use client';

import * as React from 'react';
import { Check, Globe, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLocaleSwitcher, useT } from '@/i18n/client';
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Переключатель языка. Компактный в шапке (иконка + RU/EN/KK),
 * развёрнутый — в мобильном меню и футере.
 */
export function LanguageSwitcher({
  variant = 'compact',
  className,
}: {
  variant?: 'compact' | 'inline';
  className?: string;
}) {
  const { locale, isSwitching, setLocale } = useLocaleSwitcher();
  const t = useT('navigation');

  if (variant === 'inline') {
    return (
      <div
        className={cn('flex flex-col gap-2', className)}
        role="group"
        aria-label={t('language.label')}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {t('language.label')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LOCALES.map((item) => (
            <LocaleChip
              key={item}
              locale={item}
              active={item === locale}
              disabled={isSwitching}
              onSelect={setLocale}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t('language.change')}: ${LOCALE_LABELS[locale]}`}
        className={cn(
          'focus-ring inline-flex h-10 min-w-[3.75rem] items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold uppercase tracking-wide',
          'text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-60',
          className,
        )}
        disabled={isSwitching}
      >
        {isSwitching ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Globe className="size-4" aria-hidden />
        )}
        <span>{LOCALE_SHORT_LABELS[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
        {LOCALES.map((item) => (
          <DropdownMenuItem
            key={item}
            onSelect={() => setLocale(item)}
            aria-current={item === locale}
            className={cn('justify-between', item === locale && 'font-semibold')}
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 shrink-0 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {LOCALE_SHORT_LABELS[item]}
              </span>
              {LOCALE_LABELS[item]}
            </span>
            {item === locale ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocaleChip({
  locale,
  active,
  disabled,
  onSelect,
}: {
  locale: Locale;
  active: boolean;
  disabled: boolean;
  onSelect: (locale: Locale) => void;
}) {
  return (
    <button
      type="button"
      lang={locale}
      onClick={() => onSelect(locale)}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 font-semibold text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide">
        {LOCALE_SHORT_LABELS[locale]}
      </span>
      {LOCALE_LABELS[locale]}
      {active ? <Check className="size-3.5" aria-hidden /> : null}
    </button>
  );
}
