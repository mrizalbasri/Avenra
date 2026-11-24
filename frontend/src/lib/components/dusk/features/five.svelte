<script lang="ts">
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import canvas from '#lib/assets/feature-canvas.png';
  import recovery from '#lib/assets/feature-recovery.png';
  import comparison from '#lib/assets/feature-compare.png';
  import study from '#lib/assets/feature-study.png';
  import { useI18n } from '#lib/i18n/context.js';

  const { t } = useI18n();
  const featureIds = [
    'feature-canvas',
    'feature-recovery',
    'feature-compare',
    'feature-study',
  ] as const;
  type FeatureId = (typeof featureIds)[number];

  const features = $derived([
    {
      id: 'feature-canvas' as const,
      label: t('landing.features.canvas.label'),
      title: t('landing.features.canvas.title'),
      copy: t('landing.features.canvas.copy'),
      highlights: [
        t('landing.features.canvas.h1'),
        t('landing.features.canvas.h2'),
        t('landing.features.canvas.h3'),
      ],
      image: canvas,
      alt: t('landing.features.canvas.alt'),
      href: '/plans',
      action: t('landing.features.canvas.action'),
    },
    {
      id: 'feature-recovery' as const,
      label: t('landing.features.recovery.label'),
      title: t('landing.features.recovery.title'),
      copy: t('landing.features.recovery.copy'),
      highlights: [
        t('landing.features.recovery.h1'),
        t('landing.features.recovery.h2'),
        t('landing.features.recovery.h3'),
      ],
      image: recovery,
      alt: t('landing.features.recovery.alt'),
      href: '/methodology',
      action: t('landing.features.recovery.action'),
    },
    {
      id: 'feature-compare' as const,
      label: t('landing.features.compare.label'),
      title: t('landing.features.compare.title'),
      copy: t('landing.features.compare.copy'),
      highlights: [
        t('landing.features.compare.h1'),
        t('landing.features.compare.h2'),
        t('landing.features.compare.h3'),
      ],
      image: comparison,
      alt: t('landing.features.compare.alt'),
      href: '/compare',
      action: t('landing.features.compare.action'),
    },
    {
      id: 'feature-study' as const,
      label: t('landing.features.study.label'),
      title: t('landing.features.study.title'),
      copy: t('landing.features.study.copy'),
      highlights: [
        t('landing.features.study.h1'),
        t('landing.features.study.h2'),
        t('landing.features.study.h3'),
      ],
      image: study,
      alt: t('landing.features.study.alt'),
      href: '/study',
      action: t('landing.features.study.action'),
    },
  ]);
  let activeId = $state<FeatureId>('feature-canvas');

  onMount(() => {
    const sections = featureIds.map((id) => document.getElementById(id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const nextId = visible[0]?.target.id;
        if (nextId && featureIds.includes(nextId as FeatureId))
          activeId = nextId as FeatureId;
      },
      { rootMargin: '-15% 0px -45% 0px', threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  });
</script>

<section
  id="how-it-works"
  class="features-five"
  aria-labelledby="features-title"
>
  <div class="features-heading">
    <h2 id="features-title">
      {t('landing.features.title_1')}<br /><span
        >{t('landing.features.title_2')}</span
      >
    </h2>
    <p>{t('landing.features.subtitle')}</p>
  </div>
  <div class="features-layout">
    <nav class="feature-navigation" aria-label={t('landing.features.nav_aria')}>
      <span class="navigation-label">{t('landing.features.inside')}</span>
      <div class="feature-links">
        {#each features as feature (feature.id)}
          <a
            href={`#${feature.id}`}
            aria-current={activeId === feature.id ? 'location' : undefined}
            onclick={() => (activeId = feature.id)}
            >{feature.label}<ArrowUpRight size={14} aria-hidden="true" /></a
          >
        {/each}
      </div>
    </nav>
    <div class="feature-sections">
      {#each features as feature (feature.id)}
        <article id={feature.id} aria-labelledby={`${feature.id}-title`}>
          <div class="feature-copy">
            <h3 id={`${feature.id}-title`}>{feature.label}</h3>
            <p class="feature-description">
              <strong>{feature.title}</strong>
              {feature.copy}
            </p>
            <ul>
              {#each feature.highlights as highlight}<li>
                  <Check
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />{highlight}
                </li>{/each}
            </ul>
            <a class="feature-action" href={feature.href}
              >{feature.action}<ArrowUpRight size={15} aria-hidden="true" /></a
            >
          </div>
          <figure>
            <div class="feature-preview">
              <img
                src={feature.image}
                alt={feature.alt}
                width="1220"
                height="1080"
                loading="lazy"
                decoding="async"
              />
            </div>
          </figure>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .features-five {
    max-width: 1280px;
    margin: auto;
    padding: 100px 40px 96px;
    scroll-margin-top: 32px;
  }
  .features-heading h2 {
    max-width: 900px;
    font-size: clamp(30px, 3.3vw, 44px);
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.035em;
    margin: 0;
    text-wrap: balance;
  }
  .features-heading h2 span {
    color: var(--text-secondary);
  }
  .features-heading > p {
    margin: 24px 0 0;
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.7;
  }
  .features-layout {
    margin-top: 80px;
    display: grid;
    grid-template-columns: 184px minmax(0, 1fr);
    gap: 40px;
    align-items: start;
  }
  .feature-navigation {
    position: sticky;
    top: 32px;
  }
  .navigation-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 18px;
    padding-left: 12px;
  }
  .feature-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .feature-links a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    text-decoration: none;
    color: var(--text-secondary);
  }
  .feature-links a:hover {
    color: var(--text-primary);
    background: var(--surface-panel);
  }
  .feature-links a[aria-current] {
    color: var(--text-primary);
    background: var(--surface-raised);
  }
  .feature-links a :global(svg) {
    opacity: 0;
    flex-shrink: 0;
  }
  .feature-links a[aria-current] :global(svg),
  .feature-links a:hover :global(svg) {
    opacity: 1;
  }
  .feature-sections {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 100px;
  }
  article {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 28px;
    scroll-margin-top: 48px;
    align-items: center;
  }
  h3 {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    margin: 0 0 22px;
  }
  .feature-description {
    font-size: 16px;
    line-height: 1.75;
    color: var(--text-secondary);
    margin: 0;
    text-wrap: pretty;
  }
  .feature-description strong {
    color: var(--text-primary);
    font-weight: 500;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 28px 0 22px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    color: #c4c4cf;
    line-height: 1.5;
  }
  li :global(svg) {
    flex-shrink: 0;
    color: var(--text-secondary);
  }
  .feature-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    text-decoration: none;
    line-height: 1.6;
  }
  .feature-action:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  figure {
    margin: 0;
    min-width: 0;
  }
  .feature-preview {
    min-height: 280px;
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 16px;
    background: var(--surface-panel);
    border: 1px solid var(--border);
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
    object-position: top;
    border-radius: 6px;
  }
  @media (max-width: 1100px) {
    .features-layout {
      grid-template-columns: 160px minmax(0, 1fr);
      gap: 24px;
    }
    article {
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .feature-copy {
      max-width: 620px;
    }
  }
  @media (max-width: 720px) {
    .features-five {
      padding: 60px 24px;
    }
    .features-heading h2 {
      font-size: 30px;
    }
    .features-layout {
      display: block;
      margin-top: 32px;
    }
    .feature-navigation {
      top: 0;
      z-index: 3;
      background: var(--surface-base);
      padding: 12px 0;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
    }
    .navigation-label {
      display: none;
    }
    .feature-links {
      flex-direction: row;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .feature-links a {
      flex-shrink: 0;
      white-space: nowrap;
      padding: 11px 12px;
    }
    .feature-links a :global(svg) {
      display: none;
    }
    .feature-sections {
      gap: 64px;
    }
    article {
      scroll-margin-top: 90px;
    }
    .feature-description {
      font-size: 15px;
    }
    .feature-preview {
      min-height: 0;
      padding: 8px;
    }
  }
</style>
