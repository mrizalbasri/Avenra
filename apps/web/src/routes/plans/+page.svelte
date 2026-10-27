<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import Icon from '#lib/components/Icon.svelte';
  import type { Plan } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let name = $state('');
  let busy = $state(false);
  let error = $state('');
  let archived = $state(false);
  let plans = $derived(
    data.workspace?.plans.filter((p) => p.archived === archived) ?? [],
  );
  async function create(copy?: Plan) {
    if (!copy && !name.trim()) return;
    busy = true;
    error = '';
    try {
      const plan = await api<Plan>('plans', 'POST', {
        name: copy ? `${copy.name} copy` : name,
        copy_from: copy?.id ?? null,
      });
      await invalidateAll();
      await goto(`/plans/${plan.id}`);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | Study plans</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Your plans. Your possibilities.</h1>
    <p>
      Keep a baseline, try something different, and compare before deciding.
    </p>
  </div>
</div>
{#if !data.workspace?.profile}<div class="empty-panel">
    <h2>Start with your academic profile.</h2>
    <p>Open the demo workspace from Overview to create your first plan.</p>
    <a href="/" class="button primary">Go to overview</a>
  </div>{:else}
  <form
    class="inline-create"
    onsubmit={(e) => {
      e.preventDefault();
      create();
    }}
  >
    <label for="plan-name">New plan name</label><input
      id="plan-name"
      bind:value={name}
      placeholder="e.g. Internship next year"
      maxlength="100"
      required
    /><button class="button primary" disabled={busy}
      ><Icon name="plus" size={16} />Create plan</button
    >
  </form>
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}
  <div class="section-heading">
    <div class="segmented">
      <button class:chosen={!archived} onclick={() => (archived = false)}
        >Active plans</button
      ><button class:chosen={archived} onclick={() => (archived = true)}
        >Archived</button
      >
    </div>
    <span class="muted small"
      >{plans.length} {plans.length === 1 ? 'plan' : 'plans'}</span
    >
  </div>
  <div class="plan-grid">
    {#each plans as plan}<article class="plan-tile">
        <div class="tile-top">
          <Icon name="plans" /><span
            class="tag"
            class:warning={!!plan.validation.findings.length}
            >{plan.validation.findings.length
              ? 'Needs review'
              : 'Valid under assumptions'}</span
          >
        </div>
        <h2><a href={`/plans/${plan.id}`}>{plan.name}</a></h2>
        <p>
          {plan.validation.remaining_credits} remaining credits | {plan.credit_cap}
          credit cap
        </p>
        <p class="small muted">
          {plan.validation.completion_term
            ? `Modeled completion: semester ${plan.validation.completion_term}`
            : `${plan.validation.findings.length} rule findings to review`}
        </p>
        <div class="tile-actions">
          <a class="button" href={`/plans/${plan.id}`}
            >{archived ? 'View & restore' : 'Open plan'}<Icon
              name="arrow"
              size={15}
            /></a
          ><button
            class="button icon-button"
            aria-label={`Duplicate ${plan.name}`}
            disabled={busy}
            onclick={() => create(plan)}><Icon name="copy" size={17} /></button
          >
        </div>
      </article>{/each}
  </div>
  {#if !plans.length}<div class="empty-panel">
      <h2>{archived ? 'No archived plans.' : 'Your next plan starts here.'}</h2>
      <p>
        {archived
          ? 'Plans you archive remain available here.'
          : 'Give your plan a name above to start exploring.'}
      </p>
    </div>{/if}
{/if}
