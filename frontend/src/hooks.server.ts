import { localeCookie, parseLocale } from '#lib/i18n/index.js';
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
  const locale = parseLocale(event.cookies.get(localeCookie));
  event.locals.locale = locale;
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', locale),
  });
};
