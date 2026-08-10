import type { Entity, ID, ISODateString } from './common';

export type AuditAction =
  | 'venue.create'
  | 'venue.update'
  | 'venue.status_change'
  | 'venue.publish'
  | 'venue.suspend'
  | 'booking.create'
  | 'booking.status_change'
  | 'booking.cancel'
  | 'review.moderate'
  | 'review.override_ai'
  | 'review.delete'
  | 'rating.recalculate'
  | 'rating.override'
  | 'user.block'
  | 'user.unblock'
  | 'user.role_change'
  | 'kb.update'
  | 'settings.update'
  | 'login.admin';

export interface AuditLogEntry extends Entity {
  actorId: ID;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  objectType: string;
  objectId: ID;
  objectLabel?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  source: 'manual' | 'ai' | 'system';
  ip?: string;
  userAgent?: string;
  timestamp: ISODateString;
}
