<script lang="ts">
  import { untrack } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import { useI18n } from '#lib/i18n/context.js';
  import {
    FIELDS,
    parseCurriculumTable,
    parseGpaRules,
    type Field,
  } from '#lib/curriculum-import.js';
  const { t, msg } = useI18n();
  let alias = $state('');
  let university = $state('');
  let program = $state('');
  let year = $state('2026');
  let source = $state('');
  let cap = $state(24);
  let currentTerm = $state(1);
  // Number inputs bind to null when empty.
  let lastGpa = $state<number | null>(null);
  let graduationCredits = $state<number | null>(144);
  let maxTerms = $state(14);
  let targetTerms = $state(8);
  let gpaRules = $state('3.00 = 24\n2.50 = 21\n2.00 = 18\n0.00 = 15');
  let csv = $state('');
  let busy = $state(false);
  let error = $state('');
  let filename = $state('');
  // The user's choices for columns the headers did not reveal, by column index.
  let columnFields = $state<Record<number, Field | ''>>({});
  let parsed = $derived(
    csv.trim() ? parseCurriculumTable(csv, columnFields) : null,
  );
  let preview = $derived(parsed?.courses ?? []);
  let tableCredits = $derived(preview.reduce((sum, c) => sum + c.credits, 0));
  // The API rejects graduation credits the listed courses cannot reach.
  let gradTooHigh = $derived(
    typeof graduationCredits === 'number' &&
      preview.length > 0 &&
      tableCredits < graduationCredits,
  );
  let ready = $derived(
    !!parsed &&
      parsed.issues.length === 0 &&
      parsed.courses.length > 0 &&
      !gradTooHigh,
  );
  let headerLine = $derived(csv.split(/\r?\n/).find((l) => l.trim()) ?? '');
  // A new table has different columns, so earlier choices no longer apply.
  $effect(() => {
    void headerLine;
    untrack(() => {
      columnFields = {};
    });
  });
  const separatorKey = {
    ',': 'import.sep.comma',
    ';': 'import.sep.semicolon',
    '\t': 'import.sep.tab',
    spaces: 'import.sep.spaces',
  } as const;
  const fieldLabel = (field: Field) => t(`import.field.${field}` as const);
  const shownIssues = $derived(parsed?.issues.slice(0, 20) ?? []);
  async function readFile(file?: File) {
    if (!file) return;
    if (file.size > 60000) {
      error = t('error.CSV_TOO_LARGE');
      return;
    }
    csv = await file.text();
    filename = file.name;
    error = '';
  }
  async function create() {
    busy = true;
    error = '';
    try {
      if (!parsed || parsed.issues.length) return;
      const courses = parsed.courses;
      const rules = parseGpaRules(gpaRules);
      await api('workspace/import', 'POST', {
        alias,
        current_term: currentTerm,
        last_gpa: typeof lastGpa === 'number' ? lastGpa : null,
        curriculum: {
          id: crypto.randomUUID(),
          name: `${university} | ${program}`,
          version: year,
          status: 'user_supplied',
          disclaimer:
            'User-supplied curriculum. Verify rules with your university.',
          source,
          credit_cap: cap,
          graduation_credits:
            typeof graduationCredits === 'number' ? graduationCredits : null,
          max_terms: maxTerms,
          target_terms: targetTerms,
          gpa_credit_rules: rules,
          courses,
        },
      });
      await invalidateAll();
      await goto('/profile');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{t('curriculum.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('curriculum.heading')}</h1>
    <p>{t('curriculum.lead')}</p>
  </div>
</div>
<form
  class="reading-column"
  onsubmit={(e) => {
    e.preventDefault();
    create();
  }}
>
  <section class="panel">
    <h2>{t('curriculum.context')}</h2>
    <div class="form-grid">
      <label
        >{t('curriculum.alias')}<input
          bind:value={alias}
          required
          maxlength="80"
          placeholder={t('curriculum.alias_placeholder')}
        /></label
      ><label
        >{t('curriculum.university')}<input
          bind:value={university}
          required
          maxlength="70"
          placeholder={t('curriculum.university_placeholder')}
        /></label
      ><label
        >{t('curriculum.program')}<input
          bind:value={program}
          required
          maxlength="70"
          placeholder={t('curriculum.program_placeholder')}
        /></label
      ><label
        >{t('curriculum.version')}<input
          bind:value={year}
          required
          maxlength="80"
        /></label
      ><label
        >{t('curriculum.current')}<input
          type="number"
          min="1"
          max="14"
          bind:value={currentTerm}
          required
        /></label
      ><label
        >{t('curriculum.last_ips')}<input
          type="number"
          min="0"
          max="4"
          step="0.01"
          bind:value={lastGpa}
          placeholder={t('curriculum.ips_placeholder')}
        /></label
      ><label
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
        bind:value={gpaRules}
        rows="4"
        placeholder="3.00 = 24"
      ></textarea></label
    >
    <p class="muted small">{t('curriculum.ips_rules_hint')}</p>
    <label
      >{t('curriculum.source')}<input
        bind:value={source}
        required
        maxlength="500"
        placeholder={t('curriculum.source_placeholder')}
      /></label
    >
  </section>
  <section class="panel">
    <div class="section-heading">
      <h2>{t('curriculum.import')}</h2>
      <a href="/curriculum-template.csv" download class="button"
        >{t('curriculum.template')}</a
      >
    </div>
    <p class="muted small">
      {t('curriculum.csv_hint_a')}<code>A|B</code>{t('curriculum.csv_hint_b')}
    </p>
    <p class="muted small">{t('import.paste_hint')}</p>
    <label
      >{t('curriculum.choose_file')}<input
        type="file"
        accept=".csv,text/csv"
        onchange={(e) => readFile(e.currentTarget.files?.[0])}
      /></label
    ><label
      >{t('curriculum.paste')}<textarea
        bind:value={csv}
        rows="9"
        placeholder="code,name,credits,recommended_term,prerequisites,offered_terms,category,corequisites,min_credits"
      ></textarea></label
    >{#if parsed}
      <p class="muted small">
        {t('import.separator', { name: t(separatorKey[parsed.delimiter]) })}
      </p>
      <details class="column-map" open={parsed.missing.length > 0}>
        <summary class="small">{t('import.columns')}</summary>
        <div class="table-scroll">
          <table>
            <tbody
              >{#each parsed.columns as column (column.index)}<tr
                  ><td>{column.header || `#${column.index + 1}`}</td><td
                    ><select
                      aria-label={t('import.column_aria', {
                        header: column.header || `#${column.index + 1}`,
                      })}
                      value={column.field ?? ''}
                      onchange={(e) => {
                        columnFields = {
                          ...columnFields,
                          [column.index]: e.currentTarget.value as Field | '',
                        };
                      }}
                      ><option value=""
                        >{column.field === null && column.auto
                          ? t('import.guess')
                          : t('import.ignore')}</option
                      >{#each FIELDS as field}<option value={field}
                          >{fieldLabel(field)}</option
                        >{/each}</select
                    ></td
                  ></tr
                >{/each}</tbody
            >
          </table>
        </div>
      </details>
      {#if parsed.issues.length}<div class="warning-banner">
          <strong>{t('import.issues', { count: parsed.issues.length })}</strong>
          <ul class="finding-list">
            {#each shownIssues as issue}<li>
                <p>{msg.describe('import', issue)}</p>
              </li>{/each}
          </ul>
          {#if parsed.issues.length > shownIssues.length}<p class="small">
              {t('import.more', {
                count: parsed.issues.length - shownIssues.length,
              })}
            </p>{/if}
        </div>{/if}
    {/if}{#if preview.length}<p class="success-text">
        {t('curriculum.ready', {
          count: preview.length,
          from: filename ? t('curriculum.from_file', { filename }) : '',
        })}
      </p>
      <div class="table-scroll">
        <table>
          <thead
            ><tr
              ><th>{t('curriculum.col.code')}</th><th
                >{t('curriculum.col.course')}</th
              ><th>{t('curriculum.col.credits')}</th><th
                >{t('curriculum.col.prereq')}</th
              ></tr
            ></thead
          ><tbody
            >{#each preview.slice(0, 8) as c}<tr
                ><td>{c.code}</td><td>{c.name}</td><td>{c.credits}</td><td
                  >{c.prerequisites.join(', ') || t('curriculum.none')}</td
                ></tr
              >{/each}</tbody
          >
        </table>
      </div>{/if}
  </section>
  {#if gradTooHigh}<p class="warning-banner" role="status">
      {t('curriculum.grad_too_high', {
        total: tableCredits,
        target: graduationCredits ?? 0,
      })}
    </p>{/if}
  <div class="warning-banner">{t('curriculum.warning')}</div>
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}<button
    class="button primary"
    disabled={busy || !ready}
    >{busy ? t('curriculum.validating') : t('curriculum.create')}</button
  >
  <p class="footnote">{t('curriculum.footnote')}</p>
</form>
