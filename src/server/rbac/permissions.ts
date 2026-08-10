import type { PermissionCode, PlatformRole, RoleDefinition, User, UserRole } from '@/types';

/** Full permission catalog for admin UI and API guards. */
export const ALL_PERMISSIONS: { code: PermissionCode; description: string; group: string }[] = [
  { code: 'dashboard.read', description: 'Просмотр dashboard', group: 'dashboard' },
  { code: 'venues.read', description: 'Просмотр заведений', group: 'venues' },
  { code: 'venues.create', description: 'Создание заведений', group: 'venues' },
  { code: 'venues.edit', description: 'Редактирование заведений', group: 'venues' },
  { code: 'venues.delete', description: 'Удаление заведений', group: 'venues' },
  { code: 'venues.publish', description: 'Публикация заведений', group: 'venues' },
  { code: 'bookings.read', description: 'Просмотр броней', group: 'bookings' },
  { code: 'bookings.create', description: 'Создание броней', group: 'bookings' },
  { code: 'bookings.edit', description: 'Изменение броней', group: 'bookings' },
  { code: 'bookings.cancel', description: 'Отмена броней', group: 'bookings' },
  { code: 'reviews.read', description: 'Просмотр отзывов', group: 'reviews' },
  { code: 'reviews.moderate', description: 'Модерация отзывов', group: 'reviews' },
  { code: 'reviews.delete', description: 'Удаление отзывов', group: 'reviews' },
  { code: 'reviews.override_ai', description: 'Отмена решения AI', group: 'reviews' },
  { code: 'ratings.read', description: 'Просмотр рейтингов', group: 'ratings' },
  { code: 'ratings.edit', description: 'Редактирование рейтингов', group: 'ratings' },
  { code: 'ratings.recalculate', description: 'Пересчёт рейтингов', group: 'ratings' },
  { code: 'users.read', description: 'Просмотр пользователей', group: 'users' },
  { code: 'users.edit', description: 'Редактирование пользователей', group: 'users' },
  { code: 'users.block', description: 'Блокировка пользователей', group: 'users' },
  { code: 'crm.read', description: 'Просмотр CRM', group: 'crm' },
  { code: 'crm.edit', description: 'Редактирование CRM', group: 'crm' },
  { code: 'analytics.read', description: 'Просмотр аналитики', group: 'analytics' },
  { code: 'kb.read', description: 'Просмотр Knowledge Base', group: 'kb' },
  { code: 'kb.edit', description: 'Редактирование Knowledge Base', group: 'kb' },
  { code: 'audit.read', description: 'Просмотр audit log', group: 'audit' },
  { code: 'settings.read', description: 'Просмотр настроек', group: 'settings' },
  { code: 'settings.edit', description: 'Изменение настроек', group: 'settings' },
  { code: 'media.read', description: 'Просмотр медиа', group: 'media' },
  { code: 'media.edit', description: 'Редактирование медиа', group: 'media' },
  { code: 'recommendations.read', description: 'Просмотр рекомендаций', group: 'recommendations' },
  { code: 'recommendations.edit', description: 'Управление рекомендациями', group: 'recommendations' },
  { code: 'integrations.read', description: 'Просмотр интеграций', group: 'integrations' },
  { code: 'integrations.edit', description: 'Управление интеграциями', group: 'integrations' },
];

const ALL_CODES = ALL_PERMISSIONS.map((item) => item.code);

