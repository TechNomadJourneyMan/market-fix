import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthShell } from '@/components/auth/auth-shell';
import type { AccountRole } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создайте аккаунт гостя или бизнеса в Market Fix.',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const params = await searchParams;
  const role: AccountRole = params.role === 'business' ? 'business' : 'user';

  return (
    <AuthShell
      title={role === 'business' ? 'Подключить бизнес' : 'Создать аккаунт'}
      description={
        role === 'business'
          ? 'Разместите заведение, принимайте брони и управляйте отзывами.'
          : 'Бронируйте места, сохраняйте избранное и получайте AI-подбор.'
      }
    >
      <AuthForm mode="register" initialRole={role} next={params.next} />
    </AuthShell>
  );
}
