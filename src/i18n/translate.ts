import { INTL_LOCALES, type Locale } from './config';

export type DictionaryValue = string | string[] | { [key: string]: DictionaryValue };
export type Dictionary = Record<string, DictionaryValue>;

export type TranslationVars = Record<string, string | number>;

export interface Translator {
  (key: string, vars?: TranslationVars): string;
  /** Массив строк — для списков (features, tips). */
  list: (key: string) => string[];
  /** Есть ли ключ в словаре — удобно для опциональных подписей. */
  has: (key: string) => boolean;
  locale: Locale;
}

const PLURAL_KEYS = ['zero', 'one', 'two', 'few', 'many', 'other'];

function lookup(dict: Dictionary, path: string): DictionaryValue | undefined {
  let current: DictionaryValue | undefined = dict;
  for (const part of path.split('.')) {
    if (current === undefined || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, DictionaryValue>)[part];
  }
  return current;
}

function interpolate(template: string, vars?: TranslationVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

function isPluralGroup(value: DictionaryValue): value is Record<string, DictionaryValue> {
  return (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).some((key) => PLURAL_KEYS.includes(key))
  );
}

/**
 * Создаёт функцию перевода для конкретного словаря.
 *
 * - `t('map.search.placeholder')` — вложенные ключи через точку.
 * - `t('map.results', { count: 12 })` — плюрализация через Intl.PluralRules
 *   (в ru/kk формы one/few/many учитываются автоматически).
 * - Если ключ не найден — возвращаем сам ключ, чтобы пропуск был заметен в UI,
 *   но интерфейс не падал.
 */
export function createTranslator(
  dictionary: Dictionary,
  locale: Locale,
  namespace?: string,
): Translator {
  const pluralRules = new Intl.PluralRules(INTL_LOCALES[locale]);

  const resolve = (key: string): DictionaryValue | undefined => {
    // Явное указание пространства имён: t('common:actions.save')
    if (key.includes(':')) {
      const [ns, rest] = key.split(':');
      return lookup(dictionary, `${ns}.${rest}`);
    }
    if (namespace) {
      const scoped = lookup(dictionary, `${namespace}.${key}`);
      if (scoped !== undefined) return scoped;
    }
    return lookup(dictionary, key);
  };

  const translate = ((key: string, vars?: TranslationVars) => {
    const value = resolve(key);

    if (typeof value === 'string') return interpolate(value, vars);

    if (value !== undefined && isPluralGroup(value) && vars?.count !== undefined) {
      const count = Number(vars.count);
      const category = pluralRules.select(count);
      const form =
        (value[category] as string | undefined) ??
        (value.other as string | undefined) ??
        (value.many as string | undefined) ??
        (value.one as string | undefined);
      if (typeof form === 'string') return interpolate(form, vars);
    }

    return key;
  }) as Translator;

  translate.list = (key: string) => {
    const value = resolve(key);
    return Array.isArray(value) ? value : [];
  };

  translate.has = (key: string) => resolve(key) !== undefined;

  translate.locale = locale;

  return translate;
}
