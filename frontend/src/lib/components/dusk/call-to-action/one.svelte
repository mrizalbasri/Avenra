<script lang="ts">
  import Button from '#lib/components/ui/dusk/button/button.svelte';
  import { useI18n } from '#lib/i18n/context.js';

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

<section class="py-16 md:py-20" aria-labelledby="closing-cta-title">
  <div class="mx-auto max-w-7xl px-6">
    <div class="mx-auto max-w-4xl text-center">
      <h2
        id="closing-cta-title"
        class="text-4xl font-medium tracking-tight text-balance lg:text-5xl xl:text-6xl"
      >
        {t('landing.cta.heading')}
      </h2>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" disabled={disabled || busy} onclick={onOpen}>
          {busy
            ? t('landing.hero.opening')
            : hasProfile
              ? t('landing.hero.open_yours')
              : t('landing.hero.open_demo')}
          <span aria-hidden="true">↗</span>
        </Button>

        <Button size="lg" variant="outline" href="/start"
          >{t('landing.cta.use_curriculum')}</Button
        >
      </div>
    </div>
  </div>
</section>

<style>
  h2 {
    margin: 0;
    font-size: clamp(36px, 4.5vw, 60px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.045em;
    text-wrap: balance;
  }
</style>
