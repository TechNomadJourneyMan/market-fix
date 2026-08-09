'use client';

import { Building2, KeyRound, UserRound } from 'lucide-react';

import { demoSignInAction } from '@/app/auth/actions';
import type { DemoAccountPublic } from '@/lib/demo-auth';

export function DemoAccounts({
  accounts,
  next,
  preferredRole,
}: {
  accounts: DemoAccountPublic[];
  next?: string;
  preferredRole?: 'user' | 'business';
}) {
  const ordered = [...accounts].sort((a, b) => {
    if (!preferredRole) return 0;
    if (a.role === preferredRole && b.role !== preferredRole) return -1;
    if (b.role === preferredRole && a.role !== preferredRole) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <KeyRound className="size-3.5" />
        Демо-аккаунты
      </div>

      <div className="grid gap-2">
        {ordered.map((account) => {
          const Icon = account.role === 'business' ? Building2 : UserRound;
          return (
            <form key={account.email} action={demoSignInAction}>
              <input type="hidden" name="email" value={account.email} />
              <input type="hidden" name="password" value={account.password} />
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <button
                type="submit"
                className="flex w-full items-start gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-secondary/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{account.label}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {account.role === 'business' ? 'B2B' : 'B2C'}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {account.description}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-foreground/80">
                    {account.email} · {account.password}
                  </span>
                </span>
                <span className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold">
                  Войти
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
