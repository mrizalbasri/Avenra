<script lang="ts">
  import { Button } from '#lib/components/ui/dusk/button/index.js';
  import Header from './header.svelte';
  import FaqsOne from '#lib/components/dusk/faqs/one.svelte';
  import ContentTwo from '#lib/components/dusk/content/two.svelte';
  import FeaturesFive from '#lib/components/dusk/features/five.svelte';
  import Footer from '#lib/components/dusk/footer/footer.svelte';
  import CallToActionOne from '#lib/components/dusk/call-to-action/one.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import preview from '#lib/assets/planning-preview.png';
  let {
    hasProfile = false,
    busy,
    disabled,
    onOpen,
  }: {
    hasProfile?: boolean;
    busy: boolean;
    disabled: boolean;
    onOpen: () => Promise<void>;
  } = $props();
  const { t } = useI18n();
</script>

<div class="landing">
  <Header />
  <section class="hero-six" aria-labelledby="hero-title">
    <div class="hero-copy">
      <a class="eyebrow" href="/methodology"
        ><span class="status-dot"></span>
        {t('landing.hero.eyebrow')}
        <span aria-hidden="true">↗</span></a
      >
      <div class="intro-grid">
        <h1 id="hero-title">
          {t('landing.hero.title_1')}<br /><span
            >{t('landing.hero.title_2')}</span
          >
        </h1>
        <div class="intro-description">
          <p>{t('landing.hero.body')}</p>
          <div class="hero-actions">
            <Button size="lg" disabled={disabled || busy} onclick={onOpen}
              >{busy
                ? t('landing.hero.opening')
                : hasProfile
                  ? t('landing.hero.open_yours')
                  : t('landing.hero.open_demo')}
              <span aria-hidden="true">↗</span></Button
            >
            <a href="/start">{t('landing.hero.use_curriculum')}</a>
          </div>
          <small>{t('landing.hero.no_account')}</small>
        </div>
      </div>
    </div>
    <div class="preview-stage">
      <div class="preview-window">
        <img
          src={preview}
          alt={t('landing.hero.preview_alt')}
          width="1440"
          height="1000"
          fetchpriority="high"
        />
      </div>
    </div>
  </section>
  <FeaturesFive />
  <ContentTwo />
  <FaqsOne />
  <CallToActionOne {hasProfile} {busy} {disabled} {onOpen} />
  <Footer />
</div>

<style>
  .landing {
    background: #09090b;
    color: #f5f5f7;
    min-height: 100vh;
  }
  .hero-six {
    overflow: hidden;
  }
  .hero-copy {
    max-width: 1280px;
    margin: auto;
    padding: 112px 24px 64px;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #b4b4bd;
    font-size: 12px;
    letter-spacing: 1px;
    text-decoration: none;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f5f5f7;
  }
  .intro-grid {
    margin-top: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 24px;
  }
  h1 {
    font-size: clamp(48px, 5.5vw, 76px);
    line-height: 1.06;
    font-weight: 500;
    letter-spacing: -0.055em;
    margin: 0;
  }
  h1 span {
    color: inherit;
  }
  .intro-description {
    max-width: 410px;
    margin-inline: auto;
    padding-bottom: 3px;
  }
  .intro-description p {
    font-size: 18px;
    color: #b4b4bd;
    line-height: 1.6;
    margin: 0 0 26px;
  }
  .hero-actions {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .hero-actions a {
    font-size: 13px;
    text-decoration: none;
  }
  small {
    display: block;
    color: #a1a1aa;
    font-size: 11px;
    margin-top: 16px;
  }
  .preview-stage {
    position: relative;
    width: calc(100% - 32px);
    max-width: 1280px;
    aspect-ratio: 16 / 9;
    margin: 0 auto;
    background:
      radial-gradient(ellipse at 12% 0%, #73737c 0%, transparent 58%),
      linear-gradient(125deg, #44444c, #b4b4bc 58%, #72727c);
    border-radius: 28px;
    overflow: hidden;
  }
  .preview-window {
    position: absolute;
    top: 64px;
    left: 64px;
    width: max(100%, 1024px);
    background: #111113;
    border: 1px solid #ffffff1a;
    padding: 8px;
    border-radius: 20px;
    box-shadow: 0 24px 70px #0006;
    overflow: hidden;
  }
  .preview-window img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 12px;
  }
  @media (max-width: 720px) {
    .hero-copy {
      padding: 56px 24px 40px;
    }
    .intro-grid {
      grid-template-columns: 1fr;
      gap: 28px;
      margin-top: 24px;
    }
    h1 {
      font-size: clamp(43px, 10vw, 65px);
    }
    .intro-description {
      max-width: none;
      margin-inline: 0;
    }
    .intro-description p {
      font-size: 16px;
    }
    .preview-stage {
      width: calc(100% - 16px);
      aspect-ratio: 1;
      border-radius: 24px;
    }
    .preview-window {
      top: 24px;
      left: 24px;
      width: 880px;
    }
  }
</style>
