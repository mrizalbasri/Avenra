<script lang="ts">
  import { useI18n } from '#lib/i18n/context.js';
  const { t } = useI18n();
  const checks = [
    'method.checks.1',
    'method.checks.2',
    'method.checks.3',
    'method.checks.4',
    'method.checks.5',
  ] as const;
</script>

<svelte:head><title>{t('method.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('method.heading')}</h1>
    <p>{t('method.lead')}</p>
  </div>
</div>
<div class="reading-column">
  <section class="panel">
    <h2>{t('method.own.heading')}</h2>
    <p>{t('method.own.p1')}</p>
    <p>{t('method.own.p2')}</p>
    <a href="/start" class="button">{t('method.own.link')}</a>
  </section>
  <section class="panel">
    <h2>{t('method.synthetic.heading')}</h2>
    <p>{t('method.synthetic.p1')}</p>
    <p>
      {t('method.synthetic.source_a')}<code
        >backend/app/fixtures/demo-curriculum.json</code
      >{t('method.synthetic.source_b')}
    </p>
  </section>
  <section class="panel">
    <h2>{t('method.checks.heading')}</h2>
    <ul>
      {#each checks as key}<li>{t(key)}</li>{/each}
    </ul>
    <p>{t('method.checks.note')}</p>
  </section>
  <section class="panel">
    <h2>{t('method.budget.heading')}</h2>
    <p>{t('method.budget.p1')}</p>
    <p>{t('method.budget.p2')}</p>
  </section>
  <section class="panel">
    <h2>{t('method.recovery.heading')}</h2>
    <p>{t('method.recovery.p1')}</p>
    <p>{t('method.recovery.p2')}</p>
    <p>{t('method.recovery.p3')}</p>
  </section>
  <section class="panel">
    <h2>{t('method.learning.heading')}</h2>
    <p>{t('method.learning.p1')}</p>
  </section>
  <section class="panel">
    <h2>{t('method.privacy.heading')}</h2>
    <p>{t('method.privacy.p1')}</p>
    <p>{t('method.privacy.p2')}</p>
  </section>
  <section class="panel">
    <h2>{t('method.tech.heading')}</h2>
    <p>{t('method.tech.p1')}</p>
  </section>
</div>
