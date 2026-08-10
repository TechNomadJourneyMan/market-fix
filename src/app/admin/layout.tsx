import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';

import { requireAdminUser } from '@/server/admin/auth';
import { listModerationQueue } from '@/server/repositories/admin';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminCommand } from '@/components/admin/admin-command';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: {
    default: 'Admin · Market Fix',
    template: '%s · Admin · Market Fix',
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const openCount = listModerationQueue({ status: 'open' }).length;

  return (
    <div className="min-h-screen bg-[hsl(220_16%_97%)] text-foreground dark:bg-background">
      <div className="border-b bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Link href="/admin" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Shield className="size-4" />
            </span>
            Market Fix Admin
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Ops Center
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <AdminCommand />
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground">{user.role}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="container grid gap-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-3 shadow-soft">
            <AdminNav openCount={openCount} />
          </div>
          <p className="mt-3 px-2 text-xs text-muted-foreground">
            Booking-first · explainable rating · AI-assisted moderation
          </p>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
