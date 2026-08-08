import type { WeekDay, WorkingHours } from '@/types';

export type HoursProfile =
  | 'daytime'
  | 'restaurant'
  | 'bar'
  | 'club'
  | 'banquet'
  | 'karaoke'
  | 'lounge'
  | 'loft';

interface ProfileConfig {
  opensAt: string;
  closesAt: string;
  isOvernight: boolean;
  /** Дни, когда заведение закрыто. */
  closedDays?: WeekDay[];
  /** Переопределения для пятницы/субботы (работают дольше). */
  weekend?: { opensAt: string; closesAt: string; isOvernight: boolean };
}

const PROFILES: Record<HoursProfile, ProfileConfig> = {
  daytime: {
    opensAt: '08:00',
    closesAt: '22:00',
    isOvernight: false,
    weekend: { opensAt: '09:00', closesAt: '23:00', isOvernight: false },
  },
  restaurant: {
    opensAt: '11:00',
    closesAt: '23:00',
    isOvernight: false,
    weekend: { opensAt: '11:00', closesAt: '01:00', isOvernight: true },
  },
  bar: {
    opensAt: '17:00',
    closesAt: '02:00',
    isOvernight: true,
    closedDays: [1],
    weekend: { opensAt: '16:00', closesAt: '04:00', isOvernight: true },
  },
  club: {
    opensAt: '22:00',
    closesAt: '06:00',
    isOvernight: true,
    closedDays: [1, 2, 3],
    weekend: { opensAt: '22:00', closesAt: '07:00', isOvernight: true },
  },
  banquet: {
    opensAt: '10:00',
    closesAt: '23:00',
    isOvernight: false,
    weekend: { opensAt: '10:00', closesAt: '02:00', isOvernight: true },
  },
  karaoke: {
    opensAt: '18:00',
    closesAt: '04:00',
    isOvernight: true,
    weekend: { opensAt: '17:00', closesAt: '06:00', isOvernight: true },
  },
  lounge: {
    opensAt: '14:00',
    closesAt: '02:00',
    isOvernight: true,
    weekend: { opensAt: '13:00', closesAt: '04:00', isOvernight: true },
  },
  loft: {
    opensAt: '11:00',
    closesAt: '23:00',
    isOvernight: false,
    closedDays: [1],
    weekend: { opensAt: '11:00', closesAt: '00:00', isOvernight: false },
  },
};

const ALL_DAYS: WeekDay[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKEND_DAYS: WeekDay[] = [5, 6];

export function buildWorkingHours(profile: HoursProfile): WorkingHours {
  const config = PROFILES[profile];
  return ALL_DAYS.map((day) => {
    if (config.closedDays?.includes(day)) {
      return { day, isClosed: true, opensAt: '00:00', closesAt: '00:00', isOvernight: false };
    }
    const schedule = config.weekend && WEEKEND_DAYS.includes(day) ? config.weekend : config;
    return {
      day,
      isClosed: false,
      opensAt: schedule.opensAt,
      closesAt: schedule.closesAt,
      isOvernight: schedule.isOvernight,
    };
  });
}
