<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import GoalsBudgetEditor from '#lib/components/GoalsBudgetEditor.svelte';
  import CourseRowsEditor from '#lib/components/start/CourseRowsEditor.svelte';
  import {
    checkCourseRows,
    checkPassed,
    courseToRow,
    parseGpaRules,
    rowsToCourses,
    type CourseRow,
  } from '#lib/curriculum-import.js';
  import {
    DEFAULT_MINUTES_PER_CREDIT,
    buildGoalsPayload,
    buildTimeBudget,
    checkGoalsAndBudget,
    goalToDraft,
    type GoalDraft,
  } from '#lib/goals.js';
  import { useI18n } from '#lib/i18n/context.js';
  import type { Curriculum, Profile, Workspace } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, msg } = useI18n();
  let alias = $state(untrack(() => data.workspace?.profile?.alias ?? ''));
  let currentTerm = $state(
    untrack(() => data.workspace?.profile?.current_term ?? 2),
  );
  let completed = $state<string[]>(
    untrack(() => [...(data.workspace?.profile?.completed ?? [])]),
  );
  let revision = $state(untrack(() => data.workspace?.profile?.revision ?? 1));
  let lastGpa = $state<number | null>(
    untrack(() => data.workspace?.profile?.last_gpa ?? null),
  );
  let mission = $state(untrack(() => data.workspace?.profile?.mission ?? ''));
  let availableHours = $state<number | null>(
    untrack(
      () => data.workspace?.profile?.time_budget?.available_hours ?? null,
    ),
  );
  let minutesPerCredit = $state<number | null>(
    untrack(
      () =>
        data.workspace?.profile?.time_budget?.minutes_per_credit ??
        DEFAULT_MINUTES_PER_CREDIT,
    ),
  );
  let goals = $state<GoalDraft[]>(
    untrack(() => (data.workspace?.profile?.goals ?? []).map(goalToDraft)),
  );
  let budgetIssues = $derived(
    checkGoalsAndBudget(
      availableHours,
      minutesPerCredit,
      goals,
      data.workspace?.curriculum.max_terms ?? 14,
    ),
  );
  let notice = $state('');
  let busy = $state(false);
  let error = $state('');

  // Editable curriculum state (reusing the wizard's rows-table component).
  const formatGpaRules = (c?: Curriculum) =>
    (c?.gpa_credit_rules ?? [])
      .map((rule) => `${rule.min_gpa.toFixed(2)} = ${rule.max_credits}`)
      .join('\n');
  let courseRows = $state<CourseRow[]>(
    untrack(() => (data.workspace?.curriculum.courses ?? []).map(courseToRow)),
  );
  let cap = $state<number | null>(
    untrack(() => data.workspace?.curriculum.credit_cap ?? 24),
  );
  let graduationCredits = $state<number | null>(
    untrack(() => data.workspace?.curriculum.graduation_credits ?? null),
  );
  let targetTerms = $state<number | null>(
    untrack(() => data.workspace?.curriculum.target_terms ?? 8),
  );
  let maxTerms = $state<number | null>(
    untrack(() => data.workspace?.curriculum.max_terms ?? 14),
  );
  let gpaRulesText = $state(
    untrack(() => formatGpaRules(data.workspace?.curriculum)),
  );
  let curriculumBusy = $state(false);
  let curriculumError = $state('');
  let curriculumNotice = $state('');

  let rowIssues = $derived(checkCourseRows(courseRows));
  let editedCourses = $derived(
    rowIssues.length ? [] : rowsToCourses(courseRows),
  );
  let editedCredits = $derived(
    rowsToCourses(courseRows)
      .map((c) => c.credits)
      .filter(Number.isFinite)
      .reduce((sum, credits) => sum + credits, 0),
  );
  let parsedGpa = $derived.by(() => {
    try {
      return { rules: parseGpaRules(gpaRulesText), error: '' };
    } catch (e) {
      return { rules: [], error: msg.errorText(e) };
    }
  });
  let curriculumProblems = $derived.by(() => {
    const problems: string[] = [];
    if (!editedCourses.length) return problems;
    const total = editedCourses.reduce((sum, c) => sum + c.credits, 0);
    const required = editedCourses
      .filter((c) => c.category === 'required')
      .reduce((sum, c) => sum + c.credits, 0);
    if (typeof graduationCredits === 'number' && total < graduationCredits)
      problems.push(
        t('curriculum.grad_too_high', { total, target: graduationCredits }),
      );
    if (typeof graduationCredits === 'number' && required > graduationCredits)
      problems.push(
        t('start.required_over', { required, target: graduationCredits }),
      );
    const max = maxTerms ?? 14;
    if (editedCourses.some((c) => c.recommended_term > max))
      problems.push(t('start.term_beyond', { max }));
    if ((targetTerms ?? 0) > max) problems.push(t('start.target_beyond'));
    if (currentTerm > max)
      problems.push(t('start.current_beyond', { current: currentTerm }));
    const editedCodes = new Set(editedCourses.map((c) => c.code));
    const storedCompleted = data.workspace?.profile?.completed ?? [];
    const removedPassed = storedCompleted.filter(
      (code) => !editedCodes.has(code),
    );
    if (removedPassed.length)
      problems.push(
        t('profile.courses_removed_passed', {
          courses: removedPassed.join(', '),
        }),
      );
    else {
      const broken = checkPassed(editedCourses, storedCompleted);
      if (broken.length) {
        problems.push(
          t('start.passed_issues') +
            ' ' +
            broken
              .map((issue) =>
                t('error.issue', {
                  course: issue.course,
                  missing: issue.missing
                    .map((m) => (Array.isArray(m) ? m.join(t('list.or')) : m))
                    .join(', '),
                }),
              )
              .join('; '),
        );
      }
    }
    if (parsedGpa.error) problems.push(parsedGpa.error);
    return problems;
  });
  let curriculumNumbersOk = $derived(
    [cap, targetTerms, maxTerms].every(
      (v) => Number.isInteger(v) && (v as number) >= 1,
    ) &&
      cap! <= 24 &&
      maxTerms! <= 14 &&
      (graduationCredits === null ||
        (Number.isInteger(graduationCredits) &&
          graduationCredits >= 1 &&
          graduationCredits <= 300)),
  );
  let curriculumOk = $derived(
    editedCourses.length > 0 &&
      curriculumProblems.length === 0 &&
      curriculumNumbersOk,
  );

  async function saveCurriculum() {
    if (!data.workspace?.curriculum || !curriculumOk) return;
    curriculumBusy = true;
    curriculumError = '';
    curriculumNotice = '';
    try {
      const base = data.workspace.curriculum;
      const updated = await api<Workspace>('curriculum', 'PATCH', {
        revision,
        curriculum: {
          ...base,
          credit_cap: cap,
          graduation_credits: graduationCredits,
          target_terms: targetTerms,
          max_terms: maxTerms,
          gpa_credit_rules: parsedGpa.rules,
          courses: editedCourses,
        },
      });
      if (updated.profile) revision = updated.profile.revision;
      courseRows = updated.curriculum.courses.map(courseToRow);
      cap = updated.curriculum.credit_cap;
      graduationCredits = updated.curriculum.graduation_credits;
      targetTerms = updated.curriculum.target_terms;
      maxTerms = updated.curriculum.max_terms;
      gpaRulesText = formatGpaRules(updated.curriculum);
      await invalidateAll();
      curriculumNotice = t('profile.courses_saved');
    } catch (e) {
      curriculumError = msg.errorText(e);
    } finally {
      curriculumBusy = false;
    }
  }
  async function save() {
    if (budgetIssues.length) return;
    busy = true;
    error = '';
    notice = '';
    try {
      const profile = await api<Profile>('profile', 'PATCH', {
        alias,
        current_term: currentTerm,
        completed,
        last_gpa: lastGpa,
        mission: mission.trim() || null,
        time_budget: buildTimeBudget(availableHours, minutesPerCredit),
        goals: buildGoalsPayload(goals),
        revision,
      });
      revision = profile.revision;
      mission = profile.mission ?? '';
      availableHours = profile.time_budget?.available_hours ?? null;
      minutesPerCredit =
        profile.time_budget?.minutes_per_credit ?? DEFAULT_MINUTES_PER_CREDIT;
      goals = (profile.goals ?? []).map(goalToDraft);
      await invalidateAll();
      notice = t('profile.saved');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{t('profile.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('profile.heading')}</h1>
    <p>{t('profile.lead')}</p>
  </div>
</div>
{#if data.workspace?.profile}<form
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <section class="panel profile-form">
      <h2>{t('profile.panel')}</h2>
      <p class="muted">{t('profile.alias_hint')}</p>
      <div class="form-grid">
        <label
          >{t('profile.alias')}<input
            bind:value={alias}
            maxlength="80"
            required
          /></label
        ><label
          >{t('profile.current')}<input
            type="number"
            min="1"
            max={data.workspace.curriculum.max_terms}
            bind:value={currentTerm}
            required
          /></label
        ><label
          >{t('profile.last_ips')}<input
            type="number"
            min="0"
            max="4"
            step="0.01"
            placeholder={t('profile.ips_placeholder')}
            value={lastGpa ?? ''}
            onchange={(e) => {
              const value = e.currentTarget.value;
              lastGpa =
                value === ''
                  ? null
                  : Math.max(0, Math.min(4, Math.round(+value * 100) / 100));
            }}
          /></label
        >
      </div>
      {#if data.workspace.curriculum.gpa_credit_rules.length}<p
          class="muted small"
        >
          {t('profile.ips_limits', {
            list: [...data.workspace.curriculum.gpa_credit_rules]
              .sort((a, b) => b.min_gpa - a.min_gpa)
              .map((r) =>
                t('profile.ips_limit_item', {
                  gpa: r.min_gpa.toFixed(2),
                  credits: r.max_credits,
                }),
              )
              .join('; '),
          })}
        </p>{/if}
    </section>
    <section class="panel">
      <h2>{t('profile.mission_section')}</h2>
      <p class="muted small">{t('profile.mission_lead')}</p>
      <label
        >{t('start.mission')}<textarea
          bind:value={mission}
          maxlength="500"
          rows="3"
          placeholder={t('start.mission_placeholder')}
        ></textarea></label
      >
      <p class="muted small">
        {t('start.mission_count', { count: mission.length })}
      </p>
      <GoalsBudgetEditor
        bind:availableHours
        bind:minutesPerCredit
        bind:goals
        maxTerms={data.workspace.curriculum.max_terms}
        {currentTerm}
      />
    </section>
    <section class="panel">
      <div class="section-heading">
        <h2>{t('profile.completed')}</h2>
        <span class="tag"
          >{t('profile.selected', { count: completed.length })}</span
        >
      </div>
      <p class="muted small">{t('profile.completed_hint')}</p>
      <div class="course-checklist">
        {#each data.workspace.curriculum.courses as course}<label
            ><input
              type="checkbox"
              bind:group={completed}
              value={course.code}
            />
            <div>
              <strong>{course.name}</strong><small
                >{t('profile.course_line', {
                  code: course.code,
                  credits: course.credits,
                  term: course.recommended_term,
                  extra:
                    course.category === 'elective'
                      ? t('profile.elective_extra')
                      : '',
                })}</small
              >
            </div></label
          >{/each}
      </div>
    </section>
    {#if error}<p class="error-banner" role="alert">
        {error}
      </p>{/if}{#if notice}<p class="success-banner" role="status">
        {notice}
      </p>{/if}<button
      class="button primary"
      disabled={busy || budgetIssues.length > 0}
      >{busy ? t('profile.saving') : t('profile.save')}</button
    >
  </form>
  <details class="panel edit-courses">
    <summary class="edit-courses-summary">
      <span>{t('profile.edit_courses')}</span>
      <span class="tag"
        >{t('start.total', {
          count: courseRows.length,
          credits: editedCredits,
        })}</span
      >
    </summary>
    <p class="muted small">{t('profile.edit_courses_hint')}</p>
    {#if rowIssues.length && courseRows.length}<p class="warning-banner small">
        {t('start.rows_issues', { count: rowIssues.length })}
      </p>{/if}
    <CourseRowsEditor bind:rows={courseRows} issues={rowIssues} />
    <h3>{t('start.rules_heading')}</h3>
    <div class="form-grid">
      <label
        >{t('curriculum.max_credits')}<input
          type="number"
          min="1"
          max="24"
          bind:value={cap}
          required
        /></label
      ><label
        >{t('curriculum.grad_credits')}<input
          type="number"
          min="1"
          max="300"
          bind:value={graduationCredits}
          placeholder={t('curriculum.grad_placeholder')}
        /></label
      ><label
        >{t('curriculum.on_time')}<input
          type="number"
          min="1"
          max="14"
          bind:value={targetTerms}
          required
        /></label
      ><label
        >{t('curriculum.max_period')}<input
          type="number"
          min="1"
          max="14"
          bind:value={maxTerms}
          required
        /></label
      >
    </div>
    <label
      >{t('curriculum.ips_rules')}<textarea
        bind:value={gpaRulesText}
        rows="4"
        placeholder="3.00 = 24"
      ></textarea></label
    >
    <p class="muted small">{t('curriculum.ips_rules_hint')}</p>
    {#if curriculumProblems.length}<ul class="finding-list warning-banner">
        {#each curriculumProblems as problem}<li><p>{problem}</p></li>{/each}
      </ul>{/if}
    {#if curriculumError}<p class="error-banner" role="alert">
        {curriculumError}
      </p>{/if}{#if curriculumNotice}<p class="success-banner" role="status">
        {curriculumNotice}
      </p>{/if}<button
      type="button"
      class="button primary"
      disabled={curriculumBusy || !curriculumOk}
      onclick={saveCurriculum}
      >{curriculumBusy
        ? t('profile.saving_courses')
        : t('profile.save_courses')}</button
    >
  </details>{:else}<div class="empty-panel">
    <h2>{t('profile.none')}</h2>
    <a class="button primary" href="/">{t('profile.open_demo')}</a>
  </div>{/if}
