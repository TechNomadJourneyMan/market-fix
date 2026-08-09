import type { OpenStatus } from '@/types';
import type { Translator } from '@/i18n/translate';

/**
 * Локализованная подпись статуса работы.
 *
 * `getOpenStatus` из `lib/hours.ts` возвращает готовый русский `label` — он нужен
 * местам, у которых нет доступа к переводчику. Здесь подпись собирается заново
 * из структурных полей, поэтому её можно показывать на любой локали.
 * Ключи адресуются с префиксом namespace, чтобы функция работала с любым `t`.
 */
export function getOpenStatusLabel(status: OpenStatus, t: Translator): string {
  if (status.isOpen) {
    return status.closesAt
      ? t('venue:status.openUntil', { time: status.closesAt })
      : t('common:labels.openNow');
  }
  return status.opensAt
    ? t('venue:status.opensAt', { time: status.opensAt })
    : t('venue:status.closed');
}