function subset(...codes: PermissionCode[]): PermissionCode[] {
  return codes;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Полный доступ ко всей платформе',
    permissions: ALL_CODES,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Операционное управление платформой',
    permissions: ALL_CODES.filter((code) => code !== 'settings.edit'),
  },
  {
    id: 'moderator',
    name: 'Moderator',
    description: 'Модерация контента и заведений',
    permissions: subset(
      'dashboard.read',
      'venues.read',
      'venues.edit',
      'venues.publish',
      'reviews.read',
      'reviews.moderate',
      'reviews.override_ai',
      'media.read',
      'media.edit',
      'users.read',
    ),
  },
  {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Каталог, медиа, рекомендации',
    permissions: subset(
      'dashboard.read',
      'venues.read',
      'venues.create',
      'venues.edit',
      'venues.publish',
      'media.read',
      'media.edit',
      'recommendations.read',
      'recommendations.edit',
    ),
  },
  {
    id: 'review_moderator',
    name: 'Review Moderator',
    description: 'Очередь отзывов и override AI',
    permissions: subset(
      'dashboard.read',
      'reviews.read',
      'reviews.moderate',
      'reviews.delete',
      'reviews.override_ai',
      'ratings.read',
      'venues.read',
    ),
  },
  {
    id: 'ai_manager',
    name: 'AI Manager',
    description: 'Рейтинг, KB, AI-функции',
    permissions: subset(
      'dashboard.read',
      'ratings.read',
      'ratings.edit',
      'ratings.recalculate',
      'reviews.read',
      'reviews.moderate',
      'kb.read',
      'kb.edit',
      'recommendations.read',
      'recommendations.edit',
      'analytics.read',
    ),
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Только чтение аналитики',
    permissions: subset('dashboard.read', 'analytics.read', 'venues.read', 'bookings.read', 'reviews.read', 'ratings.read'),
  },
  {
    id: 'business_manager',
    name: 'Business Manager',
    description: 'B2B CRM и организации',
    permissions: subset(
      'dashboard.read',
      'crm.read',
      'crm.edit',
      'venues.read',
      'bookings.read',
      'users.read',
      'analytics.read',
    ),
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Поддержка пользователей и броней',
    permissions: subset(
      'dashboard.read',
      'users.read',
      'users.edit',
      'bookings.read',
      'bookings.edit',
      'bookings.cancel',
      'venues.read',
      'reviews.read',
    ),
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Финансовые показатели',
    permissions: subset('dashboard.read', 'analytics.read', 'bookings.read', 'crm.read'),
  },
  {
    id: 'venue_manager',
    name: 'Venue Manager',
    description: 'Управление своим заведением (B2B)',
    permissions: subset(
      'venues.read',
      'venues.edit',
      'bookings.read',
      'bookings.edit',
      'reviews.read',
      'media.read',
      'media.edit',
      'analytics.read',
    ),
  },
  {
    id: 'b2b_client',
    name: 'B2B Client',
    description: 'Владелец/управляющий заведения',
    permissions: subset(
      'venues.read',
      'venues.edit',
      'bookings.read',
      'bookings.edit',
      'reviews.read',
      'media.read',
      'analytics.read',
    ),
  },
];

export function mapUserRoleToPlatformRole(role: UserRole): PlatformRole | null {
  if (role === 'admin') return 'super_admin';
  if (role === 'business') return 'b2b_client';
  return null;
}

export function getPermissionsForRole(role: PlatformRole): PermissionCode[] {
  return ROLE_DEFINITIONS.find((item) => item.id === role)?.permissions ?? [];
}

export function getUserPlatformRoles(user: User): PlatformRole[] {
  const mapped = mapUserRoleToPlatformRole(user.role);
  return mapped ? [mapped] : [];
}

export function getUserPermissions(user: User): Set<PermissionCode> {
  const set = new Set<PermissionCode>();
  for (const role of getUserPlatformRoles(user)) {
    for (const code of getPermissionsForRole(role)) {
      set.add(code);
    }
  }
  return set;
}

export function hasPermission(user: User, code: PermissionCode): boolean {
  return getUserPermissions(user).has(code);
}

export function hasAnyPermission(user: User, codes: PermissionCode[]): boolean {
  const perms = getUserPermissions(user);
  return codes.some((code) => perms.has(code));
}

export function isPlatformAdmin(user: User): boolean {
  return user.role === 'admin' || hasPermission(user, 'dashboard.read');
}
