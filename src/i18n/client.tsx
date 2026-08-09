'use client';

import * as React from 'react';

import {
  DEFAULT_LOCALE,
  INTL_LOCALES,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  type Locale,
} from './config';
import { createTranslator, type Dictionary, type Translator } from './translate';

interface I18nContextValue {
  locale: Locale;
  dictionary: Dictionary;
  /** BCP 47 тег для Intl. */
  intlLocale: string;
  isSwitching: boolean;
  setLocale: (locale: Locale) => void;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}

/**
 * Провайдер локали. Словарь приходит с сервера уже сведённым (en/kk поверх ru),
 * поэтому в браузер уезжает только активный язык.
 *
 * Переключение языка ставит куку и перезагружает страницу: маршрут
 * сохраняется, а все server components гарантированно получают новую локаль.
 */
export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  const [isSwitching, startTransition] = React.useTransition();

  const setLocale = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = next;
      // Полная перезагрузка гарантирует, что все server components
      // перечитают куку. router.refresh() в App Router иногда отдаёт
      // закэшированный RSC-пейлоад со старой локалью.
      startTransition(() => {
        window.location.reload();
      });
    },
    [locale, startTransition],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      dictionary,
      intlLocale: INTL_LOCALES[locale],
      isSwitching,
      setLocale,
    }),
    [locale, dictionary, isSwitching, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (context) return context;
  // Fallback, если компонент отрендерен вне провайдера (изолированный тест, storybook).
  return {
    locale: DEFAULT_LOCALE,
    dictionary: {},
    intlLocale: INTL_LOCALES[DEFAULT_LOCALE],
    isSwitching: false,
    setLocale: () => {},
  };
}

export function useLocale(): Locale {
  return useI18nContext().locale;
}

export function useLocaleSwitcher() {
  const { locale, isSwitching, setLocale } = useI18nContext();
  return { locale, isSwitching, setLocale };
}

/**
 * Хук перевода для клиентских компонентов.
 * `const t = useT('map'); t('controls.zoomIn')`
 */
export function useT(namespace?: string): Translator {
  const { dictionary, locale } = useI18nContext();
  return React.useMemo(
    () => createTranslator(dictionary, locale, namespace),
    [dictionary, locale, namespace],
  );
}
