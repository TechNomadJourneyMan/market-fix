import { cookies } from 'next/headers';

import { LOCALE_COOKIE, normalizeLocale, type Locale } from './config';
import { getDictionary } from './dictionaries';
import { createTranslator, type Translator } from './translate';

/** Активная локаль из куки. Для гостя без куки — русский. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Переводчик для server components и generateMetadata. */
export async function getTranslator(namespace?: string): Promise<Translator> {
  const locale = await getLocale();
  return createTranslator(getDictionary(locale), locale, namespace);
}

/** Локаль + словарь для передачи в клиентский провайдер. */
export async function getI18nBootstrap() {
  const locale = await getLocale();
  return { locale, dictionary: getDictionary(locale) };
}
