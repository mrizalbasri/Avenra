<script lang="ts">
  import Icon from '#lib/components/Icon.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import {
    emptyRow,
    type CourseRow,
    type Field,
    type Issue,
  } from '#lib/curriculum-import.js';

  // Rows are edited in place; issues come from checkCourseRows and are numbered from 1.
  let { rows = $bindable(), issues }: { rows: CourseRow[]; issues: Issue[] } =
    $props();
  const { t, msg } = useI18n();

  const textFields = [
    ['code', 'code'],
    ['name', 'name'],
    ['credits', 'credits'],
    ['recommended_term', 'recommended_term'],
    ['prerequisites', 'prerequisites'],
    ['corequisites', 'corequisites'],
    ['min_credits', 'min_credits'],
  ] as const satisfies readonly (readonly [keyof CourseRow, Field])[];

  const label = (field: Field, n: number) =>
    t('start.row_field', { field: t(`import.field.${field}`), n });
  const rowIssues = (n: number) => issues.filter((issue) => issue.row === n);
  const offering = (row: CourseRow) => {
    const value = row.offered_terms.trim().toLowerCase();
    return ['odd', 'ganjil'].includes(value)
      ? 'odd'
      : ['even', 'genap'].includes(value)
        ? 'even'
        : '';
  };
  const elective = (row: CourseRow) =>
    ['elective', 'pilihan'].includes(row.category.trim().toLowerCase());
</script>

{#if rows.length}<ol class="course-rows">
    {#each rows as row, index (index)}
      {@const n = index + 1}
      <li class="course-row" class:has-issue={rowIssues(n).length > 0}>
        <div class="course-row-head">
          <strong>{t('start.row_label', { n })}</strong>
          <button
            type="button"
            class="button subtle icon-button"
            aria-label={t('start.remove_row', { n })}
            onclick={() => (rows = rows.filter((_, i) => i !== index))}
            ><Icon name="close" size={15} /></button
          >
        </div>
        <div class="course-row-fields">
          {#each textFields as [key, field] (key)}<label
              class={`row-field row-${key}`}
              ><span>{t(`import.field.${field}`)}</span><input
                aria-label={label(field, n)}
                inputmode={[
                  'credits',
                  'recommended_term',
                  'min_credits',
                ].includes(key)
                  ? 'numeric'
                  : undefined}
                bind:value={row[key]}
              /></label
            >{/each}
          <label class="row-field"
            ><span>{t('import.field.offered_terms')}</span><select
              aria-label={label('offered_terms', n)}
              value={offering(row)}
              onchange={(e) => (row.offered_terms = e.currentTarget.value)}
              ><option value="">{t('offer.every')}</option><option value="odd"
                >{t('offer.odd')}</option
              ><option value="even">{t('offer.even')}</option></select
            ></label
          ><label class="row-field"
            ><span>{t('import.field.category')}</span><select
              aria-label={label('category', n)}
              value={elective(row) ? 'elective' : ''}
              onchange={(e) => (row.category = e.currentTarget.value)}
              ><option value="">{t('course.required')}</option><option
                value="elective">{t('course.elective')}</option
              ></select
            ></label
          >
        </div>
        {#if rowIssues(n).length}<ul class="row-issues">
            {#each rowIssues(n) as issue}<li>
                {msg.describe('import', issue)}
              </li>{/each}
          </ul>{/if}
      </li>
    {/each}
  </ol>{:else}<p class="muted small">{t('start.rows_empty')}</p>{/if}
<button
  type="button"
  class="button"
  onclick={() => (rows = [...rows, emptyRow()])}
  ><Icon name="plus" size={15} />{t('start.add_row')}</button
>
