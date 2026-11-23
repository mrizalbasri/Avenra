<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { useI18n } from '#lib/i18n/context.js';
  import { locales, writeLocaleCookie, type Locale } from '#lib/i18n/index.js';

  let { class: className = '' }: { class?: string } = $props();
  const { t, locale } = useI18n();

  async function choose(next: Locale) {
    if (next === locale()) return;
    writeLocaleCookie(next);
    await invalidateAll();
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
      aria-pressed={locale() === code}
      onclick={() => choose(code)}>{code.toUpperCase()}</button
    >
  {/each}
</div>
