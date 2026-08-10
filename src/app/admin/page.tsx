import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';

import { requireAdminPermission } from '@/server/admin/auth';
import { getAdminDashboard } from '@/server/repositories/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  await requireAdminPermission('dashboard.read');
  const data = getAdminDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Что происходит сейчас, что требует внимания и куда кликнуть дальше.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Требует внимания
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.needsAttention.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-start justify-between gap-3 rounded-xl border bg-background px-4 py-3 transition hover:border-foreground/20"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">Открыть раздел</p>
              </div>
              <Badge
                variant={
                  item.severity === 'high'
                    ? 'destructive'
                    : item.severity === 'medium'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {item.count}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Брони сегодня', value: data.now.bookingsToday },
          { label: 'Пользователи', value: data.now.users },
          { label: 'Отзывы', value: data.now.reviewsTotal },
          { label: 'Очередь AI', value: data.now.openModeration },
          { label: 'Published venues', value: data.now.publishedVenues },
          { label: 'Cancel rate сегодня', value: `${data.now.cancelRate}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Воронка
        </h2>
        <div className="mt-4 space-y-3">
          {data.funnel.map((stage, index) => {
            const prev = index === 0 ? stage.value : data.funnel[index - 1].value;
            const conversion = prev > 0 ? Math.round((stage.value / prev) * 100) : 0;
            return (
              <div key={stage.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-muted-foreground">
                    {stage.value}
                    {index > 0 ? ` · ${conversion}%` : ''}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${Math.max(8, (stage.value / data.funnel[0].value) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Последние действия
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/audit">
              Audit Log
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          {data.recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет записей — выполните действие в админке.</p>
          ) : (
            data.recentAudit.map((entry) => (
              <div key={entry.id} className="rounded-xl border px-3 py-2 text-sm">
                <div className="font-medium">
                  {entry.actorName} · {entry.action}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.objectLabel ?? entry.objectId}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
