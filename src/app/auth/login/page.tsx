import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { DemoAccounts } from '@/components/auth/demo-accounts';
import type { AccountRole } from '@/lib/auth';
import { getDemoAccountsPublic } from '@/lib/demo-auth';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в Market Fix — для гостей и для бизнеса.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const role: AccountRole = params.role === 'business' ? 'business' : 'user';
  const demoAccounts = getDemoAccountsPublic();

  return (
    <AuthShell
      title="С возвращением"
      description="Войдите как гость (B2C) или как владелец площадки (B2B). Демо-аккаунты работают без подтверждения почты."
    >
      {params.error ? (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Не удалось войти. Попробуйте демо-аккаунт ниже.
        </p>
      ) : null}
      <AuthForm mode="login" initialRole={role} next={params.next} />
      <div className="my-6 h-px bg-border" />
      <DemoAccounts accounts={demoAccounts} next={params.next} preferredRole={role} />
    </AuthShell>
  );
}
