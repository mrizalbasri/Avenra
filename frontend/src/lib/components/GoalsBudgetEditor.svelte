<script lang="ts">
  import { useI18n } from '#lib/i18n/context.js';
  import {
    DEFAULT_MINUTES_PER_CREDIT,
    GOAL_KINDS,
    MAX_GOALS,
    checkGoalsAndBudget,
    emptyGoal,
    previewCapWithoutGoals,
    type GoalDraft,
  } from '#lib/goals.js';

  let {
    availableHours = $bindable<number | null>(null),
    minutesPerCredit = $bindable<number | null>(DEFAULT_MINUTES_PER_CREDIT),
    goals = $bindable<GoalDraft[]>([]),
    maxTerms,
    currentTerm,
  }: {
    availableHours: number | null;
    minutesPerCredit: number | null;
    goals: GoalDraft[];
    maxTerms: number;
    currentTerm: number;
  } = $props();

  const { t } = useI18n();

  let issues = $derived(
    checkGoalsAndBudget(availableHours, minutesPerCredit, goals, maxTerms),
  );
  let impliedCap = $derived(
    previewCapWithoutGoals(availableHours, minutesPerCredit),
  );

  function addGoal() {
    if (goals.length >= MAX_GOALS) return;
    goals = [...goals, emptyGoal(currentTerm, maxTerms)];
  }

  function removeGoal(index: number) {
    goals = goals.filter((_, i) => i !== index);
  }
</script>

<div class="budget-editor">
  <div class="form-grid">
    <label
      >{t('goals.available_hours')}<input
        type="number"
        min="0"
        max="168"
        step="0.5"
        placeholder={t('goals.available_placeholder')}
        value={availableHours ?? ''}
        oninput={(e) => {
          const raw = e.currentTarget.value.trim();
          availableHours = raw === '' ? null : Number(raw);
          if (availableHours !== null && minutesPerCredit === null) {
            minutesPerCredit = DEFAULT_MINUTES_PER_CREDIT;
          }
        }}
      /></label
    ><label
      >{t('goals.minutes_per_credit')}<input
        type="number"
        min="60"
        max="300"
        step="5"
        value={minutesPerCredit ?? DEFAULT_MINUTES_PER_CREDIT}
        oninput={(e) => {
          const raw = e.currentTarget.value.trim();
          minutesPerCredit = raw === '' ? null : Number(raw);
        }}
      /></label
    >
  </div>
  <p class="muted small">{t('goals.minutes_hint')}</p>
  {#if impliedCap !== null}<p class="small budget-preview">
      {t('goals.implied_cap', {
        hours: availableHours ?? 0,
        cap: impliedCap,
      })}
    </p>{/if}

  <div class="section-heading goals-heading">
    <h3>{t('goals.list_heading')}</h3>
    <span class="tag"
      >{t('goals.count', { count: goals.length, max: MAX_GOALS })}</span
    >
  </div>
  <p class="muted small">{t('goals.list_hint')}</p>

  {#if goals.length}<ol class="goal-rows">
      {#each goals as goal, index (index)}<li class="course-row goal-row">
          <div class="course-row-head">
            <strong>{t('goals.item_label', { n: index + 1 })}</strong>
            <button
              type="button"
              class="button subtle small"
              aria-label={t('goals.remove_aria', { n: index + 1 })}
              onclick={() => removeGoal(index)}>{t('goals.remove')}</button
            >
          </div>
          <div class="course-row-fields">
            <label class="row-field row-name"
              >{t('goals.field_title')}<input
                aria-label={t('goals.field_aria', {
                  field: t('goals.field_title'),
                  n: index + 1,
                })}
                bind:value={goal.title}
                maxlength="80"
                placeholder={t('goals.title_placeholder')}
              /></label
            ><label class="row-field"
              >{t('goals.field_kind')}<select
                aria-label={t('goals.field_aria', {
                  field: t('goals.field_kind'),
                  n: index + 1,
                })}
                bind:value={goal.kind}
                >{#each GOAL_KINDS as kind}<option value={kind}
                    >{t(`goals.kind_${kind}`)}</option
                  >{/each}</select
              ></label
            ><label class="row-field"
              >{t('goals.field_start')}<input
                type="number"
                min="1"
                max={maxTerms}
                aria-label={t('goals.field_aria', {
                  field: t('goals.field_start'),
                  n: index + 1,
                })}
                bind:value={goal.start_term}
              /></label
            ><label class="row-field"
              >{t('goals.field_end')}<input
                type="number"
                min="1"
                max={maxTerms}
                aria-label={t('goals.field_aria', {
                  field: t('goals.field_end'),
                  n: index + 1,
                })}
                bind:value={goal.end_term}
              /></label
            ><label class="row-field"
              >{t('goals.field_hours')}<input
                type="number"
                min="0"
                max="168"
                step="0.5"
                aria-label={t('goals.field_aria', {
                  field: t('goals.field_hours'),
                  n: index + 1,
                })}
                bind:value={goal.weekly_hours}
              /></label
            >
          </div>
        </li>{/each}
    </ol>{:else}<p class="muted small">{t('goals.empty')}</p>{/if}

  {#if goals.length < MAX_GOALS}<button
      type="button"
      class="button"
      onclick={addGoal}>{t('goals.add')}</button
    >{/if}

  {#if issues.length}<ul class="finding-list warning-banner">
      {#each issues as issue}<li>
          <p>
            {t(
              `goals.error.${issue.code}` as 'goals.error.GOAL_TITLE',
              issue.params,
            )}
          </p>
        </li>{/each}
    </ul>{/if}
</div>
