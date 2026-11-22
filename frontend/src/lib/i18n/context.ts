import { getContext, setContext } from 'svelte';
import { translate, type Locale, type Translate } from './index.js';

const contextKey = Symbol('avenra-i18n');
type I18n = { locale: () => Locale };

// The getter keeps `t` reactive: it reads layout data each time it is called.
export function provideI18n(locale: () => Locale): void {
  setContext<I18n>(contextKey, { locale });
}

export function useI18n(): { t: Translate; locale: () => Locale } {
  const { locale } = getContext<I18n>(contextKey);
  return { t: (key, params) => translate(locale(), key, params), locale };
}
