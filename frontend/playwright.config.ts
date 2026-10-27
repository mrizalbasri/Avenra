import { defineConfig, devices } from '@playwright/test';
import { apiOrigin, apiPort, webOrigin, webPort } from './tests/services';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: webOrigin, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `uv --directory ../backend run uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      env: { CORS_ORIGINS: JSON.stringify([webOrigin]) },
      url: `${apiOrigin}/health/live`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm build && node build',
      env: {
        PUBLIC_API_BASE_URL: apiOrigin,
        HOST: '127.0.0.1',
        PORT: webPort,
        ORIGIN: webOrigin,
      },
      url: webOrigin,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
