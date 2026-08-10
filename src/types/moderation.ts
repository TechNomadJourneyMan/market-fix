import type { Entity, ID, ISODateString } from './common';

export type ReviewSource =
  | 'market_fix'
  | 'google'
  | 'tripadvisor'
  | 'yandex'
  | '2gis'
  | 'booking'
  | 'chocolife'
  | 'import'
  | 'manual';

export type ModerationLevel =
  | 'auto_approve'
  | 'approve_with_warning'
  | 'needs_human_review'
  | 'temporarily_hidden'
  | 'reject'
  | 'spam'
  | 'fraud_suspected';

export type ModerationDecisionSource = 'ai' | 'human';

export type ReviewTopic =
  | 'food'
  | 'service'
  | 'price'
  | 'atmosphere'
  | 'cleanliness'
  | 'speed'
  | 'interior'
  | 'music'
  | 'location'
  | 'staff'
  | 'booking'
  | 'wait'
  | 'expectations'
  | 'other';

export interface ReviewAnalysisScores {
  authenticity: number;
  spam: number;
  botProbability: number;
  relevance: number;
  helpfulness: number;
  objectivity: number;
  toxicity: number;
  manipulation: number;
  duplicate: number;
  aiGeneratedProbability: number;
}

export interface ReviewAnalysis extends Entity {
  reviewId: ID;
  scores: ReviewAnalysisScores;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  topics: ReviewTopic[];
  riskScore: number;
  moderationLevel: ModerationLevel;
  aiReasoningSummary: string;
  moderationVersion: string;
  confidence: number;
  language: string;
}

export interface ReviewProvenance {
  source: ReviewSource;
  fetchMethod: 'api' | 'partner_feed' | 'csv_import' | 'manual' | 'platform';
  fetchedAt: ISODateString;
  sourceUrl?: string;
  sourceAuthorId?: string;
  originalText?: string;
  canDisplay: boolean;
  canScore: boolean;
}

export interface ModerationCase extends Entity {
  reviewId: ID;
  venueId: ID;
  status: 'open' | 'resolved' | 'escalated';
  aiLevel: ModerationLevel;
  finalLevel: ModerationLevel;
  decisionSource: ModerationDecisionSource;
  assignedTo?: ID;
  resolvedBy?: ID;
  resolvedAt?: ISODateString;
  overrideReason?: string;
  notes?: string;
}

export interface FraudSignal extends Entity {
  subjectType: 'review' | 'user' | 'venue';
  subjectId: ID;
  score: number;
  signals: string[];
  status: 'open' | 'dismissed' | 'confirmed';
}
