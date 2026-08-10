import type { AuditAction, AuditLogEntry, User } from '@/types';
import { createId } from '@/lib/utils';
import { getAdminStore } from './store';
import { getUserPlatformRoles } from '@/server/rbac/permissions';

export function writeAuditLog(input: {
  actor: User;
  action: AuditAction;
  objectType: string;
  objectId: string;
  objectLabel?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  source?: 'manual' | 'ai' | 'system';
}): AuditLogEntry {
  const store = getAdminStore();
  const now = new Date().toISOString();
  const roles = getUserPlatformRoles(input.actor);
  const entry: AuditLogEntry = {
    id: createId('audit'),
    actorId: input.actor.id,
    actorName: input.actor.name,
    actorRole: roles[0] ?? input.actor.role,
    action: input.action,
    objectType: input.objectType,
    objectId: input.objectId,
    objectLabel: input.objectLabel,
    before: input.before,
    after: input.after,
    reason: input.reason,
    source: input.source ?? 'manual',
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  };
  store.auditLogs.unshift(entry);
  return entry;
}

export function searchAuditLogs(query?: {
  q?: string;
  action?: AuditAction;
  objectType?: string;
  limit?: number;
}) {
  const store = getAdminStore();
  let items = store.auditLogs;
  if (query?.action) items = items.filter((item) => item.action === query.action);
  if (query?.objectType) items = items.filter((item) => item.objectType === query.objectType);
  if (query?.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(
      (item) =>
        item.actorName.toLowerCase().includes(needle) ||
        item.objectId.toLowerCase().includes(needle) ||
        (item.objectLabel?.toLowerCase().includes(needle) ?? false) ||
        (item.reason?.toLowerCase().includes(needle) ?? false) ||
        item.action.includes(needle),
    );
  }
  return items.slice(0, query?.limit ?? 100);
}
