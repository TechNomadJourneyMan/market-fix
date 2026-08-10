import { requireAdminPermission } from '@/server/admin/auth';
import { listAdminUsers } from '@/server/repositories/admin';
import { toggleUserBlockAction } from '@/app/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminUsersPage() {
  await requireAdminPermission('users.read');
  const users = listAdminUsers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Пользователи</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Профили, активность, trust score и блокировки.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-secondary/50 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Trust</th>
              <th className="px-4 py-3 font-medium">Брони</th>
              <th className="px-4 py-3 font-medium">Отзывы</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ user, trustScore, isBlocked, bookings, reviews }) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{trustScore}</td>
                <td className="px-4 py-3">{bookings}</td>
                <td className="px-4 py-3">{reviews}</td>
                <td className="px-4 py-3">
                  <Badge variant={isBlocked ? 'destructive' : 'success'}>
                    {isBlocked ? 'Blocked' : 'Active'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleUserBlockAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="blocked" value={isBlocked ? '0' : '1'} />
                    <Input
                      name="reason"
                      placeholder="Причина"
                      className="h-8 w-36"
                      required={!isBlocked}
                    />
                    <Button type="submit" size="sm" variant={isBlocked ? 'outline' : 'ghost'}>
                      {isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
