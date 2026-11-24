<script lang="ts">
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import { useI18n } from '#lib/i18n/context.js';

  const { t } = useI18n();
  const steps = $derived([
    {
      title: t('landing.steps.s1_title'),
      copy: t('landing.steps.s1_copy'),
    },
    {
      title: t('landing.steps.s2_title'),
      copy: t('landing.steps.s2_copy'),
    },
    {
      title: t('landing.steps.s3_title'),
      copy: t('landing.steps.s3_copy'),
    },
    {
      title: t('landing.steps.s4_title'),
      copy: t('landing.steps.s4_copy'),
    },
  ]);
</script>

<section
  id="getting-started"
  class="content-two"
  aria-labelledby="getting-started-title"
>
  <div class="content-grid">
    <div class="content-heading">
      <h2 id="getting-started-title">
        {t('landing.steps.heading')}
      </h2>
      <a href="/start"
        >{t('landing.steps.cta')}<ArrowUpRight
          size={16}
          aria-hidden="true"
        /></a
      >
    </div>
    <div class="content-body">
      <p class="introduction">
        {t('landing.steps.intro')}
      </p>
      <ol>
        {#each steps as step, index (index)}
          <li>
            <span class="step-number" aria-hidden="true"
              >{String(index + 1).padStart(2, '0')}</span
            >
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </li>
        {/each}
      </ol>
      <p class="assumptions">
        {t('landing.steps.assumptions')}
        <a href="/methodology"
          >{t('landing.steps.assumptions_link')}<ArrowUpRight
            size={13}
            aria-hidden="true"
          /></a
        >
      </p>
    </div>
  </div>
</section>

<style>
  .content-two {
    max-width: 1280px;
    margin: auto;
    padding: 80px 40px 96px;
    scroll-margin-top: 32px;
  }
  .content-grid {
    border-top: 1px solid var(--border);
    padding-top: 64px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
  }
  h2 {
    max-width: 440px;
    font-size: clamp(32px, 3.4vw, 48px);
    line-height: 1.15;
    font-weight: 500;
    letter-spacing: -0.035em;
    text-wrap: balance;
    margin: 0;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: var(--text-primary);
  }
  a:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .content-heading > a {
    margin-top: 28px;
    font-size: 13px;
    line-height: 1.7;
  }
  .introduction {
    font-size: 17px;
    line-height: 1.8;
    color: #b4b4bd;
    margin: 0;
    text-wrap: pretty;
  }
  ol {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px 28px;
    list-style: none;
    margin: 40px 0 0;
    padding: 0;
  }
  .step-number {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    margin-bottom: 12px;
  }
  h3 {
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    margin: 0 0 10px;
  }
  li p {
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-secondary);
    margin: 0;
    text-wrap: pretty;
  }
  .assumptions {
    border-top: 1px solid var(--border);
    padding-top: 22px;
    margin: 32px 0 0;
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1.8;
  }
  .assumptions a {
    margin-top: 6px;
  }
  @media (max-width: 900px) {
    .content-grid {
      gap: 40px;
    }
    ol {
      grid-template-columns: 1fr;
      gap: 28px;
    }
  }
  @media (max-width: 720px) {
    .content-two {
      padding: 32px 24px 56px;
    }
    .content-grid {
      grid-template-columns: 1fr;
      gap: 32px;
      padding-top: 40px;
    }
    h2 {
      font-size: 34px;
    }
    .introduction {
      font-size: 16px;
    }
    ol {
      margin-top: 32px;
    }
  }
</style>
