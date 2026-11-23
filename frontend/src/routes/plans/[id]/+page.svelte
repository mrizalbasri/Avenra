<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
  import {
    SvelteFlow,
    Background,
    Controls,
    type Node,
    type Edge,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import CourseNode from '#lib/components/CourseNode.svelte';
  import SemesterNode from '#lib/components/SemesterNode.svelte';
  import Icon from '#lib/components/Icon.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import { api } from '#lib/api.js';
  import {
    nextOffered,
    offeringText,
    requirementText,
    termCap,
  } from '#lib/rules.js';
  import type { Plan, SolveResult, Alternative } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t: tx, msg } = useI18n();
  type Draft = {
    name: string;
    assignments: Record<string, number | null>;
    layout: Plan['layout'];
    failed: string[];
    credit_cap: number;
    horizon: number;
    expected_gpa: number | null;
    archived: boolean;
  };
  const snapshot = (p: Plan): Draft => ({
    name: p.name,
    assignments: { ...p.assignments },
    layout: { ...p.layout },
    failed: [...p.failed],
    credit_cap: p.credit_cap,
    horizon: p.horizon,
    expected_gpa: p.expected_gpa ?? null,
    archived: p.archived,
  });
  let saved = $state<Plan>(untrack(() => data.plan));
  let draft = $state<Draft>(untrack(() => snapshot(data.plan)));
  let view = $state<'canvas' | 'board'>('canvas');
  let selected = $state('');
  let busy = $state(false);
  let solving = $state(false);
  let error = $state('');
  let notice = $state('');
  let recovered = $state<string | null>(null);
  let results = $state<SolveResult | null>(null);
  let history = $state<Draft[]>([]);
  let future = $state<Draft[]>([]);
  let nodes = $state.raw<Node[]>([]);
  let dirty = $derived(
    JSON.stringify(draft) !== JSON.stringify(snapshot(saved)),
  );
  let remaining = $derived(
    data.curriculum.courses.filter(
      (c) =>
        !data.profile.completed.includes(c.code) ||
        draft.failed.includes(c.code),
    ),
  );
  let terms = $derived(
    Array.from(
      {
        length: Math.max(
          1,
          Math.min(draft.horizon, data.curriculum.max_terms) -
            data.profile.current_term +
            1,
        ),
      },
      (_, i) => i + data.profile.current_term,
    ),
  );
  let gpa = $derived(draft.expected_gpa ?? data.profile.last_gpa ?? null);
  let capFor = $derived((term: number) =>
    termCap(
      data.curriculum,
      term,
      data.profile.current_term,
      draft.credit_cap,
      gpa,
      data.profile.time_budget,
      data.profile.goals,
    ),
  );
  let completedCredits = $derived(
    data.curriculum.courses
      .filter(
        (c) =>
          data.profile.completed.includes(c.code) &&
          !draft.failed.includes(c.code),
      )
      .reduce((s, c) => s + c.credits, 0),
  );
  let plannedCredits = $derived(
    remaining
      .filter((c) => terms.includes(draft.assignments[c.code] ?? -1))
      .reduce((s, c) => s + c.credits, 0),
  );
  let graduationCredits = $derived(
    data.curriculum.graduation_credits ??
      data.curriculum.courses.reduce((s, c) => s + c.credits, 0),
  );
  let offPlan = $derived(
    remaining.filter((c) => !terms.includes(draft.assignments[c.code] ?? -1)),
  );
  let thisSemester = $derived(
    data.curriculum.courses.filter(
      (c) =>
        !data.profile.completed.includes(c.code) &&
        (draft.failed.includes(c.code) ||
          draft.assignments[c.code] === data.profile.current_term),
    ),
  );
  let passed = $derived(
    data.curriculum.courses.filter((c) =>
      data.profile.completed.includes(c.code),
    ),
  );
  let course = $derived(
    data.curriculum.courses.find((c) => c.code === selected),
  );
  let loads = $derived(
    Object.fromEntries(
      terms.map((t) => [
        t,
        remaining
          .filter((c) => draft.assignments[c.code] === t)
          .reduce((s, c) => s + c.credits, 0),
      ]),
    ),
  );
  let edges = $derived<Edge[]>(
    remaining.flatMap((c) =>
      c.prerequisites
        .filter((p) => remaining.some((r) => r.code === p))
        .map((p) => ({
          id: `${p}-${c.code}`,
          source: p,
          target: c.code,
          hidden: !!selected && selected !== c.code && selected !== p,
          style: 'stroke: var(--edge); stroke-width: 1.5;',
        })),
    ),
  );
  const nodeTypes = { course: CourseNode, semester: SemesterNode };
  const draftKey = () => `avenra-plan-draft:${data.plan.id}`;
  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
  function remember() {
    history = [...history.slice(-39), clone(draft)];
    future = [];
    results = null;
    notice = '';
  }
  function move(code: string, term: number | null) {
    remember();
    draft.assignments = { ...draft.assignments, [code]: term };
    const layout = { ...draft.layout };
    delete layout[code];
    draft.layout = layout;
  }
  function dropCourse(node: Node) {
    if (node.type !== 'course') return;
    const term = Math.max(
      data.profile.current_term,
      Math.min(
        draft.horizon,
        data.profile.current_term + Math.floor((node.position.x + 100) / 290),
      ),
    );
    remember();
    draft.assignments = { ...draft.assignments, [node.id]: term };
    draft.layout = {
      ...draft.layout,
      [node.id]: {
        x: Math.max(-10000, Math.min(10000, node.position.x)),
        y: Math.max(75, Math.min(20000, node.position.y)),
        term,
      },
    };
    selected = node.id;
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    future = [...future, clone(draft)];
    history = history.slice(0, -1);
    draft = previous;
    results = null;
  }
  function redo() {
    const next = future.at(-1);
    if (!next) return;
    history = [...history, clone(draft)];
    future = future.slice(0, -1);
    draft = next;
    results = null;
  }
  function toggleFailure(code: string) {
    remember();
    draft.failed = draft.failed.includes(code)
      ? draft.failed.filter((c) => c !== code)
      : [...draft.failed, code];
    const failedCourse = data.curriculum.courses.find((c) => c.code === code);
    // A retake goes to the next semester that offers the course. A course failed
    // this semester cannot return before next semester.
    if (draft.failed.includes(code) && failedCourse)
      draft.assignments = {
        ...draft.assignments,
        [code]: nextOffered(
          failedCourse,
          data.profile.current_term +
            (data.profile.completed.includes(code) ? 0 : 1),
        ),
      };
  }
  function applySuggestion(
    kind: 'horizon' | 'credit_cap' | 'goal_hours',
    value: number,
  ) {
    if (kind === 'goal_hours') return;
    remember();
    if (kind === 'horizon') draft.horizon = value;
    else draft.credit_cap = value;
    notice = tx('plan.suggestion_applied');
  }
  $effect(() => {
    const columns: Node[] = terms.map((t, i) => ({
      id: `term-${t}`,
      type: 'semester',
      position: { x: i * 290, y: 0 },
      data: { term: t, credits: loads[t], cap: capFor(t) },
      selectable: false,
      draggable: false,
      style: `width: 266px; height: ${Math.max(470, ...terms.map((term) => remaining.filter((c) => draft.assignments[c.code] === term).length * 126 + 85))}px; z-index: -1;`,
    }));
    const cards: Node[] = remaining
      .filter((c) => terms.includes(draft.assignments[c.code] ?? -1))
      .map((c) => {
        const term = draft.assignments[c.code]!;
        const order = remaining
          .filter((r) => draft.assignments[r.code] === term)
          .findIndex((r) => r.code === c.code);
        return {
          id: c.code,
          type: 'course',
          position:
            draft.layout[c.code]?.term === term
              ? { x: draft.layout[c.code].x, y: draft.layout[c.code].y }
              : {
                  x: (term - data.profile.current_term) * 290 + 13,
                  y: 75 + order * 126,
                },
          data: {
            course: c,
            failed: draft.failed.includes(c.code),
            hasFinding:
              !dirty &&
              saved.validation.findings.some((f) => f.course === c.code),
          },
          selected: selected === c.code,
          style: 'width: 240px;',
        };
      });
    nodes = [...columns, ...cards];
  });
  onMount(() => {
    // Dragging cards on a small canvas is awkward, so phones start on the board.
    if (window.matchMedia('(max-width: 720px)').matches) view = 'board';
    try {
      recovered = localStorage.getItem(draftKey());
    } catch {
      /* Draft persistence is optional. */
    }
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  });
  beforeNavigate(({ cancel }) => {
    if (dirty && !window.confirm(tx('plan.leave'))) cancel();
  });
  $effect(() => {
    const current = clone(draft);
    const isDirty = dirty;
    if (typeof localStorage !== 'undefined' && isDirty) {
      try {
        localStorage.setItem(
          draftKey(),
          JSON.stringify({ revision: saved.revision, draft: current }),
        );
      } catch {
        /* Saving to the server remains available. */
      }
    }
  });
  function restore() {
    try {
      const parsed = JSON.parse(recovered ?? 'null');
      if (parsed?.revision !== saved.revision)
        throw new Error(tx('plan.draft_old'));
      if (
        !parsed.draft ||
        typeof parsed.draft.name !== 'string' ||
        !Array.isArray(parsed.draft.failed) ||
        typeof parsed.draft.assignments !== 'object' ||
        !Number.isInteger(parsed.draft.horizon) ||
        parsed.draft.horizon < data.profile.current_term ||
        parsed.draft.horizon > data.curriculum.max_terms
      )
        throw new Error(tx('plan.draft_invalid'));
      remember();
      draft = {
        ...parsed.draft,
        expected_gpa: parsed.draft.expected_gpa ?? null,
      };
      recovered = null;
    } catch (e) {
      error = msg.errorText(e);
    }
  }
  async function save() {
    busy = true;
    error = '';
    notice = '';
    try {
      saved = await api<Plan>(`plans/${saved.id}`, 'PATCH', {
        ...draft,
        revision: saved.revision,
        profile_revision: data.profile.revision,
      });
      draft = snapshot(saved);
      history = [];
      future = [];
      results = null;
      localStorage.removeItem(draftKey());
      recovered = null;
      await invalidateAll();
      notice = tx('plan.saved_ok');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
  async function generate() {
    if (dirty) {
      error = tx('plan.save_before_generate');
      return;
    }
    solving = true;
    error = '';
    results = null;
    try {
      results = await api<SolveResult>(`plans/${saved.id}/solve`, 'POST', {
        revision: saved.revision,
        profile_revision: data.profile.revision,
      });
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      solving = false;
    }
  }
  async function keepAlternative(alternative: Alternative) {
    busy = true;
    error = '';
    try {
      // One request, so a failure never leaves a half-made copy behind.
      const created = await api<Plan>('plans', 'POST', {
        name: `${saved.name} | ${msg.altName(alternative)}`.slice(0, 100),
        copy_from: saved.id,
        assignments: alternative.assignments,
      });
      await invalidateAll();
      await goto(`/plans/${created.id}`);
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head
  ><title>{tx('plan.title', { name: saved.name })}</title></svelte:head
>
<div class="editor-heading">
  <div>
    <a href="/plans" class="back-link">{tx('nav.plans')} /</a>
    <h1>{saved.name}</h1>
    <p>
      {tx('plan.rev', {
        revision: saved.revision,
        state: dirty ? tx('plan.unsaved') : tx('plan.saved'),
        version: data.curriculum.version,
      })}
    </p>
  </div>
  <div class="toolbar-actions">
    <a
      href={`/plans/${saved.id}/passport`}
      class="button"
      aria-disabled={dirty}
      onclick={(e) => {
        if (dirty) {
          e.preventDefault();
          error = tx('plan.passport_blocked');
        }
      }}><Icon name="print" size={16} />{tx('plan.passport')}</a
    ><button
      class="button primary"
      disabled={busy || solving || !dirty}
      onclick={save}>{busy ? tx('plan.saving') : tx('plan.save')}</button
    >
  </div>
</div>
{#if error}<div class="error-banner" role="alert">
    {error}<button class="button subtle" onclick={() => (error = '')}
      >{tx('plan.dismiss')}</button
    >
  </div>{/if}
{#if notice}<p class="success-banner" role="status">{notice}</p>{/if}
{#if recovered && !dirty}<div class="warning-banner">
    {tx('plan.draft_available')}<button class="button" onclick={restore}
      >{tx('plan.restore')}</button
    ><button
      class="button subtle"
      onclick={() => {
        localStorage.removeItem(draftKey());
        recovered = null;
      }}>{tx('plan.discard')}</button
    >
  </div>{/if}
<div class="plan-summary">
  <span class="tag" class:warning={dirty || !!saved.validation.findings.length}
    >{dirty
      ? tx('plan.needs_check')
      : saved.validation.findings.length
        ? tx('plan.findings', { count: saved.validation.findings.length })
        : tx('plan.valid')}</span
  ><span
    >{tx('plan.credits_planned', {
      done: completedCredits + plannedCredits,
      total: graduationCredits,
    })}</span
  ><span
    >{saved.validation.completion_term && !dirty
      ? tx('plan.completion', { term: saved.validation.completion_term })
      : tx('plan.explore')}</span
  >
</div>
<div class="editor-layout" inert={busy || solving} aria-busy={busy || solving}>
  <section class="plan-workspace">
    <div class="workspace-toolbar">
      <div class="segmented">
        <button
          class:chosen={view === 'canvas'}
          onclick={() => (view = 'canvas')}>{tx('plan.view.canvas')}</button
        ><button
          class:chosen={view === 'board'}
          onclick={() => (view = 'board')}>{tx('plan.view.board')}</button
        >
      </div>
      <div class="toolbar-actions">
        <button class="button subtle" disabled={!history.length} onclick={undo}
          >{tx('plan.undo')}</button
        ><button class="button subtle" disabled={!future.length} onclick={redo}
          >{tx('plan.redo')}</button
        >
      </div>
    </div>
    {#if view === 'canvas'}<div class="plan-canvas">
        <SvelteFlow
          bind:nodes
          {edges}
          {nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{
            nodes: terms.slice(0, 2).map((term) => ({ id: `term-${term}` })),
            padding: 0.15,
            minZoom: 0.6,
            maxZoom: 1,
          }}
          minZoom={0.25}
          maxZoom={1.4}
          nodesConnectable={false}
          deleteKey={null}
          onnodeclick={({ node }) => {
            if (node.type === 'course') selected = node.id;
          }}
          onnodedragstop={({ targetNode }) => {
            if (targetNode) dropCourse(targetNode);
          }}
          ><Background patternColor="var(--canvas-dot)" gap={24} /><Controls
          /></SvelteFlow
        >
      </div>{:else}<div class="semester-board">
        {#each terms as term}<section
            class="term-column"
            aria-label={tx('common.semester', { term })}
            ondragover={(e) => e.preventDefault()}
            ondrop={(e) => {
              e.preventDefault();
              const code = e.dataTransfer?.getData('text/plain');
              if (code && remaining.some((c) => c.code === code))
                move(code, term);
            }}
            role="group"
          >
            <div class="term-heading">
              <h3>{tx('common.semester', { term })}</h3>
              <span class:load-over={loads[term] > capFor(term)}
                >{tx('plan.load', {
                  load: loads[term],
                  cap: capFor(term),
                })}</span
              >
            </div>
            {#each remaining.filter((c) => draft.assignments[c.code] === term) as c}<div
                class="board-course"
                draggable="true"
                ondragstart={(e) =>
                  e.dataTransfer?.setData('text/plain', c.code)}
                role="group"
                aria-label={c.name}
              >
                <button class="course-title" onclick={() => (selected = c.code)}
                  ><small
                    >{tx('plan.course_meta', {
                      code: c.code,
                      credits: c.credits,
                    })}</small
                  ><strong>{c.name}</strong></button
                ><label class="sr-only" for={`move-${c.code}`}
                  >{tx('plan.move_label', { code: c.code })}</label
                ><select
                  id={`move-${c.code}`}
                  bind:value={
                    () => draft.assignments[c.code] ?? '',
                    (value) => move(c.code, value ? Number(value) : null)
                  }
                  ><option value="">{tx('plan.unscheduled')}</option
                  >{#each terms as t}<option value={t}
                      >{tx('common.semester', { term: t })}</option
                    >{/each}</select
                >
              </div>{/each}{#if !remaining.some((c) => draft.assignments[c.code] === term)}<p
                class="drop-hint"
              >
                {tx('plan.drop_hint')}
              </p>{/if}
          </section>{/each}
      </div>{/if}
    <div class="workspace-hint">
      {tx('plan.hint')}
    </div>
    {#if offPlan.some((c) => c.category === 'required')}<div
        class="unscheduled"
      >
        <h3>{tx('plan.required_off')}</h3>
        {#each offPlan.filter((c) => c.category === 'required') as c}<button
            class="button"
            onclick={() => (selected = c.code)}>{c.code} | {c.name}</button
          >{/each}
      </div>{/if}
    {#if offPlan.some((c) => c.category === 'elective')}<div
        class="unscheduled elective-pool"
      >
        <h3>{tx('plan.elective_pool')}</h3>
        <p class="muted small">
          {tx('plan.elective_hint')}
        </p>
        {#each offPlan.filter((c) => c.category === 'elective') as c}<button
            class="button subtle"
            onclick={() => (selected = c.code)}
            >{tx('plan.elective_chip', {
              code: c.code,
              name: c.name,
              credits: c.credits,
            })}</button
          >{/each}
      </div>{/if}
  </section>
  <aside class="inspector" aria-label={tx('plan.tools')}>
    <section class="ins-settings">
      <h2>{tx('plan.settings')}</h2>
      <label
        >{tx('plan.name')}<input
          value={draft.name}
          maxlength="100"
          oninput={(e) => {
            remember();
            draft.name = e.currentTarget.value;
          }}
        /></label
      >
      <div class="form-grid">
        <label
          >{tx('plan.credit_limit')}<input
            type="number"
            min="1"
            max="24"
            value={draft.credit_cap}
            onchange={(e) => {
              remember();
              draft.credit_cap = +e.currentTarget.value;
            }}
          /></label
        ><label
          >{tx('plan.last_semester')}<input
            type="number"
            min={data.profile.current_term}
            max={data.curriculum.max_terms}
            value={draft.horizon}
            onchange={(e) => {
              remember();
              draft.horizon = Math.max(
                data.profile.current_term,
                Math.min(data.curriculum.max_terms, +e.currentTarget.value),
              );
            }}
          /></label
        >
      </div>
      <p class="muted small">
        {tx('plan.limit_note', {
          term: data.profile.current_term,
          cap: capFor(data.profile.current_term),
          ips:
            gpa !== null && data.curriculum.gpa_credit_rules.length
              ? tx('plan.limit_ips', { gpa: gpa.toFixed(2) })
              : '',
          max: data.curriculum.max_terms,
        })}
      </p>
    </section>
    <section class="ins-course">
      <h2>{course ? course.name : tx('plan.course_details')}</h2>
      {#if course}<p class="muted small">
          {tx('plan.course_line', {
            code: course.code,
            credits: course.credits,
            category:
              course.category === 'elective'
                ? tx('course.elective')
                : tx('course.required'),
            offering: offeringText(course, tx),
          })}
        </p>
        <ul class="small requirement-list">
          {#each requirementText(course, tx) as line}<li>{line}</li>{/each}
        </ul>
        <label
          >{tx('plan.assigned')}<select
            bind:value={
              () => draft.assignments[course!.code] ?? '',
              (value) => move(course!.code, value ? Number(value) : null)
            }
            ><option value="">{tx('plan.unscheduled')}</option
            >{#each terms as t}<option value={t}
                >{tx('common.semester', { term: t })}</option
              >{/each}</select
          ></label
        ><a href={`/study?course=${course.code}`} class="text-link"
          >{tx('plan.study_goal')}</a
        >{:else}<p class="muted small">
          {tx('plan.select_hint')}
        </p>{/if}
    </section>
    <section class="ins-setback">
      <h2>{tx('plan.setback')}</h2>
      <p class="muted small">
        {tx('plan.setback_hint')}
      </p>
      <div class="setback-list">
        <p class="small"><strong>{tx('plan.this_semester')}</strong></p>
        {#each thisSemester as c}<label
            ><input
              type="checkbox"
              checked={draft.failed.includes(c.code)}
              onchange={() => toggleFailure(c.code)}
            /><span>{c.code}<small>{c.name}</small></span></label
          >{:else}<p class="muted small">
            {tx('plan.none_this_semester')}
          </p>{/each}
      </div>
      {#if passed.length}<details class="setback-list">
          <summary class="small">{tx('plan.retake_passed')}</summary>
          {#each passed as c}<label
              ><input
                type="checkbox"
                checked={draft.failed.includes(c.code)}
                onchange={() => toggleFailure(c.code)}
              /><span>{c.code}<small>{c.name}</small></span></label
            >{/each}
        </details>{/if}
      {#if data.curriculum.gpa_credit_rules.length}<label
          >{tx('plan.expected_ips')}<input
            type="number"
            min="0"
            max="4"
            step="0.01"
            placeholder={data.profile.last_gpa?.toFixed(2) ??
              tx('plan.ips_placeholder')}
            value={draft.expected_gpa ?? ''}
            onchange={(e) => {
              remember();
              const value = e.currentTarget.value;
              draft.expected_gpa =
                value === ''
                  ? null
                  : Math.max(0, Math.min(4, Math.round(+value * 100) / 100));
            }}
          /></label
        >
        <p class="muted small">
          {tx('plan.ips_hint')}
        </p>{/if}
    </section>
    <section class="ins-recovery">
      <h2>{tx('plan.recovery')}</h2>
      <p class="muted small">
        {tx('plan.recovery_hint')}
      </p>
      <button
        class="button primary full-width"
        disabled={solving || busy || dirty}
        onclick={generate}
        >{solving
          ? tx('plan.finding_alternatives')
          : tx('plan.generate')}</button
      >{#if dirty}<p class="small muted">{tx('plan.save_first')}</p>{/if}
    </section>
    <section class="ins-archive">
      <label class="checkbox-label"
        ><input
          type="checkbox"
          checked={draft.archived}
          onchange={() => {
            remember();
            draft.archived = !draft.archived;
          }}
        />{tx('plan.archive')}</label
      >
      <p class="muted small">
        {tx('plan.archive_hint')}
      </p>
    </section>
  </aside>
</div>
{#if results}<section class="panel recovery-results">
    <div class="section-heading">
      <h2>{tx('plan.results')}</h2>
      <span class="tag"
        >{tx(`status.${results.status}` as 'status.feasible')}</span
      >
    </div>
    <p class="muted" role="status">{msg.solveText(results)}</p>
    {#if results.diagnosis}<div class="diagnosis">
        <h3>{tx('plan.why_none')}</h3>
        <ul class="finding-list">
          {#each results.diagnosis.reasons as reason}<li>
              <span class="tag warning">{msg.ruleLabel(reason.rule)}</span>
              <p>{msg.describe('diag', reason)}</p>
            </li>{/each}
        </ul>
        {#if results.diagnosis.suggestions.length}<h3>
            {tx('plan.smallest')}
          </h3>
          <div class="toolbar-actions">
            {#each results.diagnosis.suggestions as suggestion}{#if suggestion.kind === 'goal_hours'}<a
                  href="/profile"
                  class="button">{msg.describe('suggest', suggestion)}</a
                >{:else}<button
                  class="button"
                  onclick={() =>
                    applySuggestion(suggestion.kind, suggestion.value)}
                  >{msg.describe('suggest', suggestion)}</button
                >{/if}{/each}
          </div>{:else}<p class="muted small">
            {tx('plan.no_suggestion')}
          </p>{/if}
      </div>{/if}
    <div class="comparison-summary">
      {#each results.alternatives as alternative}<article class="alternative">
          <h3>{msg.altName(alternative)}</h3>
          <p>{msg.altSummary(alternative)}</p>
          <p class="muted small">
            {alternative.optimal ? tx('plan.optimal') : tx('plan.feasible')}{tx(
              'plan.checked',
            )}
          </p>
          {#if alternative.changes.length}<details>
              <summary class="small"
                >{tx('plan.changes', {
                  count: alternative.changes.length,
                })}</summary
              >
              <ul class="small">
                {#each alternative.changes as change}<li>
                    {tx('plan.change_line', {
                      code: change.code,
                      name: change.name,
                      from: change.from
                        ? tx('plan.change_semester', { term: change.from })
                        : tx('plan.change_none_from'),
                      to: change.to
                        ? tx('plan.change_semester', { term: change.to })
                        : tx('plan.change_none_to'),
                    })}
                  </li>{/each}
              </ul>
            </details>{:else}<p class="muted small">
              {tx('plan.same_arrangement')}
            </p>{/if}
          <button
            class="button"
            disabled={busy}
            onclick={() => keepAlternative(alternative)}
            >{tx('plan.keep')}<Icon name="arrow" size={15} /></button
          >
        </article>{/each}
    </div>
  </section>{/if}
<section class="panel">
  <div class="section-heading">
    <h2>{tx('plan.checks')}</h2>
    <span class="tag"
      >{dirty
        ? tx('plan.awaiting')
        : tx('plan.revision', { revision: saved.revision })}</span
    >
  </div>
  {#if dirty}<p class="muted">
      {tx('plan.dirty_note')}
    </p>{/if}{#if saved.validation.findings.length}<ul class="finding-list">
      {#each saved.validation.findings as finding}<li>
          <span class="tag warning">{msg.ruleLabel(finding.rule)}</span>
          <p>{msg.describe('finding', finding)}</p>
        </li>{/each}
    </ul>{:else}<p class="success-text">
      {tx('plan.all_pass')}
    </p>{/if}{#if saved.bottlenecks.length}<h3>{tx('plan.downstream')}</h3>
    <ul>
      {#each saved.bottlenecks as blocker}<li>
          {blocker.path.join(' → ')}
        </li>{/each}
    </ul>{/if}
  <p class="footnote">
    {tx('plan.source_note', {
      assumptions: saved.validation.assumption_items
        .map((item) =>
          item.code === 'DISCLAIMER'
            ? msg.disclaimer(data.curriculum)
            : msg.describe('assume', item),
        )
        .join(' '),
      version: saved.validation.curriculum_version,
    })}
  </p>
</section>
