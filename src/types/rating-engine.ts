import type { Entity, ID, ISODateString } from './common';

export type RatingFactorKey =
  | 'food'
  | 'service'
  | 'value'
  | 'atmosphere'
  | 'cleanliness'
  | 'location'
  | 'booking'
  | 'reliability'
  | 'review_quality';

export type RatingConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface RatingFactorScore {
  key: RatingFactorKey;
  label: string;
  weight: number;
  /** 0–10 scale */
  score: number;
  sampleSize: number;
  explanation: string;
}

export interface RatingLayers {
  /** Aggregated stars / signals before AI weighting */
  rawScore: number;
  /** AI-weighted interpretation 0–10 */
  aiInterpretation: number;
  /** Mathematical Bayesian / weighted score 0–10 */
  scoring: number;
  /** Admin editorial delta applied to scoring */
  editorialOverride: number;
  /** Final published score 0–10 */
  finalScore: number;
}

export interface RatingSnapshot extends Entity {
  venueId: ID;
  layers: RatingLayers;
  factors: RatingFactorScore[];
  confidence: RatingConfidence;
  explanation: string;
  reviewCountUsed: number;
  version: string;
  computedAt: ISODateString;
  overrideReason?: string;
  overriddenBy?: ID;
}

export interface EditorialRatingOverride {
  venueId: ID;
  delta: number;
  reason: string;
  expiresAt?: ISODateString;
  createdBy: ID;
  createdAt: ISODateString;
}
