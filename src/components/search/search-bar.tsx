'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search, X } from 'lucide-react';
import type { SearchSuggestion } from '@/types';
import { apiClient, queryKeys } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useDebounce, useDismiss } from '@/hooks/use-debounce';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { VoiceInputButton } from '@/components/ui/voice-input';

interface SearchBarProps {
  /** hero — крупная строка на главной, compact — в шапке. */
  variant?: 'hero' | 'compact';
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

const KIND_LABELS: Record<SearchSuggestion['kind'], string> = {
  venue: 'Заведение',
  category: 'Категория',
  cuisine: 'Кухня',
  district: 'Район',
  query: 'Поиск',
};

export function SearchBar({
  variant = 'hero',
  defaultValue = '',
  placeholder = 'Ресторан, кухня, район или повод…',
  className,
  autoFocus,
  onSubmitted,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(value, 220);
  useDismiss(containerRef, () => setIsOpen(false), isOpen);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: queryKeys.suggestions(debouncedValue),
    queryFn: () =>
      apiClient.get<SearchSuggestion[]>(
        `/api/search/suggestions?q=${encodeURIComponent(debouncedValue)}`,
      ),
    enabled: isOpen,
  });

  const go = React.useCallback(
    (href: string) => {
      setIsOpen(false);
      onSubmitted?.();
      router.push(href);
    },
    [router, onSubmitted],
  );

  const submit = () => {
    const trimmed = value.trim();
    go(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = suggestions[activeIndex];
      if (active) go(active.href);
      else submit();
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-background transition-all',
          isHero
            ? 'h-14 pl-5 pr-2 shadow-lift focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 sm:h-16'
            : 'h-10 pl-3.5 pr-1.5 shadow-soft focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10',
        )}
      >
        <Search
          className={cn('shrink-0 text-muted-foreground', isHero ? 'size-5' : 'size-4')}
        />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Поиск заведений"
          className={cn(
            'w-full bg-transparent outline-none placeholder:text-muted-foreground/70',
            isHero ? 'text-base' : 'text-sm',
          )}
        />

        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue('');
              setActiveIndex(-1);
            }}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Очистить"
          >
            <X className="size-4" />
          </button>
        ) : null}

        <VoiceInputButton
          size={isHero ? 'icon' : 'icon-sm'}
          className="shrink-0 rounded-xl"
          onTranscript={(text) => {
            setValue(text);
            setIsOpen(true);
          }}
        />

        <Button
          onClick={submit}
          size={isHero ? 'lg' : 'sm'}
          className={cn('shrink-0', isHero ? 'px-6' : 'px-3')}
        >
          {isHero ? 'Найти' : <Search className="size-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-lift"
          >
            <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>{value.trim() ? 'Совпадения' : 'Популярные запросы'}</span>
              {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </div>

            <ul className="max-h-[min(60vh,26rem)] overflow-y-auto p-1.5 pt-0">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.kind}-${suggestion.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(suggestion.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      activeIndex === index ? 'bg-secondary' : 'hover:bg-secondary/60',
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <Icon name={suggestion.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {suggestion.label}
                      </span>
                      {suggestion.sublabel ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {suggestion.sublabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground/70">
                      {KIND_LABELS[suggestion.kind]}
                    </span>
                  </button>
                </li>
              ))}

              {suggestions.length === 0 && !isFetching ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Ничего не нашли. Попробуйте «ужин», «банкет» или название района.
                </li>
              ) : null}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
