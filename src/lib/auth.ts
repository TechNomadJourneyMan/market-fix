import type { User as AuthUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types';
import { DEMO_USER } from '@/data/seed/users';
import { DEFAULT_CITY_ID } from '@/data/seed/geo';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const NOW = new Date().toISOString();

export type AccountRole = 'user' | 'business';

export function mapAuthRole(raw: unknown): UserRole {
  if (raw === 'business' || raw === 'admin') return raw;
  if (raw === 'user' || raw === 'guest') return raw;
  return 'user';
}

export function authUserToAppUser(authUser: AuthUser): User {
  const meta = authUser.user_metadata ?? {};
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    authUser.email?.split('@')[0] ||
    'Гость';
  const phone = typeof meta.phone === 'string' ? meta.phone : '';
  const role = mapAuthRole(meta.role);
  const avatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return {
    id: authUser.id,
    name,
    email: authUser.email ?? '',
    phone,
    avatar,
    role,
    cityId: DEFAULT_CITY_ID,
    joinedAt: authUser.created_at ?? NOW,
    preferences: {
      favoriteCategoryIds: [],
      favoriteCuisineIds: [],
      budgetPerPerson: role === 'business' ? 15000 : 10000,
      preferredDistrictIds: [],
      typicalPartySize: 2,
      dietary: [],
    },
    settings: {
      language: 'ru',
      theme: 'system',
      currency: 'KZT',
      notifications: {
        bookingUpdates: true,
        promotions: true,
        recommendations: true,
        reviewReplies: true,
        channels: { email: true, push: true, sms: false },
      },
      allowGeolocation: false,
    },
    loyaltyPoints: 0,
    businessId: typeof meta.business_id === 'string' ? meta.business_id : undefined,
    createdAt: authUser.created_at ?? NOW,
    updatedAt: NOW,
  };
}

/**
 * Текущий пользователь: сессия Supabase, иначе null.
 * Для публичных страниц можно подставить DEMO_USER через getDisplayUser().
 */
export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return authUserToAppUser(user);
  } catch {
    return null;
  }
}

/** Пользователь для UI оболочки: сессия или демо. */
export async function getDisplayUser(): Promise<{ user: User; isAuthenticated: boolean }> {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    return { user: sessionUser, isAuthenticated: true };
  }
  return { user: DEMO_USER, isAuthenticated: false };
}
