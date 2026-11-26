<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Icon from '#lib/components/Icon.svelte';
  import { formatHours, semesterHours } from '#lib/goals.js';
  import { useI18n } from '#lib/i18n/context.js';
  import { buildAdvisorSummary } from '#lib/passport.js';
  import type { Goal } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, locale, msg } = useI18n();
  let validation = $derived(data.plan.validation);
  let copyStatus = $state('');
  let copyError = $state('');
  let studentNotes = $state('');
  let hydrated = $state(false);
  let loadedKey = $state('');
  let notesKey = $derived(`avenra-passport-notes:${data.plan.id}`);
  onMount(() => {
    hydrated = true;
  });
  $effect(() => {
    const targetKey = notesKey;
    if (!hydrated || loadedKey === targetKey) return;
    loadedKey = targetKey;
    try {
      const saved = localStorage.getItem(targetKey);
      studentNotes = typeof saved === 'string' ? saved : '';
    } catch {
      studentNotes = '';
    }
  });
  $effect(() => {
    const value = studentNotes;
    const targetKey = notesKey;
    if (!hydrated || loadedKey !== targetKey) return;
    try {
      if (value.trim()) localStorage.setItem(targetKey, value);
      else localStorage.removeItem(targetKey);
    } catch {
      /* Browser storage is optional. */
    }
  });
  let ipsNote = $derived(
    validation.planning_gpa !== null
      ? t('passport.ips_used', {
          term: data.profile.current_term,
          gpa: validation.planning_gpa.toFixed(2),
        })
      : '',
  );
  let generatedDisplay = $derived.by(() => {
    const tag = locale() === 'id' ? 'id-ID' : 'en-GB';
    return new Intl.DateTimeFormat(tag, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(data.generatedAt));
  });
  const goalRange = (goal: Goal) =>
    goal.start_term === goal.end_term
      ? t('overview.mission.range_single', { term: goal.start_term })
      : t('overview.mission.range_multi', {
          start: goal.start_term,
          end: goal.end_term,
        });
  const goalKindLabel = (kind: Goal['kind']) =>
    t(`goals.kind_${kind}` as 'goals.kind_internship');

  async function copySummary() {
    copyStatus = '';
    copyError = '';
    const summary = buildAdvisorSummary(
      data.plan,
      data.profile,
      data.curriculum,
      t,
      msg,
      studentNotes,
    );
    try {
      await navigator.clipboard.writeText(summary);
      copyStatus = t('passport.copied');
    } catch {
      copyError = t('passport.copy_failed');
    }
  }
</script>

<svelte:head
  ><title>{t('passport.title', { name: data.plan.name })}</title></svelte:head
>
<div class="page-heading no-print">
  <div>
    <h1>{t('passport.heading')}</h1>
    <p>{t('passport.lead')}</p>
  </div>
  <div class="toolbar-actions">
    <button class="button" onclick={copySummary}
      ><Icon name="copy" size={16} />{t('passport.copy_summary')}</button
    ><button class="button primary" onclick={() => window.print()}
      ><Icon name="print" size={17} />{t('passport.print')}</button
    >
  </div>
