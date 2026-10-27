<script lang="ts">
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  const steps = [
    {
      title: 'Bring your curriculum.',
      copy: 'Import your courses, credits, prerequisites, and source references. Add the rules that apply to your university and program.',
    },
    {
      title: 'Map your semesters.',
      copy: 'Record completed courses, then arrange what comes next on the canvas or semester board. Save a baseline to return to.',
    },
    {
      title: 'Explore a different route.',
      copy: 'Simulate a delayed course, check the modeled rules, and compare saved alternatives before discussing a change with your advisor.',
    },
    {
      title: 'Make time to learn.',
      copy: 'Turn your course goals into tasks. Start a focus session, take a break, and reflect on what you learned.',
    },
  ];
</script>

<section
  id="getting-started"
  class="content-two"
  aria-labelledby="getting-started-title"
>
  <div class="content-grid">
    <div class="content-heading">
      <h2 id="getting-started-title">
        From your curriculum to a clearer next step.
      </h2>
      <a href="/curriculum"
        >Bring your own curriculum<ArrowUpRight
          size={16}
          aria-hidden="true"
        /></a
      >
    </div>
    <div class="content-body">
      <p class="introduction">
        Start with the courses you actually need, explore the choices ahead, and
        turn a semester plan into a daily study routine. Your curriculum gives
        the plan its context.
      </p>
      <ol>
        {#each steps as step, index}
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
        Your supplied rules shape the simulation. Confirm academic decisions
        with your advisor. <a href="/methodology"
          >Read the assumptions<ArrowUpRight size={13} aria-hidden="true" /></a
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
