import type {
  MergeMessage,
  MergeParticipant,
  MergePreferences,
  MergeRoom,
  VenueListItem,
} from '@/types';
import { recommend } from '@/server/ai/recommend';
import { getVenueById } from '@/server/repositories/venues';
import { CATEGORY_BY_ID } from '@/data/seed/categories';
import { createRandom, hashString } from '@/lib/utils';
import { toVenueListItem } from '@/server/mappers';

const rooms = new Map<string, MergeRoom>();

const COLORS = ['#E11D48', '#EA580C', '#CA8A04', '#16A34A', '#0891B2', '#7C3AED', '#DB2777'];

function now() {
  return new Date().toISOString();
}

function codeFromId(id: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = createRandom(hashString(id));
  return Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
}

function pushMessage(
  room: MergeRoom,
  message: Omit<MergeMessage, 'id' | 'createdAt'>,
) {
  room.messages.push({
    ...message,
    id: `msg-${room.id}-${room.messages.length + 1}`,
    createdAt: now(),
  });
  room.updatedAt = now();
}

function mergePreferences(room: MergeRoom): MergePreferences {
  const all = Object.values(room.preferencesByUser);
  const cuisineIds = [...new Set(all.flatMap((item) => item.cuisineIds))];
  const vibes = [...new Set(all.flatMap((item) => item.vibes))];
  const budgets = all.map((item) => item.budgetPerPerson).filter(Boolean) as number[];
  const guests = all.map((item) => item.guests).filter(Boolean) as number[];
  const texts = all.map((item) => item.freeText).filter(Boolean) as string[];
  const occasions = all.map((item) => item.occasion).filter(Boolean);

  return {
    cuisineIds,
    vibes: vibes as MergePreferences['vibes'],
    budgetPerPerson: budgets.length
      ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
      : undefined,
    guests: guests.length ? Math.max(...guests) : undefined,
    occasion: occasions[0],
    freeText: texts.join('. ') || undefined,
  };
}

function refreshShortlist(room: MergeRoom) {
  const prefs = mergePreferences(room);
  const result = recommend({
    cuisineIds: prefs.cuisineIds,
    budgetPerPerson: prefs.budgetPerPerson,
    guests: prefs.guests,
    vibes: prefs.vibes,
    occasion: prefs.occasion,
    freeText: prefs.freeText || 'встреча друзей выбрать ресторан',
  });

  room.shortlistVenueIds = result.recommendations
    .slice(0, 5)
    .map((item) => item.venue.id);

  if (room.shortlistVenueIds.length) {
    const top = result.recommendations[0];
    pushMessage(room, {
      kind: 'suggestion',
      authorName: 'Merge Menu',
      text: `Подобрали ${room.shortlistVenueIds.length} вариантов. Лидер сейчас — «${top.venue.name}» (${top.matchScore}% совпадение).`,
      venueId: top.venue.id,
    });
  }
}

export function createMergeRoom(input: {
  hostName: string;
  title?: string;
}): MergeRoom {
  const id = `merge-${Date.now()}`;
  const hostId = `p-${hashString(input.hostName + id)}`;
  const host: MergeParticipant = {
    id: String(hostId),
    name: input.hostName.trim() || 'Хост',
    color: COLORS[0],
    isHost: true,
    joinedAt: now(),
  };

  const room: MergeRoom = {
    id,
    code: codeFromId(id),
    title: input.title?.trim() || 'Куда пойдём?',
    hostId: host.id,
    status: 'open',
    participants: [host],
    preferencesByUser: {
      [host.id]: { cuisineIds: [], vibes: [] },
    },
    messages: [],
    votes: [],
    shortlistVenueIds: [],
    createdAt: now(),
    updatedAt: now(),
  };

  pushMessage(room, {
    kind: 'system',
    authorName: 'Merge Menu',
    text: `${host.name} создал комнату. Пригласите друзей по коду ${room.code} — вместе выберете место.`,
  });

  rooms.set(room.code, room);
  rooms.set(room.id, room);
  return room;
}

