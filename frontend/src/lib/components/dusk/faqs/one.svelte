<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '#lib/components/ui/accordion/index.js';
  import { useI18n } from '#lib/i18n/context.js';

  const { t } = useI18n();
  function reveal(node: HTMLElement) {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (preference.matches) return;
        animation = node.animate(
          [
            {
              opacity: 0,
              transform: 'translateY(16px)',
              clipPath: 'inset(12px 0 0)',
            },
            { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' },
          ],
          { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        );
      },
      { threshold: 0.12 },
    );
    const reduceMotion = () => {
      if (preference.matches) animation?.cancel();
    };
    preference.addEventListener('change', reduceMotion);
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
        animation?.cancel();
        preference.removeEventListener('change', reduceMotion);
      },
    };
  }
  const faqItems = $derived([
    {
      id: 'faq-campuses',
      question: t('landing.faq.q1'),
      answer: t('landing.faq.a1'),
    },
    {
      id: 'faq-rules',
      question: t('landing.faq.q2'),
      answer: t('landing.faq.a2'),
    },
    {
      id: 'faq-approval',
      question: t('landing.faq.q3'),
      answer: t('landing.faq.a3'),
    },
    {
      id: 'faq-scenarios',
      question: t('landing.faq.q4'),
      answer: t('landing.faq.a4'),
    },
    {
      id: 'faq-storage',
      question: t('landing.faq.q5'),
      answer: t('landing.faq.a5'),
    },
    {
      id: 'faq-demo',
      question: t('landing.faq.q6'),
      answer: t('landing.faq.a6'),
    },
  ]);
</script>

<section id="faqs" class="faq-section" aria-labelledby="faq-title">
  <div class="faq-stack" use:reveal>
    <div class="faq-heading">
      <h2 id="faq-title">
        {t('landing.faq.title_1')}<br />{t('landing.faq.title_2')}
      </h2>
      <p>{t('landing.faq.subtitle')}</p>
    </div>
    <div class="faq-answers">
      <Accordion type="single" value="faq-campuses">
        {#each faqItems as item (item.id)}
          <AccordionItem value={item.id}>
            <AccordionTrigger class="cursor-pointer hover:no-underline"
              ><span class="question-label">{item.question}</span><span
                class="faq-toggle"
                aria-hidden="true"
                ><svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.3"
                  ><path d="M3 8h10" /><path
                    class="toggle-vertical"
                    d="M8 3v10"
                  /></svg
                ></span
              ></AccordionTrigger
            >
            <AccordionContent><p>{item.answer}</p></AccordionContent>
          </AccordionItem>
        {/each}
      </Accordion>
      <p class="faq-more">
        {t('landing.faq.more_prefix')}
        <a href="/methodology">{t('landing.faq.more_link')}</a>.
      </p>
    </div>
  </div>
</section>

<style>
  .faq-section {
    max-width: 1280px;
    margin: auto;
    padding: 0 40px 100px;
    scroll-margin-top: 32px;
  }
  .faq-stack {
    border-top: 1px solid var(--border);
    padding-top: 72px;
  }
  .faq-heading {
    text-align: center;
    margin: 0 auto 40px;
  }
  h2 {
    margin: 0;
    font-size: clamp(36px, 4vw, 52px);
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: -0.035em;
  }
  .faq-heading p {
    max-width: 430px;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.8;
    margin: 22px auto 0;
  }
  .faq-answers {
    max-width: 760px;
    margin: auto;
  }
  .faq-answers :global([data-slot='accordion-item']) {
    border-color: var(--border);
    transition: background-color 220ms ease;
  }
  .faq-answers :global([data-slot='accordion-item'][data-state='open']) {
    background: #141416;
  }
  .faq-answers :global([data-slot='accordion-trigger']) {
    padding: 22px 20px;
    min-height: 76px;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.6;
    gap: 24px;
    border-radius: 2px;
    align-items: center;
    transition:
      color 180ms ease,
      background-color 180ms ease;
  }
  .faq-answers :global([data-slot='accordion-trigger']:hover) {
    background: #19191c;
  }
  .question-label {
    flex: 1;
  }
  .faq-answers :global([data-slot='accordion-trigger-icon']) {
    display: none;
  }
  .faq-toggle {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border: 1px solid #51515a;
    border-radius: 50%;
    color: #d4d4d8;
    transition:
      background-color 220ms ease,
      color 220ms ease;
  }
  .toggle-vertical {
    transform-origin: center;
    transition:
      transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity 180ms ease;
  }
  :global([aria-expanded='true']) .faq-toggle {
    color: #09090b;
    background: #f5f5f7;
    border-color: #f5f5f7;
  }
  :global([aria-expanded='true']) .toggle-vertical {
    transform: rotate(90deg);
    opacity: 0;
  }
  .faq-answers :global([data-slot='accordion-content'][data-state='open']) {
    animation: faq-expand 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .faq-answers :global([data-slot='accordion-content'][data-state='closed']) {
    animation: faq-collapse 220ms cubic-bezier(0.4, 0, 1, 1);
  }
  .faq-answers :global([data-slot='accordion-content'] p) {
    font-size: 14px;
    line-height: 1.85;
    color: #b4b4bd;
    margin: 0;
    padding: 0 74px 18px 20px;
  }
  .faq-more {
    margin: 28px 20px 0;
    text-align: center;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.8;
  }
  a {
    color: var(--text-primary);
    text-underline-offset: 4px;
  }
  @keyframes faq-expand {
    from {
      height: 0;
      opacity: 0.3;
    }
    to {
      height: var(--bits-accordion-content-height);
      opacity: 1;
    }
  }
  @keyframes faq-collapse {
    from {
      height: var(--bits-accordion-content-height);
      opacity: 1;
    }
    to {
      height: 0;
      opacity: 0;
    }
  }
  @media (max-width: 720px) {
    .faq-section {
      padding: 0 24px 56px;
    }
    .faq-stack {
      padding-top: 48px;
    }
    .faq-heading {
      margin-bottom: 30px;
    }
    h2 {
      font-size: 38px;
    }
    .faq-heading p {
      font-size: 13px;
    }
    .faq-answers :global([data-slot='accordion-trigger']) {
      padding: 20px 12px;
      font-size: 14px;
      gap: 14px;
    }
    .faq-answers :global([data-slot='accordion-content'] p) {
      font-size: 13px;
      padding: 0 20px 16px 12px;
    }
    .faq-toggle {
      width: 26px;
      height: 26px;
    }
    .faq-more {
      margin-inline: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .faq-answers :global([data-slot='accordion-content']),
    .faq-answers :global([data-slot='accordion-trigger']),
    .faq-answers :global([data-slot='accordion-item']),
    .faq-toggle,
    .toggle-vertical {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
