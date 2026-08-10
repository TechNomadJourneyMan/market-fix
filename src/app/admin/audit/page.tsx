import { requireAdminPermission } from '@/server/admin/auth';
import { searchAuditLogs } from '@/server/repositories/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPermission('audit.read');
  const params = await searchParams;
  const logs = searchAuditLogs({ q: params.q, limit: 150 });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Кто, что, когда, до/после, AI или manual.
          </p>
        </div>
        <form className="flex gap-2">
          <Input name="q" defaultValue={params.q} placeholder="Поиск по actor / action / object" className="w-72" />
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Записей пока нет.
          </div>
        ) : (
          logs.map((entry) => (
            <article key={entry.id} className="rounded-2xl border bg-card px-4 py-3 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{entry.actorName}</span>
                <Badge variant="outline">{entry.actorRole}</Badge>
                <Badge variant="secondary">{entry.action}</Badge>
                <Badge variant={entry.source === 'ai' ? 'warning' : 'outline'}>{entry.source}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString('ru-RU')}</span>
              </div>
              <p className="mt-1 text-sm">
                {entry.objectType}:{entry.objectLabel ?? entry.objectId}
                {entry.reason ? ` — ${entry.reason}` : ''}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
