<script lang="ts">
  import { untrack } from 'svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let plans = $derived(data.workspace?.plans.filter((p) => !p.archived) ?? []);
  let leftId = $state(untrack(() => plans[0]?.id ?? ''));
  let rightId = $state(untrack(() => plans[1]?.id ?? ''));
  let left = $derived(plans.find((p) => p.id === leftId));
  let right = $derived(plans.find((p) => p.id === rightId));
</script>

<svelte:head><title>Avenra | Compare plans</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>See the trade-offs clearly.</h1>
    <p>
      Compare saved snapshots under the same academic profile and curriculum
      assumptions.
    </p>
  </div>
</div>
{#if plans.length < 2}<div class="empty-panel">
    <h2>Give yourself another option.</h2>
    <p>
      Create or duplicate a second plan, then come back to compare the
      differences.
    </p>
    <a href="/plans" class="button primary">Open study plans</a>
  </div>{:else}<div class="compare-selectors">
    <label
      >Plan A<select bind:value={leftId}
        >{#each plans as plan}<option value={plan.id}>{plan.name}</option
          >{/each}</select
      ></label
    ><label
      >Plan B<select bind:value={rightId}
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
              ? `${plan.validation.findings.length} rule findings`
              : 'Valid under modeled assumptions'}
          </p>
          <dl class="metrics">
            <div>
              <dt>Modeled completion</dt>
              <dd>
                {plan.validation.completion_term
                  ? `Semester ${plan.validation.completion_term}`
                  : 'Unresolved'}
              </dd>
            </div>
            <div>
              <dt>Peak semester load</dt>
              <dd>{plan.validation.peak_credits} credits</dd>
            </div>
            <div>
              <dt>Credits planned</dt>
              <dd>
                {plan.validation.completed_credits +
                  plan.validation.planned_credits} / {plan.validation
                  .graduation_credits}
              </dd>
            </div>
            <div>
              <dt>Your credit limit</dt>
              <dd>{plan.credit_cap} credits</dd>
            </div>
            <div>
              <dt>Scenario IPS</dt>
              <dd>
                {plan.validation.planning_gpa !== null
                  ? plan.validation.planning_gpa.toFixed(2)
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt>Scenario setbacks</dt>
              <dd>{plan.failed.join(', ') || 'None'}</dd>
            </div>
            <div>
              <dt>Saved revision</dt>
              <dd>{plan.revision}</dd>
            </div>
          </dl>
          <a href={`/plans/${plan.id}`} class="text-link">Edit this plan</a>
        </section>{/each}
    </div>
    <section class="panel table-scroll">
      <h2>Course-by-course differences</h2>
      <table>
        <thead
          ><tr><th>Course</th><th>{left.name}</th><th>{right.name}</th></tr
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
                    ? 'Completed'
                    : plan.assignments[course.code]
                      ? `Semester ${plan.assignments[course.code]}`
                      : course.category === 'elective'
                        ? 'Not chosen'
                        : 'Unscheduled'}</td
                >{/each}</tr
            >{/each}</tbody
        >
      </table>
    </section>
    <p class="footnote">
      Highlighted rows differ. Completion is conditional on the modeled demo
      rules, not a graduation guarantee.
    </p>{:else}<p class="warning-banner">
      Choose two different plans.
    </p>{/if}{/if}
