<script lang="ts">
  import { page } from '$app/state';
  import { useI18n } from '#lib/i18n/context.js';
  const { t } = useI18n();
</script>

<svelte:head><title>{t('errorpage.title')}</title></svelte:head>
<section class="empty-panel">
  <h1>
    {page.status === 404 ? t('errorpage.not_found') : t('errorpage.generic')}
  </h1>
  <p>
    {page.error?.message ?? t('errorpage.hint')}
  </p>
  <a href="/" class="button primary">{t('errorpage.back')}</a>
</section>
