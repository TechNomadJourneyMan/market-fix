import type {
  AuditLogEntry,
  EditorialRatingOverride,
  FraudSignal,
  ModerationCase,
  RatingSnapshot,
  ReviewAnalysis,
} from '@/types';

/**
 * In-memory admin state layered on top of the demo db.
 * Mirrors tables from supabase/migrations/002_admin_platform.sql
 * so repositories can later swap to Postgres without UI changes.
 */
export interface AdminStore {
  analyses: Map<string, ReviewAnalysis>;
  moderationCases: ModerationCase[];
  ratingSnapshots: Map<string, RatingSnapshot>;
  ratingHistory: RatingSnapshot[];
  editorialOverrides: Map<string, EditorialRatingOverride>;
  auditLogs: AuditLogEntry[];
  fraudSignals: FraudSignal[];
  blockedUserIds: Set<string>;
  userTrustScores: Map<string, number>;
}

const globalForAdmin = globalThis as unknown as {
  __marketFixAdminStore?: AdminStore;
};

export function getAdminStore(): AdminStore {
  if (!globalForAdmin.__marketFixAdminStore) {
    globalForAdmin.__marketFixAdminStore = {
      analyses: new Map(),
      moderationCases: [],
      ratingSnapshots: new Map(),
      ratingHistory: [],
      editorialOverrides: new Map(),
      auditLogs: [],
      fraudSignals: [],
      blockedUserIds: new Set(),
      userTrustScores: new Map(),
    };
  }
  return globalForAdmin.__marketFixAdminStore;
}
