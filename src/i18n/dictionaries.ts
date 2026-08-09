import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';
import type { Dictionary, DictionaryValue } from './translate';

import ruCommon from './dictionaries/ru/common.json';
import ruNavigation from './dictionaries/ru/navigation.json';
import ruMap from './dictionaries/ru/map.json';
import ruErrors from './dictionaries/ru/errors.json';
import ruHome from './dictionaries/ru/home.json';
import ruCatalog from './dictionaries/ru/catalog.json';
import ruVenue from './dictionaries/ru/venue.json';
import ruBooking from './dictionaries/ru/booking.json';
import ruServices from './dictionaries/ru/services.json';
import ruCart from './dictionaries/ru/cart.json';
import ruAuth from './dictionaries/ru/auth.json';
import ruAccount from './dictionaries/ru/account.json';
import ruAi from './dictionaries/ru/ai.json';
import ruMerge from './dictionaries/ru/merge.json';
import ruBusiness from './dictionaries/ru/business.json';
import ruLayout from './dictionaries/ru/layout.json';

import enCommon from './dictionaries/en/common.json';
import enNavigation from './dictionaries/en/navigation.json';
import enMap from './dictionaries/en/map.json';
import enErrors from './dictionaries/en/errors.json';
import enHome from './dictionaries/en/home.json';
import enCatalog from './dictionaries/en/catalog.json';
import enVenue from './dictionaries/en/venue.json';
import enBooking from './dictionaries/en/booking.json';
import enServices from './dictionaries/en/services.json';
import enCart from './dictionaries/en/cart.json';
import enAuth from './dictionaries/en/auth.json';
import enAccount from './dictionaries/en/account.json';
import enAi from './dictionaries/en/ai.json';
import enMerge from './dictionaries/en/merge.json';
import enBusiness from './dictionaries/en/business.json';
import enLayout from './dictionaries/en/layout.json';

import kkCommon from './dictionaries/kk/common.json';
import kkNavigation from './dictionaries/kk/navigation.json';
import kkMap from './dictionaries/kk/map.json';
import kkErrors from './dictionaries/kk/errors.json';
import kkHome from './dictionaries/kk/home.json';
import kkCatalog from './dictionaries/kk/catalog.json';
import kkVenue from './dictionaries/kk/venue.json';
import kkBooking from './dictionaries/kk/booking.json';
import kkServices from './dictionaries/kk/services.json';
import kkCart from './dictionaries/kk/cart.json';
import kkAuth from './dictionaries/kk/auth.json';
import kkAccount from './dictionaries/kk/account.json';
import kkAi from './dictionaries/kk/ai.json';
import kkMerge from './dictionaries/kk/merge.json';
import kkBusiness from './dictionaries/kk/business.json';
import kkLayout from './dictionaries/kk/layout.json';

/**
 * Реестр словарей. Чтобы добавить пространство имён:
 * 1) создать `dictionaries/<locale>/<namespace>.json` для всех локалей,
 * 2) добавить импорт и поле ниже.
 *
 * Namespace = имя файла, ключи внутри адресуются через точку:
 * `t('map:controls.zoomIn')` или `useT('map')` → `t('controls.zoomIn')`.
 */
const RAW: Record<Locale, Dictionary> = {
  ru: {
    common: ruCommon as DictionaryValue,
    navigation: ruNavigation as DictionaryValue,
    map: ruMap as DictionaryValue,
    errors: ruErrors as DictionaryValue,
    home: ruHome as DictionaryValue,
    catalog: ruCatalog as DictionaryValue,
    venue: ruVenue as DictionaryValue,
    booking: ruBooking as DictionaryValue,
    services: ruServices as DictionaryValue,
    cart: ruCart as DictionaryValue,
    auth: ruAuth as DictionaryValue,
    account: ruAccount as DictionaryValue,
    ai: ruAi as DictionaryValue,
    merge: ruMerge as DictionaryValue,
    business: ruBusiness as DictionaryValue,
    layout: ruLayout as DictionaryValue,
  },
  en: {
    common: enCommon as DictionaryValue,
    navigation: enNavigation as DictionaryValue,
    map: enMap as DictionaryValue,
    errors: enErrors as DictionaryValue,
    home: enHome as DictionaryValue,
    catalog: enCatalog as DictionaryValue,
    venue: enVenue as DictionaryValue,
    booking: enBooking as DictionaryValue,
    services: enServices as DictionaryValue,
    cart: enCart as DictionaryValue,
    auth: enAuth as DictionaryValue,
    account: enAccount as DictionaryValue,
    ai: enAi as DictionaryValue,
    merge: enMerge as DictionaryValue,
    business: enBusiness as DictionaryValue,
    layout: enLayout as DictionaryValue,
  },
  kk: {
    common: kkCommon as DictionaryValue,
    navigation: kkNavigation as DictionaryValue,
    map: kkMap as DictionaryValue,
    errors: kkErrors as DictionaryValue,
    home: kkHome as DictionaryValue,
    catalog: kkCatalog as DictionaryValue,
    venue: kkVenue as DictionaryValue,
    booking: kkBooking as DictionaryValue,
    services: kkServices as DictionaryValue,
    cart: kkCart as DictionaryValue,
    auth: kkAuth as DictionaryValue,
    account: kkAccount as DictionaryValue,
    ai: kkAi as DictionaryValue,
    merge: kkMerge as DictionaryValue,
    business: kkBusiness as DictionaryValue,
    layout: kkLayout as DictionaryValue,
  },
};

function deepMerge(base: Dictionary, override: Dictionary): Dictionary {
  const result: Dictionary = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = deepMerge(current as Dictionary, value as Dictionary) as DictionaryValue;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Готовые словари: en/kk накладываются на ru.
 * Так недопереведённый ключ показывает русский текст, а не служебный id.
 */
const RESOLVED: Record<Locale, Dictionary> = LOCALES.reduce(
  (acc, locale) => {
    acc[locale] =
      locale === DEFAULT_LOCALE
        ? RAW[DEFAULT_LOCALE]
        : deepMerge(RAW[DEFAULT_LOCALE], RAW[locale]);
    return acc;
  },
  {} as Record<Locale, Dictionary>,
);

export function getDictionary(locale: Locale): Dictionary {
  return RESOLVED[locale] ?? RESOLVED[DEFAULT_LOCALE];
}
