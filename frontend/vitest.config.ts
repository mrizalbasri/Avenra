import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests cover pure TypeScript in src/lib, so the SvelteKit plugin is not needed.
export default defineConfig({
  resolve: {
    alias: { '#lib': fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
