import type { ID } from './common';
import type { Occasion, Vibe } from './ai';

export type MergeMessageKind = 'system' | 'user' | 'vote' | 'match' | 'suggestion';

export interface MergeParticipant {
  id: ID;
  name: string;
  color: string;
  isHost: boolean;
  joinedAt: string;
}

export interface MergePreferences {
  cuisineIds: string[];
  budgetPerPerson?: number;
  guests?: number;
  vibes: Vibe[];
  occasion?: Occasion;
  freeText?: string;
}

export interface MergeMessage {
  id: ID;
  kind: MergeMessageKind;
  authorId?: ID;
  authorName: string;
  text: string;
  venueId?: ID;
  createdAt: string;
}

export interface MergeVote {
  participantId: ID;
  venueId: ID;
  createdAt: string;
}

export interface MergeRoom {
  id: ID;
  code: string;
  title: string;
  hostId: ID;
  status: 'open' | 'matched' | 'closed';
  participants: MergeParticipant[];
  preferencesByUser: Record<string, MergePreferences>;
  messages: MergeMessage[];
  votes: MergeVote[];
  shortlistVenueIds: ID[];
  matchedVenueId?: ID;
  createdAt: string;
  updatedAt: string;
}

export interface MergeRoomPublic {
  room: MergeRoom;
  shareUrl: string;
}
