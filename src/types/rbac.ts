import type { Entity, ID, ISODateString } from './common';

/** Platform + B2B roles for granular RBAC. */
export type PlatformRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'content_manager'
  | 'review_moderator'
  | 'ai_manager'
  | 'analyst'
  | 'business_manager'
  | 'support'
  | 'finance'
  | 'venue_manager'
  | 'b2b_client';

export type PermissionCode =
  | 'venues.read'
  | 'venues.create'
  | 'venues.edit'
  | 'venues.delete'
  | 'venues.publish'
  | 'bookings.read'
  | 'bookings.create'
  | 'bookings.edit'
  | 'bookings.cancel'
  | 'reviews.read'
  | 'reviews.moderate'
  | 'reviews.delete'
  | 'reviews.override_ai'
  | 'ratings.read'
  | 'ratings.edit'
  | 'ratings.recalculate'
  | 'users.read'
  | 'users.edit'
  | 'users.block'
  | 'crm.read'
  | 'crm.edit'
  | 'analytics.read'
  | 'kb.read'
  | 'kb.edit'
  | 'audit.read'
  | 'settings.read'
  | 'settings.edit'
  | 'media.read'
  | 'media.edit'
  | 'recommendations.read'
  | 'recommendations.edit'
  | 'integrations.read'
  | 'integrations.edit'
  | 'dashboard.read';

export interface Permission {
  code: PermissionCode;
  description: string;
  group: string;
}

export interface RoleDefinition {
  id: PlatformRole;
  name: string;
  description: string;
  permissions: PermissionCode[];
}

export interface UserRoleAssignment extends Entity {
  userId: ID;
  role: PlatformRole;
  organizationId?: ID;
  assignedBy?: ID;
  assignedAt: ISODateString;
}
