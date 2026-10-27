<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from '#lib/components/ui/accordion/index.js';
  const faqItems = [
    {
      id: 'faq-campuses',
      question: "Can I use Avenra with my university's curriculum?",
      answer:
        'Yes, you can import a curriculum for your own university, program, and academic year. The current model supports required courses, simple prerequisites, credit limits, and odd/even semester offerings. Electives, GPA-based limits, transfer credits, and other special policies still need separate review with your advisor.',
    },
    {
      id: 'faq-rules',
      question: 'Where do the course rules come from?',
      answer:
        'The demo uses a fictional curriculum. For your own workspace, you supply the course data, rules, and source references during import. Avenra checks those modeled rules; it does not automatically verify them against an official university system.',
    },
    {
      id: 'faq-approval',
      question: 'Does a valid plan guarantee I can graduate?',
      answer:
        'No. A valid result means the saved plan passes the rules represented in your workspace. Actual course availability, approvals, grades, and policies outside the model may change what is possible. Use the result to prepare for a discussion with your academic advisor.',
    },
    {
      id: 'faq-scenarios',
      question: 'Will a recovery simulation change my original plan?',
      answer:
        'A failed or postponed course is modeled inside the scenario you are editing. Generated alternatives only become separate plans when you choose to save them. Duplicate your baseline before experimenting, then compare saved plans to see the differences. Avenra does not modify official university records.',
    },
    {
      id: 'faq-storage',
      question: 'Where are my plans and study sessions stored?',
      answer:
        'Saved profiles, plans, tasks, and completed study sessions are stored on the server running this local prototype. This browser remembers which workspace to open. Clearing browser data can remove that access, so keep the same browser for your local work. Avenra currently has no account-based recovery.',
    },
    {
      id: 'faq-demo',
      question: 'Do I need an account to try the demo?',
      answer:
        'No account is needed. Open the demo to explore a fictional student profile, then try the canvas, recovery simulation, plan comparison, and focus timer. Workspace separation is not account authentication, so use fictional data while exploring this local prototype.',
    },
  ];
</script>

<section id="faqs" class="faq-section" aria-labelledby="faq-title">
  <div class="faq-grid">
    <div class="faq-heading">
      <h2 id="faq-title">A few things you might be wondering.</h2>
      <p>
        What Avenra can help with, where the rules come from, and what to check
        with your advisor.
      </p>
    </div>
    <div class="faq-answers">
      <Accordion type="single" value="faq-campuses">
        {#each faqItems as item (item.id)}
          <AccordionItem value={item.id}>
            <AccordionTrigger class="cursor-pointer hover:no-underline"
              >{item.question}</AccordionTrigger
            >
            <AccordionContent><p>{item.answer}</p></AccordionContent>
          </AccordionItem>
        {/each}
      </Accordion>
      <p class="faq-more">
        Want to understand the checks in detail? <a href="/methodology"
          >Read our rules & methodology</a
        >.
      </p>
    </div>
  </div>
</section>

<style>
  .faq-section {
    max-width: 1280px;
    margin: auto;
    padding: 0 40px 96px;
    scroll-margin-top: 32px;
  }
  .faq-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
    border-top: 1px solid var(--border);
    padding-top: 64px;
  }
  h2 {
    max-width: 410px;
    margin: 0;
    font-size: clamp(32px, 3.4vw, 44px);
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .faq-heading p {
    max-width: 340px;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.8;
    margin: 24px 0 0;
  }
  .faq-answers {
    min-width: 0;
  }
  .faq-answers :global([data-slot='accordion-item']) {
    border-color: var(--border);
  }
  .faq-answers :global([data-slot='accordion-trigger']) {
    padding: 20px 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.7;
    gap: 16px;
    border-radius: 2px;
  }
  .faq-answers :global([data-slot='accordion-trigger-icon']) {
    margin-top: 4px;
  }
  .faq-answers :global([data-slot='accordion-content'] p) {
    font-size: 13px;
    line-height: 1.9;
    color: var(--text-secondary);
    margin: 0;
    padding: 0 24px 12px 0;
  }
  .faq-more {
    margin: 28px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.8;
  }
  a {
    color: var(--text-primary);
    text-underline-offset: 4px;
  }
  @media (max-width: 900px) {
    .faq-grid {
      gap: 40px;
    }
  }
  @media (max-width: 720px) {
    .faq-section {
      padding: 0 24px 56px;
    }
    .faq-grid {
      grid-template-columns: 1fr;
      gap: 24px;
      padding-top: 40px;
    }
    h2 {
      font-size: 34px;
    }
  }
</style>
