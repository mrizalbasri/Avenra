import { getContext, setContext } from 'svelte';
import { translate, type Locale, type Translate } from './index.js';
import { createMessages, type Messages } from './messages.js';

const contextKey = Symbol('avenra-i18n');
type I18n = { locale: () => Locale };

// The getter keeps `t` reactive: it reads layout data each time it is called.
export function provideI18n(locale: () => Locale): void {
  setContext<I18n>(contextKey, { locale });
}

export function useI18n(): {
  t: Translate;
  locale: () => Locale;
  msg: Messages;
} {
  // The error page can render outside the layout, so fall back to English there.
  const locale =
    getContext<I18n | undefined>(contextKey)?.locale ?? (() => 'en' as const);
  return {
    t: (key, params) => translate(locale(), key, params),
    locale,
    msg: createMessages(locale),
  };
}
