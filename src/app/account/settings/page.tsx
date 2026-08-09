import type { Metadata } from 'next';

import { SettingsForm } from '@/components/account/settings-form';
import { requireSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Настройки' };

export default async function SettingsPage() {
  const user = await requireSessionUser();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Личные данные, предпочтения подбора и уведомления
        </p>
      </header>

      <SettingsForm user={user} />
    </div>
  );
}
