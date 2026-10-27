import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_API_BASE_URL: {
    public: true,
    schema: (value) => {
      const url = new URL(value ?? 'http://127.0.0.1:18080');
      if (!['http:', 'https:'].includes(url.protocol))
        throw new Error('PUBLIC_API_BASE_URL must use HTTP or HTTPS');
      return url.origin;
    },
  },
});
