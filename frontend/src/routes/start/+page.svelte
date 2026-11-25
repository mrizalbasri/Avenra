<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import Icon from '#lib/components/Icon.svelte';
  import GoalsBudgetEditor from '#lib/components/GoalsBudgetEditor.svelte';
  import CourseRowsEditor from '#lib/components/start/CourseRowsEditor.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import {
    DEFAULT_MINUTES_PER_CREDIT,
    GOAL_KINDS,
    MAX_GOALS,
    buildGoalsPayload,
    buildTimeBudget,
    checkGoalsAndBudget,
    type GoalDraft,
  } from '#lib/goals.js';
  import {
    FIELDS,
    checkCourseRows,
    checkPassed,
    courseToRow,
    emptyRow,
    parseCurriculumTable,
    parseCurriculumTemplateJson,
    parseGpaRules,
    rowsToCourses,
    type CourseRow,
    type Field,
  } from '#lib/curriculum-import.js';
  import type { Curriculum } from '#lib/types.js';

  const { t, msg } = useI18n();
  const draftKey = 'avenra-start-draft-v1';
  const DEFAULT_IPS = '3.00 = 24\n2.50 = 21\n2.00 = 18\n0.00 = 15';

  type Draft = {
    step: 1 | 2 | 3 | 4;
    alias: string;
    currentTerm: number | null;
    lastGpa: number | null;
    mission: string;
    paste: string;
    columnFields: Record<number, Field | ''>;
    rows: CourseRow[];
    fromExample: boolean;
    university: string;
    program: string;
    version: string;
    source: string;
    cap: number | null;
    graduationCredits: number | null;
    targetTerms: number | null;
    maxTerms: number | null;
    gpaRules: string;
    completed: string[];
    availableHours: number | null;
    minutesPerCredit: number | null;
    goals: GoalDraft[];
  };
  const fresh = (): Draft => ({
    step: 1,
    alias: '',
    currentTerm: 1,
    lastGpa: null,
    mission: '',
    paste: '',
    columnFields: {},
    rows: [],
    fromExample: false,
    university: '',
    program: '',
    version: String(new Date().getFullYear()),
    source: '',
    cap: 24,
    graduationCredits: 144,
    targetTerms: 8,
    maxTerms: 14,
    gpaRules: DEFAULT_IPS,
    completed: [],
    availableHours: null,
    minutesPerCredit: DEFAULT_MINUTES_PER_CREDIT,
    goals: [],
  });

  let d = $state<Draft>(fresh());
  let hydrated = $state(false);
  let restored = $state(false);
  let busy = $state(false);
  let loadingExample = $state(false);
  let error = $state('');
  let templateNotice = $state('');

  const ROW_KEYS = Object.keys(emptyRow()) as (keyof CourseRow)[];
  // A stored draft is user-controlled data: accept it only when its shape is right.
  function readDraft(value: unknown): Draft | null {
    if (!value || typeof value !== 'object') return null;
    const draft = { ...fresh(), ...(value as Partial<Draft>) };
    const text = (v: unknown) => typeof v === 'string';
    const num = (v: unknown) => v === null || typeof v === 'number';
    const rowOk = (row: unknown) =>
      !!row &&
      typeof row === 'object' &&
      ROW_KEYS.every((key) => text((row as Record<string, unknown>)[key]));
    const goalOk = (goal: unknown) => {
      if (!goal || typeof goal !== 'object') return false;
      const g = goal as Record<string, unknown>;
      return (
        text(g.title) &&
        typeof g.kind === 'string' &&
        (GOAL_KINDS as readonly string[]).includes(g.kind) &&
        num(g.start_term) &&
        num(g.end_term) &&
        num(g.weekly_hours)
      );
    };
    const ok =
      [1, 2, 3, 4].includes(draft.step) &&
      [
        draft.alias,
        draft.mission,
        draft.paste,
        draft.university,
        draft.program,
        draft.version,
        draft.source,
        draft.gpaRules,
      ].every(text) &&
      [
        draft.currentTerm,
        draft.lastGpa,
        draft.cap,
        draft.graduationCredits,
        draft.targetTerms,
        draft.maxTerms,
        draft.availableHours,
        draft.minutesPerCredit,
      ].every(num) &&
      Array.isArray(draft.rows) &&
      draft.rows.length <= 200 &&
      draft.rows.every(rowOk) &&
      Array.isArray(draft.completed) &&
      draft.completed.every(text) &&
      Array.isArray(draft.goals) &&
      draft.goals.length <= MAX_GOALS &&
      draft.goals.every(goalOk) &&
      typeof draft.columnFields === 'object' &&
      typeof draft.fromExample === 'boolean';
    if (!ok) return null;
    // Keep only the known fields, so a stored draft cannot add others.
    draft.rows = draft.rows.map((row) =>
      Object.fromEntries(ROW_KEYS.map((key) => [key, row[key]])),
    ) as CourseRow[];
    draft.goals = draft.goals.map((goal) => ({
      title: goal.title,
      kind: goal.kind,
      start_term: goal.start_term,
      end_term: goal.end_term,
      weekly_hours: goal.weekly_hours,
    }));
    return draft;
  }

  onMount(() => {
    try {
      const stored = readDraft(
        JSON.parse(localStorage.getItem(draftKey) ?? 'null'),
      );
      if (stored) {
        d = stored;
        restored = true;
      }
    } catch {
      /* A corrupted draft is ignored; the wizard starts empty. */
    }
    hydrated = true;
  });
  $effect(() => {
    const snapshot = JSON.stringify(d);
    if (!untrack(() => hydrated)) return;
    try {
      localStorage.setItem(draftKey, snapshot);
    } catch {
      /* Without storage the wizard still works, it just cannot recover a draft. */
    }
  });

  function startOver() {
    if (!window.confirm(t('start.start_over_confirm'))) return;
    d = fresh();
    restored = false;
    error = '';
    templateNotice = '';
    localStorage.removeItem(draftKey);
  }

  // Step 1
  let step1Ok = $derived(
    d.alias.trim().length > 0 &&
      d.alias.length <= 80 &&
      Number.isInteger(d.currentTerm) &&
      d.currentTerm! >= 1 &&
      d.currentTerm! <= 14 &&
      (d.lastGpa === null || (d.lastGpa >= 0 && d.lastGpa <= 4)) &&
      d.mission.length <= 500,
  );

  // Step 2: the pasted table
  let parsed = $derived(
    d.paste.trim() ? parseCurriculumTable(d.paste, d.columnFields) : null,
  );
  let tableIssues = $derived(
    parsed?.issues.filter((issue) => issue.row === undefined) ?? [],
  );
  let canUseTable = $derived(
    !!parsed &&
      parsed.missing.length === 0 &&
      parsed.rows.length > 0 &&
      !tableIssues.some((issue) => issue.code === 'UNCLOSED_QUOTE'),
  );
  const headerOf = (text: string) =>
    text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  // A new table has different columns, so earlier column choices no longer apply.
  function setPaste(text: string) {
    if (headerOf(text) !== headerOf(d.paste)) d.columnFields = {};
    d.paste = text;
    templateNotice = '';
  }
  const separatorKey = {
    ',': 'import.sep.comma',
    ';': 'import.sep.semicolon',
    '\t': 'import.sep.tab',
    spaces: 'import.sep.spaces',
  } as const;

  function useTable() {
    if (!parsed) return;
    d.rows = parsed.rows.map((row) => ({ ...row }));
    d.fromExample = false;
    d.completed = [];
    templateNotice = '';
  }
  async function useExample() {
    loadingExample = true;
    error = '';
    templateNotice = '';
    try {
      const example = await api<Curriculum>('curriculum/example');
      d.rows = example.courses.map(courseToRow);
      d.fromExample = true;
      d.completed = [];
      d.version = example.version;
      d.source = example.source;
      d.cap = example.credit_cap;
      d.graduationCredits = example.graduation_credits;
      d.targetTerms = example.target_terms;
      d.maxTerms = example.max_terms;
      d.gpaRules = example.gpa_credit_rules
        .map((rule) => `${rule.min_gpa.toFixed(2)} = ${rule.max_credits}`)
        .join('\n');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      loadingExample = false;
    }
  }
  async function readFile(file?: File) {
    if (!file) return;
    error = '';
    templateNotice = '';
    if (file.size > 200000) {
      const looksJson =
        file.name.toLowerCase().endsWith('.json') ||
        file.type === 'application/json';
      error = looksJson
        ? t('error.INVALID_CURRICULUM_JSON')
        : t('error.CSV_TOO_LARGE');
      return;
    }
    const content = await file.text();
    const isJson =
      file.name.toLowerCase().endsWith('.json') ||
      file.type === 'application/json' ||
      content.trimStart().startsWith('{');
    if (isJson) {
      try {
        const tmpl = parseCurriculumTemplateJson(content);
        d.rows = tmpl.courses.map(courseToRow);
        d.university = tmpl.university;
        d.program = tmpl.program;
        d.version = tmpl.version;
        d.source = tmpl.source;
        d.cap = tmpl.credit_cap;
        d.graduationCredits = tmpl.graduation_credits;
        d.targetTerms = tmpl.target_terms;
        d.maxTerms = tmpl.max_terms;
        d.gpaRules = tmpl.gpa_credit_rules
          .map((rule) => `${rule.min_gpa.toFixed(2)} = ${rule.max_credits}`)
          .join('\n');
        d.completed = [];
        d.fromExample = false;
        d.paste = '';
        templateNotice = t('start.template_loaded');
      } catch (e) {
        error = msg.errorText(e);
      }
      return;
    }
    if (file.size > 60000) {
      error = t('error.CSV_TOO_LARGE');
      return;
    }
    setPaste(content);
  }

  // Step 2: the edited rows and program rules
  let rowIssues = $derived(checkCourseRows(d.rows));
  let courses = $derived(rowIssues.length ? [] : rowsToCourses(d.rows));
  let validCredits = $derived(
    rowsToCourses(d.rows)
      .map((course) => course.credits)
      .filter(Number.isFinite)
      .reduce((sum, credits) => sum + credits, 0),
  );
  let gpa = $derived.by(() => {
    try {
      return { rules: parseGpaRules(d.gpaRules), error: '' };
    } catch (e) {
      return { rules: [], error: msg.errorText(e) };
    }
  });
  let ruleProblems = $derived.by(() => {
    const problems: string[] = [];
    if (![d.university, d.program, d.version, d.source].every((v) => v.trim()))
      problems.push(t('start.missing_context'));
    if (!courses.length) return problems;
    const total = courses.reduce((sum, c) => sum + c.credits, 0);
    const required = courses
      .filter((c) => c.category === 'required')
      .reduce((sum, c) => sum + c.credits, 0);
    const target = d.graduationCredits;
    if (typeof target === 'number' && total < target)
      problems.push(t('curriculum.grad_too_high', { total, target }));
    if (typeof target === 'number' && required > target)
      problems.push(t('start.required_over', { required, target }));
    const max = d.maxTerms ?? 14;
    if (courses.some((c) => c.recommended_term > max))
      problems.push(t('start.term_beyond', { max }));
    if ((d.targetTerms ?? 0) > max) problems.push(t('start.target_beyond'));
    if ((d.currentTerm ?? 0) > max)
      problems.push(t('start.current_beyond', { current: d.currentTerm ?? 0 }));
    if (gpa.error) problems.push(gpa.error);
    return problems;
  });
  let numbersOk = $derived(
    [d.cap, d.targetTerms, d.maxTerms].every(
      (v) => Number.isInteger(v) && v! >= 1,
    ) &&
      d.cap! <= 24 &&
      d.maxTerms! <= 14 &&
      (d.graduationCredits === null ||
        (Number.isInteger(d.graduationCredits) &&
          d.graduationCredits >= 1 &&
          d.graduationCredits <= 300)),
  );
  let step2Ok = $derived(
    courses.length > 0 && ruleProblems.length === 0 && numbersOk,
  );

  // Step 3
  let codes = $derived(new Set(courses.map((c) => c.code)));
  // Rows edited after ticking may have removed a course.
  let passed = $derived(d.completed.filter((code) => codes.has(code)));
  let passedCredits = $derived(
    courses
      .filter((c) => passed.includes(c.code))
      .reduce((sum, c) => sum + c.credits, 0),
  );
  let passedIssues = $derived(checkPassed(courses, passed));
  let terms = $derived(
    [...new Set(courses.map((c) => c.recommended_term))].sort((a, b) => a - b),
  );
  let markUntil = $derived((d.currentTerm ?? 1) - 1);
  function markEarlierSemesters() {
    const earlier = courses
      .filter((c) => c.recommended_term <= markUntil)
      .map((c) => c.code);
    d.completed = [...new Set([...passed, ...earlier])];
  }
  const issueText = (issue: {
    course: string;
    missing: (string | string[])[];
  }) =>
    t('error.issue', {
      course: issue.course,
      missing: issue.missing
        .map((m) => (Array.isArray(m) ? m.join(t('list.or')) : m))
        .join(', '),
    });

  // Step 4 (optional)
  let budgetIssues = $derived(
    checkGoalsAndBudget(
      d.availableHours,
      d.minutesPerCredit,
      d.goals,
      d.maxTerms ?? 14,
    ),
  );

  async function submit(includeBudget = true) {
    if (!step1Ok || !step2Ok || passedIssues.length) return;
    if (includeBudget && budgetIssues.length) return;
    busy = true;
    error = '';
    try {
      await api('workspace/import', 'POST', {
        alias: d.alias,
        current_term: d.currentTerm,
        last_gpa: d.lastGpa,
        mission: d.mission.trim() || null,
        completed: passed,
        time_budget: includeBudget
          ? buildTimeBudget(d.availableHours, d.minutesPerCredit)
          : null,
        goals: includeBudget ? buildGoalsPayload(d.goals) : [],
        curriculum: {
          id: crypto.randomUUID(),
          name: `${d.university.trim()} | ${d.program.trim()}`,
          version: d.version,
          status: 'user_supplied',
          disclaimer:
            'User-supplied curriculum. Verify rules with your university.',
          source: d.source,
          credit_cap: d.cap,
          graduation_credits: d.graduationCredits,
          max_terms: d.maxTerms,
          target_terms: d.targetTerms,
          gpa_credit_rules: gpa.rules,
          courses,
        },
      });
      localStorage.removeItem(draftKey);
      hydrated = false;
      await invalidateAll();
      await goto('/');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }

  const steps = [1, 2, 3, 4] as const;
  const go = (step: 1 | 2 | 3 | 4) => {
    d.step = step;
    error = '';
    window.scrollTo({ top: 0 });
  };
</script>

<svelte:head><title>{t('start.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('start.heading')}</h1>
    <p>{t('start.lead')}</p>
  </div>
</div>
<div class="reading-column start-wizard">
  <ol class="steps" aria-label={t('start.steps_aria')}>
    {#each steps as step}<li
        class:current={d.step === step}
        class:done={d.step > step}
        aria-current={d.step === step ? 'step' : undefined}
      >
        {#if step < d.step}<button
            type="button"
            class="step-jump"
            onclick={() => go(step)}
            ><span>{step}</span>{t(`start.step.${step}`)}</button
          >{:else}<span>{step}</span>{t(`start.step.${step}`)}{/if}
      </li>{/each}
  </ol>
  {#if restored}<p class="warning-banner start-restored" role="status">
      {t('start.draft_restored')}<button
        type="button"
        class="button subtle"
        onclick={startOver}>{t('start.start_over')}</button
      >
    </p>{/if}

  {#if d.step === 1}<section
      class="panel form-stack"
      aria-labelledby="step-heading"
    >
      <div>
        <p class="eyebrow">{t('start.step_of', { n: 1 })}</p>
        <h2 id="step-heading">{t('start.step.1')}</h2>
      </div>
      <div class="form-grid three-col">
        <label
          >{t('curriculum.alias')}<input
            bind:value={d.alias}
            required
            maxlength="80"
            placeholder={t('curriculum.alias_placeholder')}
          /></label
        ><label
          >{t('curriculum.current')}<input
            type="number"
            min="1"
            max="14"
            bind:value={d.currentTerm}
            required
          /></label
        ><label
          >{t('curriculum.last_ips')}<input
            type="number"
            min="0"
            max="4"
            step="0.01"
            bind:value={d.lastGpa}
            placeholder={t('curriculum.ips_placeholder')}
          /></label
        >
      </div>
      <div class="field-block">
        <label
          >{t('start.mission')}<textarea
            bind:value={d.mission}
            maxlength="500"
            rows="3"
            placeholder={t('start.mission_placeholder')}
          ></textarea></label
        >
        <p class="muted small char-count">
          {t('start.mission_count', { count: d.mission.length })}
        </p>
      </div>
    </section>{/if}

  {#if d.step === 2}<section class="panel" aria-labelledby="step-heading">
      <p class="eyebrow">{t('start.step_of', { n: 2 })}</p>
      <h2 id="step-heading">{t('start.step.2')}</h2>
      <div class="section-heading">
        <h3>{t('start.paste_heading')}</h3>
        <button
          type="button"
          class="button"
          disabled={loadingExample}
          onclick={useExample}
          >{loadingExample
            ? t('start.example_loading')
            : t('start.example')}</button
        >
      </div>
      <p class="muted small">{t('import.paste_hint')}</p>
      <p class="muted small">
        {t('curriculum.csv_hint_a')}<code>A|B</code>{t('curriculum.csv_hint_b')}
      </p>
      <label
        >{t('curriculum.paste')}<textarea
          value={d.paste}
          oninput={(e) => setPaste(e.currentTarget.value)}
          rows="6"
          placeholder="code,name,credits,recommended_term,prerequisites"
        ></textarea></label
      >
      <div class="toolbar-actions">
        <label class="file-label"
          >{t('curriculum.choose_file')}<input
            type="file"
            accept=".csv,.tsv,.txt,.json,text/csv,application/json"
            onchange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              void readFile(file);
            }}
          /></label
        ><a href="/curriculum-template.csv" download class="text-link"
          >{t('curriculum.template')}</a
        >
      </div>
      {#if templateNotice}<p class="success-banner small" role="status">
          {templateNotice}
        </p>{/if}
      {#if parsed}
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
                          d.columnFields = {
                            ...d.columnFields,
                            [column.index]: e.currentTarget.value as Field | '',
                          };
                        }}
                        ><option value=""
                          >{column.field === null && column.auto
                            ? t('import.guess')
                            : t('import.ignore')}</option
                        >{#each FIELDS as field}<option value={field}
                            >{t(`import.field.${field}`)}</option
                          >{/each}</select
                      ></td
                    ></tr
                  >{/each}</tbody
              >
            </table>
          </div>
        </details>
        {#if tableIssues.length}<ul class="finding-list warning-banner">
            {#each tableIssues as issue}<li>
                <p>{msg.describe('import', issue)}</p>
              </li>{/each}
          </ul>{/if}
        <div class="toolbar-actions">
          <button
            type="button"
            class="button primary"
            disabled={!canUseTable}
            onclick={useTable}>{t('start.use_table')}</button
          >{#if d.rows.length}<span class="muted small"
              >{t('start.use_table_hint')}</span
            >{/if}
        </div>
      {/if}

      <div class="section-heading">
        <h3>{t('start.rows_heading')}</h3>
        <span class="tag"
          >{t('start.total', {
            count: d.rows.length,
            credits: validCredits,
          })}</span
        >
      </div>
      {#if d.fromExample}<p class="warning-banner small">
          {t('start.example_label')}
        </p>{/if}
      <p class="muted small">{t('start.rows_hint')}</p>
      {#if rowIssues.length && d.rows.length}<p class="warning-banner small">
          {t('start.rows_issues', { count: rowIssues.length })}
        </p>{/if}
      <CourseRowsEditor bind:rows={d.rows} issues={rowIssues} />

      <h3>{t('start.rules_heading')}</h3>
      <div class="form-grid">
        <label
          >{t('curriculum.university')}<input
            bind:value={d.university}
            required
            maxlength="70"
            placeholder={t('curriculum.university_placeholder')}
          /></label
        ><label
          >{t('curriculum.program')}<input
            bind:value={d.program}
            required
            maxlength="70"
            placeholder={t('curriculum.program_placeholder')}
          /></label
        ><label
          >{t('curriculum.version')}<input
            bind:value={d.version}
            required
            maxlength="80"
          /></label
        ><label
          >{t('curriculum.source')}<input
            bind:value={d.source}
            required
            maxlength="500"
            placeholder={t('curriculum.source_placeholder')}
          /></label
        ><label
          >{t('curriculum.max_credits')}<input
            type="number"
            min="1"
            max="24"
            bind:value={d.cap}
            required
          /></label
        ><label
          >{t('curriculum.grad_credits')}<input
            type="number"
            min="1"
            max="300"
            bind:value={d.graduationCredits}
            placeholder={t('curriculum.grad_placeholder')}
          /></label
        ><label
          >{t('curriculum.on_time')}<input
            type="number"
            min="1"
            max="14"
            bind:value={d.targetTerms}
            required
          /></label
        ><label
          >{t('curriculum.max_period')}<input
            type="number"
            min="1"
            max="14"
            bind:value={d.maxTerms}
            required
          /></label
        >
      </div>
      <label
        >{t('curriculum.ips_rules')}<textarea
          bind:value={d.gpaRules}
          rows="4"
          placeholder="3.00 = 24"
        ></textarea></label
      >
      <p class="muted small">{t('curriculum.ips_rules_hint')}</p>
      {#if ruleProblems.length && d.rows.length}<ul
          class="finding-list warning-banner"
        >
          {#each ruleProblems as problem}<li><p>{problem}</p></li>{/each}
        </ul>{/if}
      <p class="warning-banner small">{t('curriculum.warning')}</p>
    </section>{/if}

  {#if d.step === 3}<section class="panel" aria-labelledby="step-heading">
      <p class="eyebrow">{t('start.step_of', { n: 3 })}</p>
      <h2 id="step-heading">{t('start.passed_heading')}</h2>
      <p class="muted">{t('start.passed_lead')}</p>
      <div class="toolbar-actions">
        {#if markUntil >= 1}<button
            type="button"
            class="button"
            onclick={markEarlierSemesters}
            >{t('start.mark_until', { n: markUntil })}</button
          >{/if}<button
          type="button"
          class="button subtle"
          disabled={!passed.length}
          onclick={() => (d.completed = [])}>{t('start.clear_passed')}</button
        ><span class="tag"
          >{t('start.passed_count', {
            count: passed.length,
            credits: passedCredits,
          })}</span
        >
      </div>
      {#each terms as term (term)}<fieldset class="passed-group">
          <legend>{t('common.semester', { term })}</legend>
          <div class="course-checklist">
            {#each courses.filter((c) => c.recommended_term === term) as course (course.code)}<label
                ><input
                  type="checkbox"
                  value={course.code}
                  checked={passed.includes(course.code)}
                  onchange={(e) => {
                    d.completed = e.currentTarget.checked
                      ? [...new Set([...passed, course.code])]
                      : passed.filter((code) => code !== course.code);
                  }}
                />
                <div>
                  <strong>{course.name}</strong><small
                    >{t('plan.course_meta', {
                      code: course.code,
                      credits: course.credits,
                    })}</small
                  >
                </div></label
              >{/each}
          </div>
        </fieldset>{/each}
      {#if passedIssues.length}<div class="warning-banner" role="status">
          <strong>{t('start.passed_issues')}</strong>
          <ul>
            {#each passedIssues as issue}<li>{issueText(issue)}</li>{/each}
          </ul>
        </div>{/if}
      <p class="footnote">{t('curriculum.footnote')}</p>
    </section>{/if}

  {#if d.step === 4}<section class="panel" aria-labelledby="step-heading">
      <p class="eyebrow">{t('start.step_of', { n: 4 })}</p>
      <h2 id="step-heading">{t('start.budget_heading')}</h2>
      <p class="muted">{t('start.budget_lead')}</p>
      <GoalsBudgetEditor
        bind:availableHours={d.availableHours}
        bind:minutesPerCredit={d.minutesPerCredit}
        bind:goals={d.goals}
        maxTerms={d.maxTerms ?? 14}
        currentTerm={d.currentTerm ?? 1}
      />
      <p class="footnote">{t('curriculum.footnote')}</p>
    </section>{/if}

  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}
  <div class="wizard-actions">
    {#if d.step > 1}<button
        type="button"
        class="button"
        onclick={() => go((d.step - 1) as 1 | 2 | 3)}>{t('start.back')}</button
      >{/if}
    {#if d.step < 3}<button
        type="button"
        class="button primary"
        disabled={d.step === 1 ? !step1Ok : !step2Ok}
        onclick={() => go((d.step + 1) as 2 | 3)}
        >{t('start.next')}<Icon name="arrow" size={15} /></button
      >{:else if d.step === 3}<button
        type="button"
        class="button"
        disabled={busy || !step1Ok || !step2Ok || passedIssues.length > 0}
        onclick={() => submit(false)}
        >{busy ? t('start.creating') : t('start.create')}</button
      ><button
        type="button"
        class="button primary"
        disabled={busy || !step1Ok || !step2Ok || passedIssues.length > 0}
        onclick={() => go(4)}
        >{t('start.next')}<Icon name="arrow" size={15} /></button
      >{:else}<button
        type="button"
        class="button subtle"
        disabled={busy || !step1Ok || !step2Ok || passedIssues.length > 0}
        onclick={() => submit(false)}>{t('start.skip_create')}</button
      ><button
        type="button"
        class="button primary"
        disabled={busy ||
          !step1Ok ||
          !step2Ok ||
          passedIssues.length > 0 ||
          budgetIssues.length > 0}
        onclick={() => submit(true)}
        >{busy ? t('start.creating') : t('start.create')}</button
      >{/if}
  </div>
</div>