export function getMergeRoom(codeOrId: string): MergeRoom | null {
  return rooms.get(codeOrId.toUpperCase()) ?? rooms.get(codeOrId) ?? null;
}

export function joinMergeRoom(code: string, name: string): { room: MergeRoom; participant: MergeParticipant } | null {
  const room = getMergeRoom(code);
  if (!room || room.status === 'closed') return null;

  const existing = room.participants.find(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (existing) {
    return { room, participant: existing };
  }

  const participant: MergeParticipant = {
    id: `p-${Date.now()}-${room.participants.length}`,
    name: name.trim() || `Гость ${room.participants.length + 1}`,
    color: COLORS[room.participants.length % COLORS.length],
    isHost: false,
    joinedAt: now(),
  };

  room.participants.push(participant);
  room.preferencesByUser[participant.id] = { cuisineIds: [], vibes: [] };
  pushMessage(room, {
    kind: 'system',
    authorName: 'Merge Menu',
    text: `${participant.name} присоединился к комнате.`,
  });

  return { room, participant };
}

export async function updateMergePreferences(
  code: string,
  participantId: string,
  preferences: MergePreferences,
): Promise<MergeRoom | null> {
  const room = getMergeRoom(code);
  if (!room) return null;
  const participant = room.participants.find((item) => item.id === participantId);
  if (!participant) return null;

  room.preferencesByUser[participantId] = preferences;
  pushMessage(room, {
    kind: 'user',
    authorId: participant.id,
    authorName: participant.name,
    text:
      preferences.freeText?.trim() ||
      `Обновил предпочтения: кухни ${preferences.cuisineIds.length || 'любые'}, вайб ${preferences.vibes.join(', ') || 'любой'}`,
  });

  refreshShortlist(room);
  return room;
}

export function sendMergeChat(
  code: string,
  participantId: string,
  text: string,
): MergeRoom | null {
  const room = getMergeRoom(code);
  if (!room) return null;
  const participant = room.participants.find((item) => item.id === participantId);
  if (!participant || !text.trim()) return null;

  pushMessage(room, {
    kind: 'user',
    authorId: participant.id,
    authorName: participant.name,
    text: text.trim(),
  });
  return room;
}

export function voteMergeVenue(
  code: string,
  participantId: string,
  venueId: string,
): MergeRoom | null {
  const room = getMergeRoom(code);
  if (!room) return null;
  const participant = room.participants.find((item) => item.id === participantId);
  const venue = getVenueById(venueId);
  if (!participant || !venue) return null;

  room.votes = room.votes.filter((vote) => vote.participantId !== participantId);
  room.votes.push({ participantId, venueId, createdAt: now() });

  pushMessage(room, {
    kind: 'vote',
    authorId: participant.id,
    authorName: participant.name,
    text: `Голосует за «${venue.name}»`,
    venueId,
  });

  // Матч: большинство голосов (больше половины участников)
  const tally = new Map<string, number>();
  room.votes.forEach((vote) => {
    tally.set(vote.venueId, (tally.get(vote.venueId) ?? 0) + 1);
  });

  const threshold = Math.ceil(room.participants.length / 2);
  for (const [id, count] of tally) {
    if (count >= threshold && count >= 2) {
      room.matchedVenueId = id;
      room.status = 'matched';
      const matched = getVenueById(id);
      pushMessage(room, {
        kind: 'match',
        authorName: 'Merge Menu',
        text: `Есть матч! Компания выбирает «${matched?.name}». Можно бронировать.`,
        venueId: id,
      });
      break;
    }
  }

  return room;
}

export function getMergeShortlist(room: MergeRoom): VenueListItem[] {
  return room.shortlistVenueIds
    .map((id) => {
      const full = getVenueById(id);
      if (!full) return null;
      const item = toVenueListItem(full);
      return {
        ...item,
        categoryName: CATEGORY_BY_ID.get(full.categoryId)?.name ?? item.categoryName,
      };
    })
    .filter(Boolean) as VenueListItem[];
}
