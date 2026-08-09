import { cookies } from 'next/headers';

import type { User, UserRole } from '@/types';
import { DEMO_USER } from '@/data/seed/users';
import { DEFAULT_CITY_ID } from '@/data/seed/geo';

/** Совпадает с DEMO_BUSINESS_ID в data/db — без тяжёлого импорта в middleware. */
const DEMO_BUSINESS_ID = 'biz-chechil-pub';

/** Кука локальной (демо) сессии — работает без Supabase. */
export const DEMO_SESSION_COOKIE = 'market-fix-demo-session';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней
const NOW = new Date().toISOString();

export interface DemoAccountPublic {
  email: string;
  password: string;
  role: UserRole;
  label: string;
  description: string;
}

interface DemoAccountRecord extends DemoAccountPublic {
  user: User;
}

/**
 * Готовые аккаунты для входа в один клик.
 * Пароли намеренно простые — это демо-среда, не продакшен.
 */
export const DEMO_ACCOUNTS: DemoAccountRecord[] = [
  {
    email: 'guest@demo.kz',
    password: 'demo1234',
    role: 'user',
    label: 'Гость (B2C)',
    description: 'Личный кабинет, брони, избранное',
    user: {
      ...DEMO_USER,
      // Тот же id, что в seed — брони, избранное и уведомления уже заполнены.
      email: 'guest@demo.kz',
      name: 'Айгерим Смагулова',
      phone: '+7 701 234 56 78',
      role: 'user',
      avatar: '/api/avatar/aigerim-smagulova/160',
    },
  },
  {
    email: 'business@demo.kz',
    password: 'demo1234',
    role: 'business',
    label: 'Бизнес (B2B)',
    description: 'Кабинет площадки, брони, аналитика',
    user: {
      id: 'user-demo-business',
      name: 'Алишер Ким',
      email: 'business@demo.kz',
      phone: '+7 777 100 20 30',
      avatar: '/api/avatar/alisher-kim/160',
      role: 'business',
      cityId: DEFAULT_CITY_ID,
      joinedAt: '2024-02-01T10:00:00.000Z',
      preferences: {
        favoriteCategoryIds: [],
        favoriteCuisineIds: [],
        budgetPerPerson: 15000,
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
          promotions: false,
          recommendations: false,
          reviewReplies: true,
          channels: { email: true, push: true, sms: true },
        },
        allowGeolocation: false,
      },
      loyaltyPoints: 0,
      businessId: DEMO_BUSINESS_ID,
      createdAt: '2024-02-01T10:00:00.000Z',
      updatedAt: NOW,
    },
  },
];

export function getDemoAccountsPublic(): DemoAccountPublic[] {
  return DEMO_ACCOUNTS.map(({ email, password, role, label, description }) => ({
    email,
    password,
    role,
    label,
    description,
  }));
}

interface SessionPayload {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  businessId?: string;
  avatar?: string;
  joinedAt?: string;
  exp: number;
}

/** In-memory реестр зарегистрированных локально пользователей (dev / demo). */
const globalForDemo = globalThis as unknown as {
  __marketFixDemoUsers?: Map<string, { password: string; user: User }>;
};

function registeredUsers() {
  if (!globalForDemo.__marketFixDemoUsers) {
    globalForDemo.__marketFixDemoUsers = new Map();
  }
  return globalForDemo.__marketFixDemoUsers;
}

function encodeSession(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeSession(raw: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed?.id || !parsed?.email || !parsed?.exp) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function userFromPayload(payload: SessionPayload): User {
  const demo = DEMO_ACCOUNTS.find((account) => account.user.id === payload.id);
  if (demo) return demo.user;

  const registered = registeredUsers().get(payload.email.toLowerCase());
  if (registered) return registered.user;

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    avatar:
      payload.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name)}`,
    role: payload.role === 'business' || payload.role === 'admin' ? payload.role : 'user',
    cityId: DEFAULT_CITY_ID,
    joinedAt: payload.joinedAt ?? NOW,
    preferences: {
      favoriteCategoryIds: [],
      favoriteCuisineIds: [],
      budgetPerPerson: payload.role === 'business' ? 15000 : 10000,
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
    businessId: payload.businessId,
    createdAt: payload.joinedAt ?? NOW,
    updatedAt: NOW,
  };
}

function toPayload(user: User): SessionPayload {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    businessId: user.businessId,
    avatar: user.avatar,
    joinedAt: user.joinedAt,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
}

export async function setDemoSession(user: User) {
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, encodeSession(toPayload(user)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearDemoSession() {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
}

export async function getDemoSessionUser(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = decodeSession(raw);
  if (!payload) return null;
  return userFromPayload(payload);
}

/** Читает куку из NextRequest (для middleware). */
export function getDemoSessionUserFromToken(raw: string | undefined): User | null {
  if (!raw) return null;
  const payload = decodeSession(raw);
  if (!payload) return null;
  return userFromPayload(payload);
}

export function findDemoAccount(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find(
      (account) => account.email === normalized && account.password === password,
    ) ?? null
  );
}

export function authenticateLocalUser(email: string, password: string): User | null {
  const demo = findDemoAccount(email, password);
  if (demo) return demo.user;

  const registered = registeredUsers().get(email.trim().toLowerCase());
  if (!registered) return null;
  if (registered.password !== password) return null;
  return registered.user;
}

export function registerLocalUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  businessName?: string;
}): { user: User } | { error: string } {
  const email = input.email.trim().toLowerCase();
  if (DEMO_ACCOUNTS.some((account) => account.email === email)) {
    return { error: 'Этот email занят демо-аккаунтом. Войдите через демо-кнопку.' };
  }
  if (registeredUsers().has(email)) {
    return { error: 'Пользователь с таким email уже зарегистрирован' };
  }

  const id = `user-local-${Buffer.from(email).toString('base64url').slice(0, 16)}`;
  const user: User = {
    id,
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() ?? '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name.trim())}`,
    role: input.role === 'business' ? 'business' : 'user',
    cityId: DEFAULT_CITY_ID,
    joinedAt: new Date().toISOString(),
    preferences: {
      favoriteCategoryIds: [],
      favoriteCuisineIds: [],
      budgetPerPerson: input.role === 'business' ? 15000 : 10000,
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
    businessId: input.role === 'business' ? DEMO_BUSINESS_ID : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  registeredUsers().set(email, { password: input.password, user });
  return { user };
}
