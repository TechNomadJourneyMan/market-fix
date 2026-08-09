'use server';

import { redirect } from 'next/navigation';

import type { AccountRole } from '@/lib/auth';
import {
  authenticateLocalUser,
  clearDemoSession,
  registerLocalUser,
  setDemoSession,
} from '@/lib/demo-auth';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export type AuthActionState = {
  error?: string;
  success?: string;
};

function normalizeRole(role: FormDataEntryValue | null): AccountRole {
  return role === 'business' ? 'business' : 'user';
}

function resolveNext(role: AccountRole | string, nextRaw: string) {
  if (nextRaw) return nextRaw;
  return role === 'business' ? '/business' : '/account';
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const role = normalizeRole(formData.get('role'));
  const businessName = String(formData.get('businessName') ?? '').trim();
  const next = resolveNext(role, String(formData.get('next') ?? ''));

  if (!email || !password || !name) {
    return { error: 'Заполните имя, email и пароль' };
  }
  if (password.length < 6) {
    return { error: 'Пароль должен быть не короче 6 символов' };
  }
  if (role === 'business' && !businessName) {
    return { error: 'Укажите название бизнеса' };
  }

  // 1) Локальная регистрация — всегда доступна (демо / без подтверждения почты).
  const local = registerLocalUser({ email, password, name, phone, role, businessName });
  if ('error' in local) {
    // Если email уже в демо — подсказываем; иначе пробуем Supabase ниже.
    if (!isSupabaseConfigured() || local.error.includes('демо-аккаунтом')) {
      return { error: local.error };
    }
  } else {
    await setDemoSession(local.user);
    redirect(next);
  }

  // 2) Fallback на Supabase, если настроен.
  if (!isSupabaseConfigured()) {
    return { error: 'Не удалось создать аккаунт' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role,
          business_name: businessName || undefined,
          account_type: role === 'business' ? 'b2b' : 'b2c',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      redirect(next);
    }

    return {
      success:
        'Аккаунт создан. Проверьте почту для подтверждения — затем войдите в систему.',
    };
  } catch {
    return { error: 'Не удалось создать аккаунт. Попробуйте демо-вход ниже.' };
  }
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const roleHint = normalizeRole(formData.get('role'));
  const next = resolveNext(roleHint, String(formData.get('next') ?? ''));

  if (!email || !password) {
    return { error: 'Введите email и пароль' };
  }

  // 1) Демо / локальные аккаунты — приоритет, чтобы вход всегда работал.
  const localUser = authenticateLocalUser(email, password);
  if (localUser) {
    await setDemoSession(localUser);
    const role = localUser.role === 'business' ? 'business' : roleHint;
    redirect(
      role === 'business'
        ? next.startsWith('/business')
          ? next
          : '/business'
        : next.startsWith('/account')
          ? next
          : '/account',
    );
  }

  // 2) Supabase, если настроен.
  if (!isSupabaseConfigured()) {
    return { error: 'Неверный email или пароль. Попробуйте демо-аккаунт ниже.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        error:
          error.message === 'Invalid login credentials'
            ? 'Неверный email или пароль. Попробуйте демо-аккаунт ниже.'
            : error.message,
      };
    }

    await clearDemoSession();
    const role = (data.user?.user_metadata?.role as string | undefined) ?? roleHint;
    redirect(role === 'business' ? (next.startsWith('/business') ? next : '/business') : next);
  } catch {
    return { error: 'Не удалось войти. Используйте демо-аккаунт на этой странице.' };
  }
}

/** Быстрый вход одной кнопкой с карточки демо-аккаунта. */
export async function demoSignInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '');

  const user = authenticateLocalUser(email, password);
  if (!user) {
    redirect('/auth/login?error=demo');
  }

  await setDemoSession(user);
  redirect(
    user.role === 'business'
      ? next.startsWith('/business')
        ? next
        : '/business'
      : next.startsWith('/account')
        ? next
        : '/account',
  );
}

export async function signOutAction() {
  await clearDemoSession();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // demo logout всё равно завершится
    }
  }

  redirect('/');
}
