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
  import { api } from '#lib/api.js';
  import type { Plan, SolveResult, Alternative } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  type Draft = {
    name: string;
    assignments: Record<string, number | null>;
    layout: Plan['layout'];
    failed: string[];
    credit_cap: number;
    horizon: number;
    archived: boolean;
  };
  const snapshot = (p: Plan): Draft => ({
    name: p.name,
    assignments: { ...p.assignments },
    layout: { ...p.layout },
    failed: [...p.failed],
    credit_cap: p.credit_cap,
    horizon: p.horizon,
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
      { length: Math.max(1, draft.horizon - data.profile.current_term + 1) },
      (_, i) => i + data.profile.current_term,
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
    if (draft.failed.includes(code) && !draft.assignments[code])
      draft.assignments = {
        ...draft.assignments,
        [code]: data.profile.current_term,
      };
  }
  $effect(() => {
    const columns: Node[] = terms.map((t, i) => ({
      id: `term-${t}`,
      type: 'semester',
      position: { x: i * 290, y: 0 },
      data: { term: t, credits: loads[t], cap: draft.credit_cap },
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
    if (dirty && !window.confirm('You have an unsaved draft. Leave this page?'))
      cancel();
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
        throw new Error(
          'This draft belongs to an older saved revision. Copy any notes before discarding it.',
        );
      if (
        !parsed.draft ||
        typeof parsed.draft.name !== 'string' ||
        !Array.isArray(parsed.draft.failed) ||
        typeof parsed.draft.assignments !== 'object' ||
        !Number.isInteger(parsed.draft.horizon) ||
        parsed.draft.horizon < data.profile.current_term ||
        parsed.draft.horizon > 12
      )
        throw new Error('This browser draft is not valid.');
      remember();
      draft = parsed.draft;
      recovered = null;
    } catch (e) {
      error = (e as Error).message;
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
      notice = 'Plan saved and checked against the modeled rules.';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function generate() {
    if (dirty) {
      error = 'Save your scenario changes before generating alternatives.';
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
      error = (e as Error).message;
    } finally {
      solving = false;
    }
  }
  async function keepAlternative(alternative: Alternative) {
    busy = true;
    error = '';
    try {
      const created = await api<Plan>('plans', 'POST', {
        name: `${saved.name} | ${alternative.name}`.slice(0, 100),
        copy_from: saved.id,
      });
      await api(`plans/${created.id}`, 'PATCH', {
        ...snapshot(created),
        assignments: alternative.assignments,
        revision: created.revision,
        profile_revision: data.profile.revision,
      });
      await invalidateAll();
      await goto(`/plans/${created.id}`);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | {saved.name}</title></svelte:head>
<div class="editor-heading">
  <div>
    <a href="/plans" class="back-link">Study plans /</a>
    <h1>{saved.name}</h1>
    <p>
      Rev {saved.revision} | {dirty ? 'Unsaved changes' : 'Saved to PostgreSQL'} |
      {data.curriculum.version}
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
          error = 'Save your draft before opening its Decision Passport.';
        }
      }}><Icon name="print" size={16} />Passport</a
    ><button
      class="button primary"
      disabled={busy || solving || !dirty}
      onclick={save}>{busy ? 'Saving…' : 'Save & validate'}</button
    >
  </div>
</div>
{#if error}<div class="error-banner" role="alert">
    {error}<button class="button subtle" onclick={() => (error = '')}
      >Dismiss</button
    >
  </div>{/if}
{#if notice}<p class="success-banner" role="status">{notice}</p>{/if}
{#if recovered && !dirty}<div class="warning-banner">
    An unsaved browser draft is available.<button
      class="button"
      onclick={restore}>Restore draft</button
    ><button
      class="button subtle"
      onclick={() => {
        localStorage.removeItem(draftKey());
        recovered = null;
      }}>Discard draft</button
    >
  </div>{/if}
<div class="plan-summary">
  <span class="tag" class:warning={dirty || !!saved.validation.findings.length}
    >{dirty
      ? 'Changes need checking'
      : saved.validation.findings.length
        ? `${saved.validation.findings.length} rule findings`
        : 'Valid under modeled assumptions'}</span
  ><span>{remaining.reduce((s, c) => s + c.credits, 0)} credits remaining</span
  ><span
    >{saved.validation.completion_term && !dirty
      ? `Modeled completion: semester ${saved.validation.completion_term}`
      : 'Explore your semester assignments'}</span
  >
</div>
<div class="editor-layout" inert={busy || solving} aria-busy={busy || solving}>
  <section class="plan-workspace">
    <div class="workspace-toolbar">
      <div class="segmented">
        <button
          class:chosen={view === 'canvas'}
          onclick={() => (view = 'canvas')}>Canvas</button
        ><button
          class:chosen={view === 'board'}
          onclick={() => (view = 'board')}>Semester board</button
        >
      </div>
      <div class="toolbar-actions">
        <button class="button subtle" disabled={!history.length} onclick={undo}
          >Undo</button
        ><button class="button subtle" disabled={!future.length} onclick={redo}
          >Redo</button
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
            aria-label={`Semester ${term}`}
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
              <h3>Semester {term}</h3>
              <span class:load-over={loads[term] > draft.credit_cap}
                >{loads[term]} / {draft.credit_cap} cr</span
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
                  ><small>{c.code} | {c.credits} credits</small><strong
                    >{c.name}</strong
                  ></button
                ><label class="sr-only" for={`move-${c.code}`}
                  >Move {c.code} to semester</label
                ><select
                  id={`move-${c.code}`}
                  bind:value={
                    () => draft.assignments[c.code] ?? '',
                    (value) => move(c.code, value ? Number(value) : null)
                  }
                  ><option value="">Unscheduled</option
                  >{#each terms as t}<option value={t}>Semester {t}</option
                    >{/each}</select
                >
              </div>{/each}{#if !remaining.some((c) => draft.assignments[c.code] === term)}<p
                class="drop-hint"
              >
                Drop a course here
              </p>{/if}
          </section>{/each}
      </div>{/if}
    <div class="workspace-hint">
      Move a course across semester frames to reschedule it. Select a course for
      details or keyboard-friendly movement.
    </div>
    {#if remaining.some((c) => !terms.includes(draft.assignments[c.code] ?? -1))}<div
        class="unscheduled"
      >
        <h3>Unscheduled or outside horizon</h3>
        {#each remaining.filter((c) => !terms.includes(draft.assignments[c.code] ?? -1)) as c}<button
            class="button"
            onclick={() => (selected = c.code)}>{c.code} | {c.name}</button
          >{/each}
      </div>{/if}
  </section>
  <aside class="inspector">
    <section>
      <h2>Plan settings</h2>
      <label
        >Plan name<input
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
          >Credit limit<input
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
          >Last semester<input
            type="number"
            min={data.profile.current_term}
            max="12"
            value={draft.horizon}
            onchange={(e) => {
              remember();
              draft.horizon = Math.max(
                data.profile.current_term,
                Math.min(12, +e.currentTarget.value),
              );
            }}
          /></label
        >
      </div>
    </section>
    <section>
      <h2>{course ? course.name : 'Course details'}</h2>
      {#if course}<p class="muted small">
          {course.code} | {course.credits} credits
        </p>
        <p class="small">
          Prerequisites: {course.prerequisites.join(', ') || 'None'}
        </p>
        <label
          >Assigned semester<select
            bind:value={
              () => draft.assignments[course!.code] ?? '',
              (value) => move(course!.code, value ? Number(value) : null)
            }
            ><option value="">Unscheduled</option>{#each terms as t}<option
                value={t}>Semester {t}</option
              >{/each}</select
          ></label
        ><a href={`/study?course=${course.code}`} class="text-link"
          >Create a study goal</a
        >{:else}<p class="muted small">
          Select a card on the canvas or board to inspect its prerequisites and
          move it.
        </p>{/if}
    </section>
    <section>
      <h2>Simulate a setback</h2>
      <p class="muted small">
        Choose failed or postponed courses in this scenario. Your profile stays
        unchanged.
      </p>
      <div class="setback-list">
        {#each data.curriculum.courses as c}<label
            ><input
              type="checkbox"
              checked={draft.failed.includes(c.code)}
              onchange={() => toggleFailure(c.code)}
            /><span>{c.code}<small>{c.name}</small></span></label
          >{/each}
      </div>
    </section>
    <section>
      <h2>Find a recovery route</h2>
      <p class="muted small">
        Compare earlier completion with a lighter peak workload under the demo
        rules.
      </p>
      <button
        class="button primary full-width"
        disabled={solving || busy || dirty}
        onclick={generate}
        >{solving ? 'Finding alternatives…' : 'Generate alternatives'}</button
      >{#if dirty}<p class="small muted">Save your changes first.</p>{/if}
    </section>
    <section>
      <label class="checkbox-label"
        ><input
          type="checkbox"
          checked={draft.archived}
          onchange={() => {
            remember();
            draft.archived = !draft.archived;
          }}
        />Archive this plan</label
      >
      <p class="muted small">
        Archived plans remain recoverable from Study plans.
      </p>
    </section>
  </aside>
</div>
{#if results}<section class="panel recovery-results">
    <div class="section-heading">
      <h2>Recovery alternatives</h2>
      <span class="tag">{results.status}</span>
    </div>
    <p class="muted" role="status">{results.message}</p>
    <div class="comparison-summary">
      {#each results.alternatives as alternative}<article class="alternative">
          <h3>{alternative.name}</h3>
          <p>
            Finish in semester {alternative.validation.completion_term} | Peak {alternative
              .validation.peak_credits} credits
          </p>
          <p class="muted small">
            {alternative.optimal
              ? 'Optimal for this modeled objective.'
              : 'Feasible result found within the time limit.'} Independently checked.
          </p>
          <button
            class="button"
            disabled={busy}
            onclick={() => keepAlternative(alternative)}
            >Save as a separate plan<Icon name="arrow" size={15} /></button
          >
        </article>{/each}
    </div>
  </section>{/if}
<section class="panel">
  <div class="section-heading">
    <h2>Rule checks & explanation</h2>
    <span class="tag"
      >{dirty ? 'Awaiting save' : `Revision ${saved.revision}`}</span
    >
  </div>
  {#if dirty}<p class="muted">
      Save to check this draft. Findings below belong to the last saved
      revision.
    </p>{/if}{#if saved.validation.findings.length}<ul class="finding-list">
      {#each saved.validation.findings as finding}<li>
          <span class="tag warning">{finding.rule.replaceAll('_', ' ')}</span>
          <p>{finding.message}</p>
        </li>{/each}
    </ul>{:else}<p class="success-text">
      All modeled rules pass for the saved plan.
    </p>{/if}{#if saved.bottlenecks.length}<h3>Downstream impact</h3>
    <ul>
      {#each saved.bottlenecks as blocker}<li>
          {blocker.path.join(' → ')}
        </li>{/each}
    </ul>{/if}
  <p class="footnote">
    {saved.validation.assumptions.join(' ')} Source: {saved.validation
      .curriculum_version}.
  </p>
</section>
