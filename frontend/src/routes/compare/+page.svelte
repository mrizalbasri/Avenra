<script lang="ts">
  import { untrack } from 'svelte';
  import { formatHours, semesterHours } from '#lib/goals.js';
  import { useI18n } from '#lib/i18n/context.js';
  import type { Plan } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t } = useI18n();
  let plans = $derived(data.workspace?.plans.filter((p) => !p.archived) ?? []);
  let leftId = $state(untrack(() => plans[0]?.id ?? ''));
  let rightId = $state(untrack(() => plans[1]?.id ?? ''));
  let diffOnly = $state(false);
  let left = $derived(plans.find((p) => p.id === leftId));
  let right = $derived(plans.find((p) => p.id === rightId));

  let compareTerms = $derived.by(() => {
    if (!left || !right) return [];
    const set = new Set<number>([
      ...Object.keys(left.validation.loads).map(Number),
      ...Object.keys(right.validation.loads).map(Number),
    ]);
    return [...set].sort((a, b) => a - b);
  });

  const isCourseDifferent = (code: string, a: Plan, b: Plan) =>
    a.assignments[code] !== b.assignments[code] ||
    a.failed.includes(code) !== b.failed.includes(code);

  let diffCount = $derived.by(() => {
    if (!left || !right) return 0;
    return (data.workspace?.curriculum.courses ?? []).filter((course) =>
      isCourseDifferent(course.code, left, right),
    ).length;
  });

  let visibleCourses = $derived.by(() => {
    const courses = data.workspace?.curriculum.courses ?? [];
    if (!diffOnly || !left || !right) return courses;
    return courses.filter((course) =>
      isCourseDifferent(course.code, left, right),
    );
  });

  function loadLabel(
    plan: Plan,
    term: number,
  ): { text: string; over: boolean } {
    const key = String(term);
    const credits = plan.validation.loads[key] ?? 0;
    const cap = plan.validation.caps[key];
    const base =
      cap !== undefined
        ? t('compare.load_cell', { credits, cap })
        : t('compare.credits_n', { count: credits });
    const budget = data.workspace?.profile?.time_budget;
    if (!budget) {
      return { text: base, over: cap !== undefined && credits > cap };
    }
    const h = semesterHours(
      credits,
      data.workspace?.profile?.goals,
      term,
      budget,
    );
    return {
      text:
        base +
        t('compare.hours_note', {
          total: formatHours(h.totalHours),
          available: formatHours(h.availableHours),
        }),
      over: h.over || (cap !== undefined && credits > cap),
    };
  }
</script>

