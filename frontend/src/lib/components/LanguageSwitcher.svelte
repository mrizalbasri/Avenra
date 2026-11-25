<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { useI18n } from '#lib/i18n/context.js';
  import { locales, writeLocaleCookie, type Locale } from '#lib/i18n/index.js';

  let { class: className = '' }: { class?: string } = $props();
  const { t, locale } = useI18n();
  let hydrated = $state(false);
  let switching = $state(false);
  onMount(() => {
    hydrated = true;
  });

  async function choose(next: Locale) {
    if (next === locale() || switching) return;
    switching = true;
    try {
      writeLocaleCookie(next);
      await invalidateAll();
    } finally {
      switching = false;
    }
  }
</script>

<div
  class={`lang-switcher ${className}`}
  role="group"
  aria-label={t('lang.label')}
>
  {#each locales as code (code)}
    <button
      type="button"
      lang={code}
      disabled={!hydrated || switching}
      aria-pressed={locale() === code}
      onclick={() => choose(code)}>{code.toUpperCase()}</button
    >
  {/each}
</div>
