'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccountRole } from '@/lib/auth';

export type AuthActionState = {
  error?: string;
  success?: string;
};

function normalizeRole(role: FormDataEntryValue | null): AccountRole {
  return role === 'business' ? 'business' : 'user';
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
  const next = String(formData.get('next') ?? '') || (role === 'business' ? '/business' : '/account');

  if (!email || !password || !name) {
    return { error: 'Заполните имя, email и пароль' };
  }
  if (password.length < 6) {
    return { error: 'Пароль должен быть не короче 6 символов' };
  }
  if (role === 'business' && !businessName) {
    return { error: 'Укажите название бизнеса' };
  }

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

  // Если email confirmation выключен — сессия уже есть.
  if (data.session) {
    redirect(next);
  }

  return {
    success:
      'Аккаунт создан. Проверьте почту для подтверждения — затем войдите в систему.',
  };
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const roleHint = normalizeRole(formData.get('role'));
  const next =
    String(formData.get('next') ?? '') ||
    (roleHint === 'business' ? '/business' : '/account');

  if (!email || !password) {
    return { error: 'Введите email и пароль' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message };
  }

  const role = (data.user?.user_metadata?.role as string | undefined) ?? roleHint;
  redirect(role === 'business' ? (next.startsWith('/business') ? next : '/business') : next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
