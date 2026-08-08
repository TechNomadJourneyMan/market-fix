import type { OpenStatus, WeekDay, WorkingHours, WorkingHoursEntry } from '@/types';
import { getWeekdayFull } from './format';

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getEntryForDay(hours: WorkingHours, day: WeekDay) {
  return hours.find((entry) => entry.day === day);
}

/**
 * Открыто ли заведение в конкретный момент.
 * Учитывает работу после полуночи (isOvernight): проверяем и «вчерашнюю» смену.
 */
export function getOpenStatus(hours: WorkingHours, now = new Date()): OpenStatus {
  const day = now.getDay() as WeekDay;
  const prevDay = ((day + 6) % 7) as WeekDay;
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = getEntryForDay(hours, day);
  const yesterday = getEntryForDay(hours, prevDay);

  // Смена, начавшаяся вчера и не закончившаяся до полуночи.
  if (yesterday && !yesterday.isClosed && yesterday.isOvernight) {
    const closes = toMinutes(yesterday.closesAt);
    if (minutesNow < closes) {
      return {
        isOpen: true,
        label: `Открыто до ${yesterday.closesAt}`,
        closesAt: yesterday.closesAt,
        closingSoon: closes - minutesNow <= 60,
      };
    }
  }

  if (!today || today.isClosed) {
    const next = findNextOpening(hours, day);
    return {
      isOpen: false,
      label: next ? `Откроется ${next.label}` : 'Закрыто',
      opensAt: next?.opensAt,
      closingSoon: false,
    };
  }

  const opens = toMinutes(today.opensAt);
  const closes = today.isOvernight ? toMinutes(today.closesAt) + 24 * 60 : toMinutes(today.closesAt);

  if (minutesNow < opens) {
    return {
      isOpen: false,
      label: `Откроется в ${today.opensAt}`,
      opensAt: today.opensAt,
      closingSoon: false,
    };
  }

  if (minutesNow >= closes) {
    const next = findNextOpening(hours, day);
    return {
      isOpen: false,
      label: next ? `Откроется ${next.label}` : 'Закрыто',
      opensAt: next?.opensAt,
      closingSoon: false,
    };
  }

  return {
    isOpen: true,
    label: `Открыто до ${today.closesAt}`,
    closesAt: today.closesAt,
    closingSoon: closes - minutesNow <= 60,
  };
}

function findNextOpening(hours: WorkingHours, fromDay: WeekDay) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = ((fromDay + offset) % 7) as WeekDay;
    const entry = getEntryForDay(hours, day);
    if (entry && !entry.isClosed) {
      const label =
        offset === 1
          ? `завтра в ${entry.opensAt}`
          : `в ${getWeekdayFull(day).toLowerCase()} в ${entry.opensAt}`;
      return { label, opensAt: entry.opensAt };
    }
  }
  return null;
}

/** Работает ли заведение в этот день недели (фильтр «Сегодня открыто»). */
export function isWorkingOnDay(hours: WorkingHours, day: WeekDay) {
  const entry = getEntryForDay(hours, day);
  return Boolean(entry && !entry.isClosed);
}

/** Часы работы, сгруппированные подряд идущими днями: «Пн–Чт 10:00–23:00». */
export function groupWorkingHours(hours: WorkingHours) {
  const ordered: WorkingHoursEntry[] = [1, 2, 3, 4, 5, 6, 0]
    .map((day) => getEntryForDay(hours, day as WeekDay))
    .filter((entry): entry is WorkingHoursEntry => Boolean(entry));

  const groups: { days: WeekDay[]; entry: WorkingHoursEntry }[] = [];
  ordered.forEach((entry) => {
    const last = groups[groups.length - 1];
    const sameSchedule =
      last &&
      last.entry.isClosed === entry.isClosed &&
      last.entry.opensAt === entry.opensAt &&
      last.entry.closesAt === entry.closesAt;
    if (sameSchedule) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], entry });
    }
  });
  return groups;
}

/** Список слотов бронирования внутри рабочего дня, шаг 30 минут. */
export function getSlotTimes(entry: WorkingHoursEntry, stepMinutes = 30) {
  if (entry.isClosed) return [];
  const opens = toMinutes(entry.opensAt);
  const rawCloses = entry.isOvernight
    ? toMinutes(entry.closesAt) + 24 * 60
    : toMinutes(entry.closesAt);
  // Последний стол сажаем не позже чем за час до закрытия.
  const closes = rawCloses - 60;

  const slots: string[] = [];
  for (let minutes = opens; minutes <= closes; minutes += stepMinutes) {
    const normalized = minutes % (24 * 60);
    const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
    const mm = String(normalized % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/** Час пик — 19:00–21:30. Помечаем слоты как популярные. */
export function isPeakTime(time: string) {
  const minutes = toMinutes(time);
  return minutes >= 19 * 60 && minutes <= 21 * 60 + 30;
}

export { toMinutes };