</div>
{#if copyStatus}<p class="success-banner no-print" role="status">
    {copyStatus}
  </p>{/if}{#if copyError}<p class="error-banner no-print" role="alert">
    {copyError}
  </p>{/if}
<section class="panel form-stack no-print passport-notes-editor">
  <label
    >{t('passport.notes_label')}<textarea
      bind:value={studentNotes}
      rows="3"
      maxlength="1000"
      placeholder={t('passport.notes_placeholder')}
    ></textarea></label
  >
</section>
<article class="passport">
  <div class="passport-header">
    <span>AVENRA</span><span
      >{data.curriculum.status === 'synthetic'
        ? t('passport.brand_synthetic')
        : t('passport.brand_own')}</span
    >
  </div>
  <h1>{t('passport.name')}</h1>
  <h2>{data.plan.name}</h2>
  <dl class="passport-meta">
    <div>
      <dt>{t('passport.alias')}</dt>
      <dd>{data.profile.alias}</dd>
    </div>
    <div>
      <dt>{t('passport.snapshot')}</dt>
      <dd>
        {t('passport.snapshot_value', {
          plan: data.plan.revision,
          profile: data.profile.revision,
        })}
      </dd>
    </div>
    <div>
      <dt>{t('passport.curriculum')}</dt>
      <dd>{data.curriculum.name} | {data.curriculum.version}</dd>
    </div>
    <div>
      <dt>{t('passport.generated')}</dt>
      <dd>{generatedDisplay}</dd>
    </div>
  </dl>
  <section>
    <h2>{t('passport.summary')}</h2>
    <p>
      {validation.findings.length
        ? t('passport.findings_need', { count: validation.findings.length })
        : t('passport.all_satisfied')}
    </p>
    <p>
      {t('passport.credits', {
        completed: validation.completed_credits,
        planned: validation.planned_credits,
        total: validation.graduation_credits,
        peak: validation.peak_credits,
        completion: validation.completion_term
          ? t('plan.change_semester', { term: validation.completion_term })
          : t('passport.unresolved'),
      })}
    </p>
    <p>
      {t('passport.setbacks', {
        list: data.plan.failed.join(', ') || t('passport.none'),
        ips: ipsNote,
      })}
    </p>
  </section>
  {#if data.profile.mission || data.profile.goals.length || data.profile.time_budget}<section
    >
      <h2>{t('passport.mission_section')}</h2>
      {#if data.profile.mission}<p>{data.profile.mission}</p>{/if}
      {#if data.profile.time_budget}<p>
          {t('passport.budget_line', {
            hours: formatHours(data.profile.time_budget.available_hours),
            minutes: data.profile.time_budget.minutes_per_credit,
          })}
        </p>{/if}
      {#if data.profile.goals.length}<ul>
          {#each data.profile.goals as goal (goal.id)}<li>
              <strong>{goal.title}</strong> | {t('overview.mission.goal_meta', {
                kind: goalKindLabel(goal.kind),
                range: goalRange(goal),
                hours: formatHours(goal.weekly_hours),
              })}
            </li>{/each}
        </ul>{/if}
    </section>{/if}
  <section>
    <h2>{t('passport.plan')}</h2>
    <div class="table-scroll">
      <table>
        <thead
          ><tr
            ><th>{t('passport.col.semester')}</th><th
              >{t('passport.col.courses')}</th
            ><th>{t('passport.col.credits')}</th><th
              >{t('passport.col.limit')}</th
            >{#if data.profile.time_budget}<th>{t('passport.col.hours')}</th
              >{/if}</tr
          ></thead
        ><tbody
          >{#each Object.entries(validation.loads) as [term, credits]}
            {@const hours = data.profile.time_budget
              ? semesterHours(
                  credits,
                  data.profile.goals,
                  +term,
                  data.profile.time_budget,
                )
              : null}
            <tr
              ><td>{term}</td><td
                >{data.curriculum.courses
                  .filter(
                    (c) =>
                      data.plan.assignments[c.code] === +term &&
                      (!data.profile.completed.includes(c.code) ||
                        data.plan.failed.includes(c.code)),
                  )
                  .map((c) => `${c.code} ${c.name}`)
                  .join('; ') || t('passport.no_courses')}</td
              ><td>{credits}</td><td>{validation.caps[term]}</td>{#if hours}<td>
                  {hours.over
                    ? t('passport.hours_over', {
                        total: formatHours(hours.totalHours),
                        available: formatHours(hours.availableHours),
                      })
                    : t('passport.hours_cell', {
                        total: formatHours(hours.totalHours),
                        available: formatHours(hours.availableHours),
                      })}
                </td>{/if}</tr
            >{/each}</tbody
        >
      </table>
    </div>
  </section>
  {#if data.plan.bottlenecks.length}<section>
      <h2>{t('passport.affected')}</h2>
      <ul>
        {#each data.plan.bottlenecks as blocker}<li>
            {blocker.path.join(' → ')}
          </li>{/each}
      </ul>
    </section>{/if}
  <section>
    <h2>{t('passport.rules')}</h2>
    {#if validation.findings.length}<ul>
        {#each validation.findings as finding}<li>
            <strong>{msg.ruleLabel(finding.rule)}:</strong>
            {msg.describe('finding', finding)}
          </li>{/each}
      </ul>{:else}<p>{t('passport.no_violations')}</p>{/if}
  </section>
  {#if studentNotes.trim()}<section>
      <h2>{t('passport.student_notes')}</h2>
      <p class="student-notes-body">{studentNotes.trim()}</p>
    </section>{/if}
  <section>
    <h2>{t('passport.questions')}</h2>
    <ol>
      {#each validation.advisor_items as question}<li>
          {msg.describe('advisor', question)}
        </li>{/each}
    </ol>
  </section>
  <section>
    <h2>{t('passport.sources')}</h2>
    {#each validation.assumption_items as assumption}<p>
        {assumption.code === 'DISCLAIMER'
          ? msg.disclaimer(data.curriculum)
          : msg.describe('assume', assumption)}
      </p>{/each}
    <p>
      {t('passport.source_line', {
        source: data.curriculum.source,
        version: data.curriculum.version,
        completed: data.profile.completed.join(', ') || t('passport.none'),
      })}
    </p>
  </section>
</article>
