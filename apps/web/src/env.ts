import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  API_BASE_URL: {
    schema: (value) => {
      const url = new URL(value ?? 'http://127.0.0.1:18080');
      if (!['http:', 'https:'].includes(url.protocol))
        throw new Error('API_BASE_URL must use HTTP or HTTPS');
      return url.origin;
    },
  },
});
