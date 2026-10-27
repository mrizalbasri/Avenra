import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({
      // SvelteKit 3 uses paths.origin at build time, not adapter-node's old ORIGIN.
      paths: {
        origin: loadEnv(mode, '.', 'ORIGIN').ORIGIN || undefined,
      },
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },

      adapter: adapter(),
    }),
  ],
}));
