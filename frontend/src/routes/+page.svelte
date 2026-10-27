<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll, goto } from '$app/navigation';
  import Hero from '#lib/components/dusk/hero/six/hero.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import { api } from '#lib/api.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let busy = $state(false);
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
  let error = $state('');
  let workspace = $derived(data.workspace);
  let plans = $derived(workspace?.plans.filter((p) => !p.archived) ?? []);
  let completed = $derived(
    workspace?.curriculum.courses
      .filter((c) => workspace?.profile?.completed.includes(c.code))
      .reduce((sum, c) => sum + c.credits, 0) ?? 0,
  );
  let total = $derived(
    workspace?.curriculum.courses.reduce((sum, c) => sum + c.credits, 0) ?? 0,
  );
  async function openDemo() {
    if (workspace?.profile) {
      await goto('/plans');
      return;
    }
    busy = true;
    error = '';
    try {
      const opened = await api<{ plans: { id: string }[] }>(
        'workspace/bootstrap',
        'POST',
        {},
      );
      await invalidateAll();
      await goto(`/plans/${opened.plans[0].id}`);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | Your academic workspace</title></svelte:head>
{#if !workspace?.profile || page.url.searchParams.has('intro')}
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}
  <Hero
    hasProfile={!!workspace?.profile}
    {busy}
    disabled={!workspace || !hydrated}
    onOpen={openDemo}
  />{:else}<div class="page-heading">
    <div>
      <h1>Make your next semester count.</h1>
      <p>
        Understand your progress, explore your options, and turn a plan into
        action.
      </p>
    </div>
    <a class="button primary" href="/plans"
      >Open your plans <Icon name="arrow" size={16} /></a
    >
  </div>
  <section class="overview-grid">
    <div class="progress-panel">
      <div class="section-heading">
        <h2>Academic progress</h2>
        <a href="/profile" class="text-link">Edit profile</a>
      </div>
      <div class="progress-number">
        {completed}<span>/ {total} credits</span>
      </div>
      <progress
        value={completed}
        max={total}
        aria-label="Completed curriculum credits"
      ></progress>
      <div class="meta-row">
        <span>{workspace.profile.completed.length} courses completed</span><span
          >Current semester {workspace.profile.current_term}</span
        >
      </div>
    </div>
    <div class="next-panel">
      <Icon name="plans" size={24} />
      <h2>{plans.length} active {plans.length === 1 ? 'plan' : 'plans'}</h2>
      <p>
        Each plan is an independent scenario. Changes here never alter official
        university records.
      </p>
      <a href="/plans" class="text-link"
        >Explore your plans <Icon name="arrow" size={15} /></a
      >
    </div>
  </section>
  <section>
    <div class="section-heading">
      <h2>Pick up where you left off</h2>
      <a href="/plans" class="text-link">All plans</a>
    </div>
    <div class="plan-grid">
      {#each plans.slice(0, 3) as plan}<a
          class="plan-tile"
          href={`/plans/${plan.id}`}
          ><div class="tile-top">
            <Icon name="plans" /><span
              class="tag"
              class:warning={plan.validation.findings.length > 0}
              >{plan.validation.findings.length
                ? `${plan.validation.findings.length} checks to review`
                : 'Valid under assumptions'}</span
            >
          </div>
          <h3>{plan.name}</h3>
          <p>
            {plan.validation.remaining_credits} credits to plan | Up to semester {plan.horizon}
          </p>
          <span class="text-link"
            >Open workspace <Icon name="arrow" size={15} /></span
          ></a
        >{/each}
    </div>
  </section>
  <section class="study-strip">
    <div>
      <h2>A plan works when you put it into practice.</h2>
      <p>
        Set course goals, track tasks, and protect time for focused learning.
      </p>
    </div>
    <a class="button" href="/study"
      ><Icon name="clock" size={17} />Open study space</a
    >
  </section>
{/if}
{#if workspace?.profile && !page.url.searchParams.has('intro')}<p
    class="footnote"
  >
    {workspace?.curriculum.disclaimer ??
      'Avenra supports planning and advisor consultation. It does not issue academic approvals.'}
  </p>
{/if}