<svelte:head><title>{t('compare.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('compare.heading')}</h1>
    <p>{t('compare.lead')}</p>
  </div>
</div>
{#if plans.length < 2}<div class="empty-panel">
    <h2>{t('compare.empty')}</h2>
    <p>{t('compare.empty_hint')}</p>
    <a href="/plans" class="button primary">{t('compare.open_plans')}</a>
  </div>{:else}<div class="compare-selectors">
    <label
      >{t('compare.plan_a')}<select bind:value={leftId}
        >{#each plans as plan}<option value={plan.id}>{plan.name}</option
          >{/each}</select
      ></label
    ><label
      >{t('compare.plan_b')}<select bind:value={rightId}
        >{#each plans as plan}<option value={plan.id}>{plan.name}</option
          >{/each}</select
      ></label
    >
  </div>
  {#if left && right && left.id !== right.id}<div class="comparison-summary">
      {#each [left, right] as plan}<section class="panel">
          <h2>{plan.name}</h2>
          <p class="tag" class:warning={!!plan.validation.findings.length}>
            {plan.validation.findings.length
              ? t('compare.findings', {
                  count: plan.validation.findings.length,
                })
              : t('plan.valid')}
          </p>
          <dl class="metrics">
            <div>
              <dt>{t('compare.completion')}</dt>
              <dd>
                {plan.validation.completion_term
                  ? t('common.semester', {
                      term: plan.validation.completion_term,
                    })
                  : t('compare.unresolved')}
              </dd>
            </div>
            <div>
              <dt>{t('compare.peak')}</dt>
              <dd>
                {t('compare.credits_n', {
                  count: plan.validation.peak_credits,
                })}
              </dd>
            </div>
            <div>
              <dt>{t('compare.planned')}</dt>
              <dd>
                {plan.validation.completed_credits +
                  plan.validation.planned_credits} / {plan.validation
                  .graduation_credits}
              </dd>
            </div>
            <div>
              <dt>{t('compare.your_limit')}</dt>
              <dd>{t('compare.credits_n', { count: plan.credit_cap })}</dd>
            </div>
            <div>
              <dt>{t('compare.ips')}</dt>
              <dd>
                {plan.validation.planning_gpa !== null
                  ? plan.validation.planning_gpa.toFixed(2)
                  : t('compare.not_set')}
              </dd>
            </div>
            <div>
              <dt>{t('compare.setbacks')}</dt>
              <dd>{plan.failed.join(', ') || t('passport.none')}</dd>
            </div>
            <div>
              <dt>{t('compare.revision')}</dt>
              <dd>{plan.revision}</dd>
            </div>
          </dl>
          <a href={`/plans/${plan.id}`} class="text-link">{t('compare.edit')}</a
          >
        </section>{/each}
    </div>
    {#if compareTerms.length}<section class="panel table-scroll">
        <h2>{t('compare.workload_heading')}</h2>
        <table>
          <thead
            ><tr
              ><th>{t('compare.semester')}</th><th>{left.name}</th><th
                >{right.name}</th
              ><th>{t('compare.delta')}</th></tr
            ></thead
          ><tbody
            >{#each compareTerms as term}
              {@const a = loadLabel(left, term)}
              {@const b = loadLabel(right, term)}
              {@const delta =
                (right.validation.loads[String(term)] ?? 0) -
                (left.validation.loads[String(term)] ?? 0)}
              <tr class:changed={delta !== 0}
                ><td>{t('common.semester', { term })}</td><td
                  class:load-over={a.over}>{a.text}</td
                ><td class:load-over={b.over}>{b.text}</td><td
                  >{delta === 0
                    ? t('compare.same_load')
                    : `${delta > 0 ? '+' : ''}${delta}`}</td
                ></tr
              >
            {/each}</tbody
          >
        </table>
      </section>{/if}
    <section class="panel table-scroll">
      <div class="section-heading">
        <div>
          <h2>{t('compare.differences')}</h2>
        </div>
        <div class="compare-table-controls">
          <span class="tag"
            >{t('compare.diff_count', { count: diffCount })}</span
          >
          <label class="checkbox-label small"
            ><input type="checkbox" bind:checked={diffOnly} />{t(
              'compare.diff_only',
            )}</label
          >
        </div>
      </div>
      {#if visibleCourses.length}<table>
          <thead
            ><tr
              ><th>{t('compare.course')}</th><th>{left.name}</th><th
                >{right.name}</th
              ></tr
            ></thead
          ><tbody
            >{#each visibleCourses as course}<tr
                class:changed={isCourseDifferent(course.code, left, right)}
                ><td
                  ><strong>{course.code}</strong><br /><span class="muted"
                    >{course.name}</span
                  ></td
                >{#each [left, right] as plan}<td
                    >{data.workspace?.profile?.completed.includes(
                      course.code,
                    ) && !plan.failed.includes(course.code)
                      ? t('compare.completed')
                      : plan.assignments[course.code]
                        ? t('common.semester', {
                            term: plan.assignments[course.code]!,
                          })
                        : course.category === 'elective'
                          ? t('compare.not_chosen')
                          : t('compare.unscheduled')}</td
                  >{/each}</tr
              >{/each}</tbody
          >
        </table>{:else}<p class="muted">{t('compare.no_differences')}</p>{/if}
    </section>
    <p class="footnote">{t('compare.footnote')}</p>{:else}<p
      class="warning-banner"
    >
      {t('compare.choose_two')}
    </p>{/if}{/if}
