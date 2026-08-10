'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Заведения', href: '/admin/venues' },
  { label: 'Очередь модерации', href: '/admin/reviews?status=open' },
  { label: 'Бронирования сегодня', href: '/admin/bookings' },
  { label: 'Рейтинги', href: '/admin/ratings' },
  { label: 'Пользователи', href: '/admin/users' },
  { label: 'Audit Log', href: '/admin/audit' },
];

export function AdminCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  const results = QUICK_LINKS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border bg-background px-3 text-sm text-muted-foreground shadow-soft transition hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Поиск / команды</span>
        <kbd className="rounded border bg-secondary px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b p-3">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Куда перейти?"
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-72 overflow-auto p-2">
          {results.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-secondary"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
