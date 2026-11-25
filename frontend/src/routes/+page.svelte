<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll, goto } from '$app/navigation';
  import Hero from '#lib/components/dusk/hero/six/hero.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import { api } from '#lib/api.js';
  import { formatHours, semesterHours } from '#lib/goals.js';
  import { useI18n } from '#lib/i18n/context.js';
  import type { Goal, Outlook } from '#lib/types.js';
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
  let primaryPlan = $derived(plans.find((p) => p.is_primary) ?? plans[0]);
  let featuredPlans = $derived(
    primaryPlan
      ? [primaryPlan, ...plans.filter((p) => p.id !== primaryPlan.id)].slice(
          0,
          3,
        )
      : plans.slice(0, 3),
  );
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

  const { t, msg } = useI18n();
  const semesters = (count: number) => t('overview.semesters', { count });
  let headline = $derived(
    outlookLoading
      ? t('overview.headline.loading')
      : !outlook || outlook.status === 'unknown'
        ? t('overview.headline.unknown')
        : outlook.status === 'on_track'
          ? t('overview.headline.on_track', {
              term: outlook.completion_term ?? 0,
            })
          : outlook.status === 'late'
            ? t('overview.headline.late', {
                term: outlook.completion_term ?? 0,
              })
            : t('overview.headline.unresolved'),
  );
  let subline = $derived.by(() => {
    if (outlookLoading) return t('overview.sub.loading');
    if (!outlook || outlook.status === 'unknown')
      return t('overview.sub.unknown');
    if (outlook.status === 'unresolved') return t('overview.sub.unresolved');
    const base =
      outlook.basis === 'plan'
        ? t('overview.sub.basis.plan')
        : t('overview.sub.basis.fix', { count: outlook.plan_findings });
    const target = t('overview.sub.target', { term: outlook.target_term });
    const earlier =
      outlook.basis === 'plan' &&
      outlook.earliest_term !== null &&
      outlook.earliest_term < (outlook.plan_term ?? 0)
        ? t('overview.sub.earlier', { term: outlook.earliest_term })
        : '';
    const timing =
      outlook.status === 'late'
        ? t('overview.sub.late', {
            base,
            delay: semesters(outlook.delay ?? 0),
            target,
          })
        : t('overview.sub.ontime', { base, target });
    return `${timing}${earlier}${t('overview.sub.estimate')}`;
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
  let activeGoals = $derived(
    (workspace?.profile?.goals ?? []).filter(
      (g) =>
        g.start_term <= (workspace?.profile?.current_term ?? 0) &&
        (workspace?.profile?.current_term ?? 0) <= g.end_term,
    ),
  );
  let otherGoals = $derived(
    (workspace?.profile?.goals ?? []).filter(
      (g) => !activeGoals.some((active) => active.id === g.id),
    ),
  );
  const goalRange = (goal: Goal) =>
    goal.start_term === goal.end_term
      ? t('overview.mission.range_single', { term: goal.start_term })
      : t('overview.mission.range_multi', {
          start: goal.start_term,
          end: goal.end_term,
        });
  const goalKindLabel = (kind: Goal['kind']) =>
    t(`goals.kind_${kind}` as 'goals.kind_internship');

  let attention = $derived.by(() => {
    const items: Attention[] = [];
    const open = data.study?.tasks.filter((t) => !t.done) ?? [];
    const today = isoDay();
    const soon = isoDay(2);
    const goalNames = Object.fromEntries(
      (workspace?.profile?.goals ?? []).map((goal) => [goal.id, goal.title]),
    );
    const dueListed = new Set<string>();
    for (const task of open) {
      if (!task.due_date || task.due_date > soon) continue;
      dueListed.add(task.id);
      const goalTitle = task.goal_id
        ? (goalNames[task.goal_id] ?? task.goal_id)
        : null;
      const detail =
        task.course_code && goalTitle
          ? t('overview.attention.task_detail_both', {
              course: task.course_code,
              goal: goalTitle,
              date: task.due_date,
            })
          : task.course_code
            ? t('overview.attention.task_detail', {
                course: task.course_code,
                date: task.due_date,
              })
            : goalTitle
              ? t('overview.attention.task_detail_goal', {
                  goal: goalTitle,
                  date: task.due_date,
                })
              : t('overview.attention.task_detail_plain', {
                  date: task.due_date,
                });
      items.push({
        key: `task-${task.id}`,
        title:
          task.due_date < today
            ? t('overview.attention.overdue', { title: task.title })
            : t('overview.attention.due_soon', { title: task.title }),
        detail: task.first_step
          ? `${detail} | ${t('overview.attention.start_detail', { step: task.first_step })}`
          : detail,
        href: '/study',
        action: t('overview.attention.open_study'),
      });
    }
    for (const task of open) {
      if (dueListed.has(task.id)) continue;
      if (!task.start_date || task.start_date > today) continue;
      const goalTitle = task.goal_id
        ? (goalNames[task.goal_id] ?? task.goal_id)
        : null;
      const context = [task.course_code, goalTitle].filter(Boolean).join(' | ');
      const detail = task.first_step
        ? `${context ? `${context} | ` : ''}${t('overview.attention.start_detail', { step: task.first_step })}`
        : task.due_date
          ? `${context ? `${context} | ` : ''}${t('overview.attention.task_detail_plain', { date: task.due_date })}`
          : context;
      items.push({
        key: `start-${task.id}`,
        title: t('overview.attention.start_today', { title: task.title }),
        detail,
        href: '/study',
        action: t('overview.attention.open_study'),
      });
    }
    const budget = workspace?.profile?.time_budget;
    if (primaryPlan && budget) {
      const entries = Object.entries(primaryPlan.validation.loads)
        .map(([term, credits]) => [Number(term), credits] as const)
        .sort((a, b) => a[0] - b[0]);
      for (const [term, credits] of entries) {
        const hours = semesterHours(
          credits,
          workspace?.profile?.goals,
          term,
          budget,
        );
        if (!hours.over) continue;
        items.push({
          key: `overload-${term}`,
          title: t('overview.attention.overload', {
            term,
            total: formatHours(hours.totalHours),
            available: formatHours(hours.availableHours),
          }),
          detail:
            hours.goalHours > 0
              ? t('overview.attention.overload_goals', {
                  course: formatHours(hours.courseHours),
                  credits,
                  goal: formatHours(hours.goalHours),
                })
              : t('overview.attention.overload_courses', {
                  course: formatHours(hours.courseHours),
                  credits,
                }),
          href: `/plans/${primaryPlan.id}`,
          action: t('overview.attention.review_plan'),
        });
      }
    }
    for (const c of outlook?.critical ?? []) {
      if (open.some((task) => task.course_code === c.code)) continue;
      items.push({
        key: `critical-${c.code}`,
        title: t('overview.attention.protect', { name: c.name }),
        detail:
          c.extra_semesters === null
            ? t('overview.attention.fail_none')
            : t('overview.attention.fail_moves', {
                term: c.finish_if_failed ?? 0,
              }),
        href: `/study?course=${c.code}`,
        action: t('overview.attention.set_target'),
      });
    }
    const findings = primaryPlan?.validation.findings ?? [];
    if (primaryPlan && findings.length)
      items.push({
        key: 'findings',
        title: t('overview.attention.findings', { count: findings.length }),
        detail: msg.describe('finding', findings[0]),
        href: `/plans/${primaryPlan.id}`,
        action: t('overview.attention.review_plan'),
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

<svelte:head><title>{t('overview.title')}</title></svelte:head>
{#if !workspace?.profile || page.url.searchParams.has('intro')}
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}
  <Hero
    hasProfile={!!workspace?.profile}
    {busy}
    disabled={!workspace || !hydrated}
    onOpen={openDemo}
  />{:else}
  <div class="workspace-column">
    <section
      class="today-card"
      data-status={outlookLoading ? 'loading' : (outlook?.status ?? 'none')}
      aria-busy={outlookLoading}
    >
      <p class="eyebrow">{t('overview.eyebrow')}</p>
      <h1>{headline}</h1>
      <p class="today-sub">{subline}</p>
      {#if !outlookLoading && outlook?.completion_term && outlook.status !== 'unknown'}<div
          class="today-meta"
        >
          <div>
            <small>{t('overview.meta.finish')}</small><strong
              >{t('overview.meta.semester', {
                term: outlook.completion_term,
              })}</strong
            >
          </div>
          <div>
            <small>{t('overview.meta.target')}</small><strong
              >{t('overview.meta.semester', {
                term: outlook.target_term,
              })}</strong
            >
          </div>
          <div>
            <small>{t('overview.meta.status')}</small><strong
              >{outlook.delay
                ? t('overview.meta.late', { delay: semesters(outlook.delay) })
                : t('overview.meta.ontime')}</strong
            >
          </div>
        </div>{/if}
      <div class="today-actions">
        <a
          class="button primary"
          href={primaryPlan ? `/plans/${primaryPlan.id}` : '/plans'}
          >{outlook && outlook.status !== 'on_track'
            ? t('overview.action.recovery')
            : t('overview.action.open_plan')}<Icon name="arrow" size={16} /></a
        ><a class="button" href="/study"
          ><Icon name="clock" size={16} />{t('overview.action.study_space')}</a
        >
      </div>
    </section>
    {#if workspace.profile.mission || workspace.profile.goals.length}<section
        class="panel mission-panel"
        aria-labelledby="mission-heading"
      >
        <div class="section-heading">
          <h2 id="mission-heading">{t('overview.mission.heading')}</h2>
          <a href="/profile" class="text-link">{t('overview.progress.edit')}</a>
        </div>
        {#if workspace.profile.mission}<p class="mission-text">
            {workspace.profile.mission}
          </p>{/if}
        {#if workspace.profile.goals.length}<div class="mission-goals">
            <p class="small muted">{t('overview.mission.active')}</p>
            {#if activeGoals.length}<ul class="goal-list">
                {#each activeGoals as goal (goal.id)}<li>
                    <strong>{goal.title}</strong><span class="muted small"
                      >{t('overview.mission.goal_meta', {
                        kind: goalKindLabel(goal.kind),
                        range: goalRange(goal),
                        hours: formatHours(goal.weekly_hours),
                      })}</span
                    >
                  </li>{/each}
              </ul>{:else}<p class="muted small">
                {t('overview.mission.no_active', {
                  term: workspace.profile.current_term,
                })}
              </p>{/if}
            {#if otherGoals.length}<p class="small muted upcoming-heading">
                {t('overview.mission.upcoming')}
              </p>
              <ul class="goal-list">
                {#each otherGoals as goal (goal.id)}<li>
                    <strong>{goal.title}</strong><span class="muted small"
                      >{t('overview.mission.goal_meta', {
                        kind: goalKindLabel(goal.kind),
                        range: goalRange(goal),
                        hours: formatHours(goal.weekly_hours),
                      })}</span
                    >
                  </li>{/each}
              </ul>{/if}
          </div>{/if}
      </section>{/if}
    <section aria-labelledby="attention-heading">
      <div class="section-heading">
        <h2 id="attention-heading">{t('overview.attention.heading')}</h2>
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
            ? t('overview.attention.empty.ready')
            : outlookLoading
              ? t('overview.attention.empty.loading')
              : t('overview.attention.empty.unavailable')}
        </p>{/if}
    </section>
    <section class="progress-panel">
      <div class="section-heading">
        <h2>{t('overview.progress.heading')}</h2>
        <a href="/profile" class="text-link">{t('overview.progress.edit')}</a>
      </div>
      <div class="progress-number">
        {completed}<span>{t('overview.progress.credits', { total })}</span>
      </div>
      <progress
        value={completed}
        max={total}
        aria-label={t('overview.progress.aria')}
      ></progress>
      <div class="meta-row">
        <span
          >{t('overview.progress.courses', {
            count: workspace.profile.completed.length,
          })}</span
        ><span
          >{t('overview.progress.now', {
            term: workspace.profile.current_term,
          })}</span
        >
      </div>
    </section>
    <section>
      <div class="section-heading">
        <h2>{t('overview.plans.heading')}</h2>
        <a href="/plans" class="text-link">{t('overview.plans.all')}</a>
      </div>
      <div class="plan-grid">
        {#each featuredPlans as plan}<a
            class="plan-tile"
            href={`/plans/${plan.id}`}
            ><div class="tile-top">
              <Icon name="plans" />
              <div class="tile-tags">
                {#if plan.is_primary && plans.length > 1}<span class="tag"
                    >{t('plans.primary_tag')}</span
                  >{/if}<span
                  class="tag"
                  class:warning={plan.validation.findings.length > 0}
                  >{plan.validation.findings.length
                    ? t('overview.plans.checks', {
                        count: plan.validation.findings.length,
                      })
                    : t('overview.plans.valid')}</span
                >
              </div>
            </div>
            <h3>{plan.name}</h3>
            <p>
              {t('overview.plans.summary', {
                credits: plan.validation.planned_credits,
                horizon: plan.horizon,
              })}
            </p>
            <span class="text-link"
              >{t('overview.plans.open')} <Icon name="arrow" size={15} /></span
            ></a
          >{/each}
      </div>
    </section>
    {#if workspace?.profile && !page.url.searchParams.has('intro')}<p
        class="footnote"
      >
        {workspace?.curriculum
          ? msg.disclaimer(workspace.curriculum)
          : t('overview.footnote')}
      </p>
    {/if}
  </div>
{/if}
