<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import { useI18n } from '#lib/i18n/context.js';
  import { parseCoursesCSV, parseGpaRules } from '#lib/curriculum-import.js';
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
  let graduationCredits = $state<number | null>(null);
  let maxTerms = $state(14);
  let targetTerms = $state(8);
  let gpaRules = $state('3.00 = 24\n2.50 = 21\n2.00 = 18\n0.00 = 15');
  let csv = $state('');
  let busy = $state(false);
  let error = $state('');
  let filename = $state('');
  let preview = $derived.by(() => {
    try {
      return csv.trim() ? parseCoursesCSV(csv) : [];
    } catch {
      return [];
    }
  });
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
      const courses = parseCoursesCSV(csv);
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
    >{#if preview.length}<p class="success-text">
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
  <div class="warning-banner">{t('curriculum.warning')}</div>
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}<button
    class="button primary"
    disabled={busy || !csv.trim()}
    >{busy ? t('curriculum.validating') : t('curriculum.create')}</button
  >
  <p class="footnote">{t('curriculum.footnote')}</p>
</form>
