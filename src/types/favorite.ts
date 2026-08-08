import type { ID } from './common';

export interface Favorite {
  id: ID;
  userId: ID;
  venueId: ID;
  createdAt: string;
  /** Заметка пользователя — «сюда на день рождения». */
  note?: string;
}
