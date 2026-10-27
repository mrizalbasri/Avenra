<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import Icon from '#lib/components/Icon.svelte';
  import type { Task } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let course = $state(
    untrack(
      () =>
        page.url.searchParams.get('course') ??
        data.workspace?.curriculum.courses[0]?.code ??
        '',
    ),
  );
  let title = $state('');
  let due = $state('');
  let filter = $state('all');
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);
  let minutes = $state(25);
  let breakMinutes = $state(5);
  let mode = $state<'focus' | 'break'>('focus');
  let running = $state(false);
  let accumulated = $state(0);
  let startedAt = $state(0);
  let tick = $state(Date.now());
  let duration = $state(25 * 60);
  let sessionId = $state('');
  let sessionCourse = $state('');
  let restored = $state(false);
  let hydrated = $state(false);
  let sessionNote = $state('');
  let elapsed = $derived(
    Math.min(
      duration,
      accumulated +
        (running ? Math.max(0, Math.floor((tick - startedAt) / 1000)) : 0),
    ),
  );
  let remaining = $derived(Math.max(0, duration - elapsed));
  let clock = $derived(
    `${Math.floor(remaining / 60)
      .toString()
      .padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`,
  );
  let tasks = $derived(
    data.study.tasks.filter(
      (t) => filter === 'all' || (filter === 'done' ? t.done : !t.done),
    ),
  );
  let focusTotal = $derived(
    data.study.sessions.reduce((sum, session) => sum + session.seconds, 0),
  );
  const key = untrack(
    () => `avenra-focus-session-v1:${data.workspace?.profile?.id}`,
  );
  function persist() {
    try {
      if (!sessionId) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(
        key,
        JSON.stringify({
          mode,
          accumulated: elapsed,
          startedAt: running ? Date.now() : 0,
          running,
          duration,
          sessionId,
          sessionCourse,
          sessionNote,
        }),
      );
    } catch {
      notice =
        'Browser recovery is unavailable. Keep this page open until you save the session.';
    }
  }
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (
        saved &&
        saved.sessionId &&
        ['focus', 'break'].includes(saved.mode) &&
        Number.isFinite(saved.duration) &&
        saved.duration > 0 &&
        saved.duration <= 43200 &&
        Number.isFinite(saved.accumulated) &&
        typeof saved.sessionId === 'string' &&
        typeof saved.sessionCourse === 'string'
      ) {
        mode = saved.mode;
        duration = saved.duration;
        accumulated = Math.max(
          0,
          Math.min(
            duration,
            saved.accumulated +
              (saved.running && Number.isFinite(saved.startedAt)
                ? Math.max(0, Math.floor((Date.now() - saved.startedAt) / 1000))
                : 0),
          ),
        );
        sessionId = saved.sessionId;
        sessionCourse = saved.sessionCourse;
        sessionNote =
          typeof saved.sessionNote === 'string'
            ? saved.sessionNote.slice(0, 500)
            : '';
        running = false;
        restored = true;
      }
    } catch {
      notice = 'The previous timer could not be restored. Start a new session.';
    }
    hydrated = true;
    const timer = setInterval(() => {
      tick = Date.now();
    }, 500);
    const save = () => persist();
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', save);
      persist();
    };
  });
  $effect(() => {
    if (running && remaining === 0) {
      accumulated = duration;
      running = false;
      notice =
        mode === 'focus'
          ? 'Focus block complete. Save your reflection, then take a break.'
          : 'Break complete. Ready for your next focus block?';
    }
  });
  $effect(() => {
    const values = [
      running,
      accumulated,
      sessionId,
      sessionCourse,
      sessionNote,
      mode,
      duration,
    ];
    if (hydrated && values.length) persist();
  });
  function start() {
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionCourse = course;
      duration = Math.min(120, Math.max(1, minutes || 25)) * 60;
    }
    if (remaining === 0) return;
    startedAt = Date.now();
    tick = Date.now();
    running = true;
    restored = false;
  }
  function pause() {
    accumulated = elapsed;
    running = false;
  }
  function reset(nextMode: 'focus' | 'break') {
    if (
      (running || accumulated > 0) &&
      mode === 'focus' &&
      !window.confirm('Discard this unsaved focus session?')
    )
      return;
    running = false;
    accumulated = 0;
    mode = nextMode;
    duration =
      Math.min(
        120,
        Math.max(1, nextMode === 'focus' ? minutes || 25 : breakMinutes || 5),
      ) * 60;
    sessionId = nextMode === 'break' ? crypto.randomUUID() : '';
    sessionCourse = course;
    sessionNote = '';
    restored = false;
    localStorage.removeItem(key);
  }
  async function saveSession() {
    if (mode !== 'focus' || elapsed < 1) return;
    pause();
    busy = true;
    error = '';
    try {
      await api('study/sessions', 'POST', {
        id: sessionId,
        course_code: sessionCourse,
        seconds: elapsed,
        note: sessionNote,
      });
      accumulated = 0;
      sessionId = '';
      restored = false;
      sessionNote = '';
      duration = (minutes || 25) * 60;
      localStorage.removeItem(key);
      await invalidateAll();
      notice = 'Focus session saved. Time spent does not imply course mastery.';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function addTask() {
    busy = true;
    error = '';
    try {
      await api('study/tasks', 'POST', {
        course_code: course,
        title,
        due_date: due || null,
      });
      title = '';
      due = '';
      await invalidateAll();
      notice = 'Study target added.';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
  async function toggle(task: Task) {
    busy = true;
    error = '';
    try {
      await api(`study/tasks/${task.id}`, 'PATCH', {
        revision: task.revision,
        done: !task.done,
      });
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | Study & focus</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Give your plan some focus.</h1>
    <p>Small, specific learning targets. Time set aside to work on them.</p>
  </div>
  <span class="tag"
    ><Icon name="clock" size={14} />{Math.floor(focusTotal / 60)} focused minutes
    recorded</span
  >
</div>
{#if error || data.studyError}<p class="error-banner" role="alert">
    {error || data.studyError}
  </p>{/if}{#if notice}<p class="success-banner" role="status">{notice}</p>{/if}
{#if !data.workspace?.profile}<div class="empty-panel">
    <h2>Open a workspace to start learning.</h2>
    <a href="/" class="button primary">Go to overview</a>
  </div>{:else}
  <div class="study-layout">
    <section>
      <form
        class="panel"
        onsubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <h2>What's your next learning target?</h2>
        <label
          >Course<select bind:value={course}
            >{#each data.workspace.curriculum.courses as c}<option
                value={c.code}>{c.code} | {c.name}</option
              >{/each}</select
          ></label
        ><label
          >Specific target<input
            bind:value={title}
            placeholder="e.g. Solve 5 linked-list exercises"
            maxlength="250"
            required
          /></label
        >
        <div class="form-grid">
          <label
            >Target date (optional)<input type="date" bind:value={due} /></label
          ><button
            class="button primary align-end"
            disabled={busy || !title.trim()}
            >Add study target<Icon name="plus" size={15} /></button
          >
        </div>
      </form>
      <section class="panel">
        <div class="section-heading">
          <h2>Your study targets</h2>
          <div class="segmented">
            <button
              class:chosen={filter === 'all'}
              onclick={() => (filter = 'all')}>All</button
            ><button
              class:chosen={filter === 'open'}
              onclick={() => (filter = 'open')}>Open</button
            ><button
              class:chosen={filter === 'done'}
              onclick={() => (filter = 'done')}>Done</button
            >
          </div>
        </div>
        {#each tasks as task}<div class="study-task">
            <label
              ><input
                type="checkbox"
                checked={task.done}
                disabled={busy}
                onchange={() => toggle(task)}
              /><span class:completed-task={task.done}
                ><strong>{task.title}</strong><small
                  >{task.course_code}{task.due_date
                    ? ` | Due ${task.due_date}`
                    : ''}</small
                ></span
              ></label
            >
          </div>{/each}{#if !tasks.length}<p class="muted">
            No targets in this view. Add a clear, achievable target above.
          </p>{/if}
      </section>
      <section class="panel">
        <h2>Recent focus sessions</h2>
        {#each data.study.sessions.slice(0, 12) as session}<div
            class="session-row"
          >
            <div>
              <strong>{session.course_code}</strong>
              <p>{session.note || 'Focused study session'}</p>
            </div>
            <span
              >{Math.floor(session.seconds / 60)}m {session.seconds % 60}s</span
            ><time datetime={session.created_at}
              >{new Date(session.created_at).toLocaleDateString('en-GB', {
                timeZone: 'Asia/Jakarta',
              })}</time
            >
          </div>{/each}{#if !data.study.sessions.length}<p class="muted">
            Your saved sessions will appear here.
          </p>{/if}
      </section>
    </section>
    <aside class="panel focus-panel">
      <div class="section-heading">
        <h2>Focus space</h2>
        <Icon name="clock" />
      </div>
      <div class="segmented">
        <button
          class:chosen={mode === 'focus'}
          disabled={busy}
          onclick={() => reset('focus')}>Focus</button
        ><button
          class:chosen={mode === 'break'}
          disabled={busy}
          onclick={() => reset('break')}>Break</button
        >
      </div>
      <div class="timer" role="timer" aria-label="Time remaining">{clock}</div>
      <p class="timer-caption">
        {sessionId ? sessionCourse : course} | {mode === 'focus'
          ? 'One thing at a time.'
          : 'Step away and recharge.'}
      </p>
      {#if restored}<p class="warning-banner small">
          Restored in a paused state. Resume when you're ready.
        </p>{/if}
      <div class="timer-actions">
        <button
          class="button primary"
          disabled={busy || remaining === 0}
          onclick={() => (running ? pause() : start())}
          >{running
            ? 'Pause'
            : accumulated > 0
              ? 'Resume'
              : 'Start session'}</button
        ><button class="button" disabled={busy} onclick={() => reset(mode)}
          >Reset</button
        >
      </div>
      <div class="form-grid">
        <label
          >Focus minutes<input
            type="number"
            min="1"
            max="120"
            bind:value={minutes}
            disabled={running || !!sessionId}
            onchange={() =>
              (duration = Math.min(120, Math.max(1, minutes || 25)) * 60)}
          /></label
        ><label
          >Break minutes<input
            type="number"
            min="1"
            max="120"
            bind:value={breakMinutes}
            disabled={running}
          /></label
        >
      </div>
      {#if mode === 'focus'}<label
          >What did you learn?<textarea
            bind:value={sessionNote}
            maxlength="500"
            rows="3"
            placeholder="A short reflection or your next question…"
          ></textarea></label
        ><button
          class="button full-width"
          disabled={busy || elapsed < 1}
          onclick={saveSession}
          >{busy ? 'Saving…' : 'Finish & save session'}</button
        >{/if}
      <p class="footnote">
        The timer uses timestamps, so background tabs do not lose elapsed time.
        Reload restores it paused. Sessions are saved to PostgreSQL when you
        finish.
      </p>
    </aside>
  </div>{/if}
