<script lang="ts">
  import { untrack } from 'svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t } = useI18n();
  let plans = $derived(data.workspace?.plans.filter((p) => !p.archived) ?? []);
  let leftId = $state(untrack(() => plans[0]?.id ?? ''));
  let rightId = $state(untrack(() => plans[1]?.id ?? ''));
  let left = $derived(plans.find((p) => p.id === leftId));
  let right = $derived(plans.find((p) => p.id === rightId));
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
    <section class="panel table-scroll">
      <h2>{t('compare.differences')}</h2>
      <table>
        <thead
          ><tr
            ><th>{t('compare.course')}</th><th>{left.name}</th><th
              >{right.name}</th
            ></tr
          ></thead
        ><tbody
          >{#each data.workspace?.curriculum.courses ?? [] as course}<tr
              class:changed={left.assignments[course.code] !==
                right.assignments[course.code] ||
                left.failed.includes(course.code) !==
                  right.failed.includes(course.code)}
              ><td
                ><strong>{course.code}</strong><br /><span class="muted"
                  >{course.name}</span
                ></td
              >{#each [left, right] as plan}<td
                  >{data.workspace?.profile?.completed.includes(course.code) &&
                  !plan.failed.includes(course.code)
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
      </table>
    </section>
    <p class="footnote">{t('compare.footnote')}</p>{:else}<p
      class="warning-banner"
    >
      {t('compare.choose_two')}
    </p>{/if}{/if}
