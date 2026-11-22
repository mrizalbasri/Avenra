import { en, type MessageKey } from './en.js';
import { id } from './id.js';

export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeCookie = 'avenra_locale';

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, id };

type PluralSuffix = '.one' | '.other';
type StripPlural<K> = K extends `${infer B}${PluralSuffix}` ? B : K;
export type TranslationKey = StripPlural<MessageKey>;
export type Params = Record<string, string | number>;
export type Translate = (key: TranslationKey, params?: Params) => string;

export function parseLocale(value: unknown): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params: Params = {},
): string {
  const dict = dictionaries[locale];
  let messageKey = key as string;
  if (typeof params.count === 'number') {
    const rule = new Intl.PluralRules(locale).select(params.count);
    messageKey = `${key}.${rule === 'one' ? 'one' : 'other'}`;
  }
  const message = (dict as Record<string, string>)[messageKey] ?? messageKey;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

// A switch rewrites the cookie; callers then invalidate load data so the server re-renders.
export function writeLocaleCookie(locale: Locale): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${localeCookie}=${locale}; Path=/; SameSite=Strict; Max-Age=31536000${secure}`;
}
