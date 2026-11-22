<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll, goto } from '$app/navigation';
  import Hero from '#lib/components/dusk/hero/six/hero.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import { api } from '#lib/api.js';
  import type { Outlook } from '#lib/types.js';
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
  let primaryPlan = $derived(plans[0]);
  let completed = $derived(
    workspace?.curriculum.courses
      .filter((c) => workspace?.profile?.completed.includes(c.code))
      .reduce((sum, c) => sum + c.credits, 0) ?? 0,
  );
  // Graduation credits, not every listed course: electives are optional.
  let total = $derived(
    workspace?.curriculum.graduation_credits ??
      workspace?.curriculum.courses.reduce((sum, c) => sum + c.credits, 0) ??
      0,
  );
  // The outlook arrives after the page renders; ignore a promise that was replaced.
  let outlook = $state<Outlook | null>(null);
  let outlookLoading = $state(true);
  $effect(() => {
    const pending = data.outlook;
    let current = true;
    outlookLoading = true;
    pending.then((value) => {
      if (!current) return;
      outlook = value;
      outlookLoading = false;
    });
    return () => {
      current = false;
    };
  });

  const semesters = (n: number) => (n === 1 ? '1 semester' : `${n} semesters`);
  let headline = $derived(
    outlookLoading
      ? 'Checking your graduation outlook…'
      : !outlook || outlook.status === 'unknown'
        ? 'Make your next semester count.'
        : outlook.status === 'on_track'
          ? `On track for semester ${outlook.completion_term}.`
          : outlook.status === 'late'
            ? `Heading for semester ${outlook.completion_term}.`
            : 'No plan fits within the study period yet.',
  );
  let subline = $derived.by(() => {
    if (outlookLoading)
      return 'Comparing your saved plan with the curriculum rules.';
    if (!outlook || outlook.status === 'unknown')
      return 'The outlook could not be confirmed in time. Your plans are saved; open one to check it.';
    if (outlook.status === 'unresolved')
      return 'Open your plan to see which rule blocks it and the smallest change that helps.';
    const base =
      outlook.basis === 'plan'
        ? 'Your saved plan'
        : `Your saved plan has ${outlook.plan_findings} rule ${outlook.plan_findings === 1 ? 'check' : 'checks'} to fix, so this is the earliest modeled finish`;
    const target = `the semester ${outlook.target_term} target set in your curriculum`;
    const earlier =
      outlook.basis === 'plan' &&
      outlook.earliest_term !== null &&
      outlook.earliest_term < (outlook.plan_term ?? 0)
        ? ` A rearranged plan could finish in semester ${outlook.earliest_term}.`
        : '';
    const timing =
      outlook.status === 'late'
        ? `${base} finishes ${semesters(outlook.delay ?? 0)} after ${target}.`
        : `${base} meets ${target}.`;
    return `${timing}${earlier} A modeled estimate, not an official decision.`;
  });

  const isoDay = (offset = 0) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return day.toLocaleDateString('en-CA');
  };
  type Attention = {
    key: string;
    title: string;
    detail: string;
    href: string;
    action: string;
  };
  let attention = $derived.by(() => {
    const items: Attention[] = [];
    const open = data.study?.tasks.filter((t) => !t.done) ?? [];
    const today = isoDay();
    const soon = isoDay(2);
    for (const t of open) {
      if (!t.due_date || t.due_date > soon) continue;
      items.push({
        key: `task-${t.id}`,
        title:
          t.due_date < today ? `Overdue: ${t.title}` : `Due soon: ${t.title}`,
        detail: `Course ${t.course_code} | due ${t.due_date}`,
        href: '/study',
        action: 'Open study',
      });
    }
    for (const c of outlook?.critical ?? []) {
      if (open.some((t) => t.course_code === c.code)) continue;
      items.push({
        key: `critical-${c.code}`,
        title: `Protect ${c.name}`,
        detail:
          c.extra_semesters === null
            ? 'If you fail it this semester, no modeled plan finishes within the study period.'
            : `If you fail it this semester, the earliest modeled finish moves to semester ${c.finish_if_failed}.`,
        href: `/study?course=${c.code}`,
        action: 'Set a target',
      });
    }
    const findings = primaryPlan?.validation.findings ?? [];
    if (primaryPlan && findings.length)
      items.push({
        key: 'findings',
        title: `Your plan has ${findings.length} rule ${findings.length === 1 ? 'check' : 'checks'} to review`,
        detail: findings[0].message,
        href: `/plans/${primaryPlan.id}`,
        action: 'Review plan',
      });
    return items;
  });

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
  />{:else}
  <section
    class="today-card"
    data-status={outlookLoading ? 'loading' : (outlook?.status ?? 'none')}
    aria-busy={outlookLoading}
  >
    <p class="eyebrow">Graduation outlook</p>
    <h1>{headline}</h1>
    <p class="today-sub">{subline}</p>
    {#if !outlookLoading && outlook?.completion_term && outlook.status !== 'unknown'}<div
        class="today-meta"
      >
        <div>
          <small>Finish</small><strong
            >Semester {outlook.completion_term}</strong
          >
        </div>
        <div>
          <small>Target</small><strong>Semester {outlook.target_term}</strong>
        </div>
        <div>
          <small>Status</small><strong
            >{outlook.delay
              ? `${semesters(outlook.delay)} late`
              : 'On time'}</strong
          >
        </div>
      </div>{/if}
    <div class="today-actions">
      <a
        class="button primary"
        href={primaryPlan ? `/plans/${primaryPlan.id}` : '/plans'}
        >{outlook && outlook.status !== 'on_track'
          ? 'Find a recovery plan'
          : 'Open your plan'}<Icon name="arrow" size={16} /></a
      ><a class="button" href="/study"
        ><Icon name="clock" size={16} />Study space</a
      >
    </div>
  </section>
  <section aria-labelledby="attention-heading">
    <div class="section-heading">
      <h2 id="attention-heading">Needs your attention</h2>
      {#if attention.length}<span class="tag warning">{attention.length}</span
        >{/if}
    </div>
    {#if attention.length}<ul class="attention-list">
        {#each attention as item (item.key)}<li>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <a class="button" href={item.href}
              >{item.action}<Icon name="arrow" size={15} /></a
            >
          </li>{/each}
      </ul>{:else}<p class="muted attention-empty">
        {outlook
          ? 'Nothing flagged right now. Check again after new grades or deadlines.'
          : outlookLoading
            ? 'Checking for deadlines and critical courses…'
            : 'The outlook is unavailable right now. Your plans are still saved.'}
      </p>{/if}
  </section>
  <section class="progress-panel">
    <div class="section-heading">
      <h2>Credits toward graduation</h2>
      <a href="/profile" class="text-link">Edit profile</a>
    </div>
    <div class="progress-number">
      {completed}<span>/ {total} credits</span>
    </div>
    <progress
      value={completed}
      max={total}
      aria-label="Completed credits toward graduation"
    ></progress>
    <div class="meta-row">
      <span>{workspace.profile.completed.length} courses completed</span><span
        >Now in semester {workspace.profile.current_term}</span
      >
    </div>
  </section>
  <section>
    <div class="section-heading">
      <h2>Your plans</h2>
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
            {plan.validation.planned_credits} credits planned | Up to semester {plan.horizon}
          </p>
          <span class="text-link"
            >Open plan <Icon name="arrow" size={15} /></span
          ></a
        >{/each}
    </div>
  </section>
{/if}
{#if workspace?.profile && !page.url.searchParams.has('intro')}<p
    class="footnote"
  >
    {workspace?.curriculum.disclaimer ??
      'Avenra supports planning and advisor consultation. It does not issue academic approvals.'}
  </p>
{/if}
