import { redirect } from 'next/navigation';

import type { PermissionCode, User } from '@/types';
import { getSessionUser } from '@/lib/auth';
import { hasPermission, isPlatformAdmin } from '@/server/rbac/permissions';
import { bootstrapAdminEngine } from '@/server/repositories/admin';

export async function requireAdminUser(nextPath = '/admin'): Promise<User> {
  bootstrapAdminEngine();
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}&role=admin`);
  }
  if (!isPlatformAdmin(user)) {
    redirect('/account');
  }
  return user;
}

export async function requireAdminPermission(
  code: PermissionCode,
  nextPath = '/admin',
): Promise<User> {
  const user = await requireAdminUser(nextPath);
  if (!hasPermission(user, code)) {
    redirect('/admin?error=forbidden');
  }
  return user;
}
