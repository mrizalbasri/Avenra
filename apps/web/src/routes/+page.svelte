<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll, goto } from '$app/navigation';
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
<div class="page-heading">
  <div>
    <h1>
      {workspace?.profile
        ? `Make your next semester count.`
        : 'A clearer path through university.'}
    </h1>
    <p>
      Understand your progress, explore your options, and turn a plan into
      action.
    </p>
  </div>
  <a
    class="button primary"
    href={workspace?.profile ? '/plans' : '/methodology'}
    >{workspace?.profile ? 'Open your plans' : 'How Avenra works'}<Icon
      name="arrow"
      size={16}
    /></a
  >
</div>
{#if error}<p class="error-banner" role="alert">{error}</p>{/if}
{#if !workspace?.profile}
  <section class="welcome-panel">
    <div class="welcome-symbol"><Icon name="plans" size={40} /></div>
    <h2>Start with a complete example.</h2>
    <p>
      Open a synthetic student profile and a 12-course curriculum. Move courses
      between semesters, simulate a setback, compare recovery options, and build
      a study routine.
    </p>
    <button
      class="button primary"
      disabled={busy || !workspace || !hydrated}
      onclick={openDemo}
      >{busy ? 'Opening workspace…' : 'Open demo workspace'}<Icon
        name="arrow"
        size={16}
      /></button
    ><a class="text-link" href="/curriculum">Or bring your own curriculum</a
    ><small>No account needed. The example uses fictional academic data.</small>
  </section>
{:else}
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
<p class="footnote">
  {workspace?.curriculum.disclaimer ??
    'Avenra supports planning and advisor consultation. It does not issue academic approvals.'}
</p>
