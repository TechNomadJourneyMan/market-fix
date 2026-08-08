import type { Metadata } from 'next';

import { getCurrentUser } from '@/server/repositories/users';
import { SettingsForm } from '@/components/account/settings-form';

export const metadata: Metadata = { title: 'Настройки' };

export default function SettingsPage() {
  const user = getCurrentUser();

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
