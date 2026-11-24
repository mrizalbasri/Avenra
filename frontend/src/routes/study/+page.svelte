<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import Icon from '#lib/components/Icon.svelte';
  import { useI18n } from '#lib/i18n/context.js';
  import {
    parseAnnouncement,
    type AnnouncementWarning,
  } from '#lib/announcement.js';
  import { downloadIcs, tasksToIcs } from '#lib/calendar.js';
  import type { Task } from '#lib/types.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { t, locale, msg } = useI18n();
  let goals = $derived(data.workspace?.profile?.goals ?? []);
  let goalNames = $derived(
    Object.fromEntries(goals.map((goal) => [goal.id, goal.title])),
  );
  let initialCourse = untrack(
    () =>
      page.url.searchParams.get('course') ??
      data.workspace?.curriculum.courses[0]?.code ??
      '',
  );
  let targetRef = $state(initialCourse ? `course:${initialCourse}` : '');
  let focusCourse = $state(initialCourse);
  let title = $state('');
  let due = $state('');
  let startDate = $state('');
  let firstStep = $state('');
  let detailsText = $state('');
  let inputMode = $state<'manual' | 'announce'>('manual');
  let rawAnnouncement = $state('');
  let reviewing = $state(false);
  let reviewWarnings = $state<AnnouncementWarning[]>([]);
  let filter = $state('all');
  let goalFilter = $state('all');
  let editingId = $state<string | null>(null);
  let editTargetRef = $state('');
  let editPreserveGoalId = $state<string | null>(null);
  let editTitle = $state('');
  let editDue = $state('');
  let editStartDate = $state('');
  let editFirstStep = $state('');
  let editDetailsText = $state('');
  let focusPanel: HTMLElement | undefined = $state();
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
    data.study.tasks.filter((task) => {
      const statusOk =
        filter === 'all' || (filter === 'done' ? task.done : !task.done);
      if (!statusOk) return false;
      if (goalFilter === 'all') return true;
      if (goalFilter === 'courses') return !task.goal_id;
      return task.goal_id === goalFilter;
    }),
  );
  const taskContext = (task: Task) => {
    const parts: string[] = [];
    if (task.course_code) parts.push(task.course_code);
    if (task.goal_id) parts.push(goalNames[task.goal_id] ?? task.goal_id);
    return parts.join(' | ');
  };
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
      notice = t('study.notice.no_storage');
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
      notice = t('study.notice.no_restore');
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
          ? t('study.notice.focus_done')
          : t('study.notice.break_done');
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
      sessionCourse = focusCourse;
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
      !window.confirm(t('study.discard'))
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
    sessionCourse = focusCourse;
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
      notice = t('study.notice.saved');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
  function extractAnnouncement() {
    if (!rawAnnouncement.trim() || !data.workspace) return;
    const parsed = parseAnnouncement(
      rawAnnouncement,
      data.workspace.curriculum.courses,
      goals,
      new Date(),
      locale(),
    );
    if (parsed.course_code) {
      targetRef = `course:${parsed.course_code}`;
      focusCourse = parsed.course_code;
    } else if (parsed.goal_id) {
      targetRef = `goal:${parsed.goal_id}`;
    }
    title = parsed.title;
    due = parsed.due_date ?? '';
    startDate = parsed.start_date;
    firstStep = parsed.first_step;
    detailsText = parsed.details.join('\n');
    reviewWarnings = parsed.warnings;
    reviewing = true;
    error = '';
  }

  function fillExampleAnnouncement() {
    const sampleCourse = data.workspace?.curriculum.courses[0];
    const code = sampleCourse?.code ?? 'IF2101';
    const name = sampleCourse?.name ?? 'Struktur Data';
    const d = new Date();
    d.setDate(d.getDate() + 4);
    const iso = d.toLocaleDateString('en-CA');
    rawAnnouncement =
      locale() === 'id'
        ? `[Pengumuman] Tugas ${code} ${name}: buat implementasi dan ringkasan materi.\n- Kumpulkan PDF + kode sumber di LMS\n- Dikerjakan secara individu\nDeadline: ${iso} pukul 23:59 WIB`
        : `[Announcement] ${code} ${name} assignment: complete the implementation and short write-up.\n- Submit PDF + source code on LMS\n- Individual submission\nDue: ${iso} at 23:59`;
  }

  function parseDetailsLines(raw: string): string[] {
    return raw
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^[-•*]\s*/, '')
          .trim()
          .slice(0, 160),
      )
      .filter(Boolean)
      .slice(0, 8);
  }

  function startTaskInFocus(task: Task) {
    if (mode === 'focus' && (running || accumulated > 0)) {
      notice = t('study.notice.session_active');
      focusPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const isGoalOnly = !task.course_code;
    if (task.course_code) {
      focusCourse = task.course_code;
    }
    const step = task.first_step || task.title;
    const baseMinutes = Math.min(120, Math.max(1, minutes || 25));
    const sprintMinutes = task.first_step
      ? Math.min(baseMinutes, 15)
      : baseMinutes;
    mode = 'focus';
    running = false;
    accumulated = 0;
    restored = false;
    sessionId = crypto.randomUUID();
    sessionCourse = focusCourse;
    sessionNote = step;
    duration = sprintMinutes * 60;
    startedAt = Date.now();
    tick = Date.now();
    running = true;
    notice = isGoalOnly
      ? t('study.notice.started_goal_task', { course: focusCourse, step })
      : t('study.notice.started_task', { step });
    focusPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function beginEdit(task: Task) {
    const hasGoal =
      !!task.goal_id && goals.some((goal) => goal.id === task.goal_id);
    const hasCourse =
      !!task.course_code &&
      (data.workspace?.curriculum.courses ?? []).some(
        (c) => c.code === task.course_code,
      );
    const fallbackCourse = data.workspace?.curriculum.courses[0]?.code ?? '';
    editingId = task.id;
    editTargetRef = hasCourse
      ? `course:${task.course_code}`
      : hasGoal
        ? `goal:${task.goal_id}`
        : fallbackCourse
          ? `course:${fallbackCourse}`
          : '';
    // Preserve an existing dual link (course + goal) when editing a course-targeted task.
    editPreserveGoalId = hasCourse && hasGoal ? task.goal_id : null;
    editTitle = task.title;
    editDue = task.due_date ?? '';
    editStartDate = task.start_date ?? '';
    editFirstStep = task.first_step ?? '';
    editDetailsText = (task.details ?? []).join('\n');
    error = '';
  }

  function cancelEdit() {
    editingId = null;
    editPreserveGoalId = null;
  }

  async function saveEdit(task: Task) {
    const isGoal = editTargetRef.startsWith('goal:');
    const targetId = editTargetRef.slice(editTargetRef.indexOf(':') + 1);
    if (!targetId || !editTitle.trim()) return;
    busy = true;
    error = '';
    try {
      await api(`study/tasks/${task.id}`, 'PATCH', {
        revision: task.revision,
        course_code: isGoal ? null : targetId,
        goal_id: isGoal ? targetId : editPreserveGoalId,
        title: editTitle,
        due_date: editDue || null,
        start_date: editStartDate || null,
        first_step: editFirstStep.trim() || null,
        details: parseDetailsLines(editDetailsText),
      });
      editingId = null;
      editPreserveGoalId = null;
      await invalidateAll();
      notice = t('study.notice.updated');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }

  async function removeTask(task: Task) {
    if (!window.confirm(t('study.delete_confirm', { title: task.title })))
      return;
    busy = true;
    error = '';
    try {
      await api(`study/tasks/${task.id}`, 'DELETE');
      if (editingId === task.id) editingId = null;
      await invalidateAll();
      notice = t('study.notice.deleted');
    } catch (e) {
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }

  async function addTask() {
    const isGoal = targetRef.startsWith('goal:');
    const targetId = targetRef.slice(targetRef.indexOf(':') + 1);
    if (!targetId) return;
    const details = parseDetailsLines(detailsText);
    busy = true;
    error = '';
    try {
      await api('study/tasks', 'POST', {
        course_code: isGoal ? null : targetId,
        goal_id: isGoal ? targetId : null,
        title,
        due_date: due || null,
        start_date: startDate || null,
        first_step: firstStep.trim() || null,
        details,
      });
      title = '';
      due = '';
      startDate = '';
      firstStep = '';
      detailsText = '';
      rawAnnouncement = '';
      reviewing = false;
      reviewWarnings = [];
      await invalidateAll();
      notice = t('study.notice.added');
    } catch (e) {
      error = msg.errorText(e);
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
      error = msg.errorText(e);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{t('study.title')}</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>{t('study.heading')}</h1>
    <p>{t('study.lead')}</p>
  </div>
  <span class="tag"
    ><Icon name="clock" size={14} />{t('study.minutes_tag', {
      minutes: Math.floor(focusTotal / 60),
    })}</span
  >
</div>
{#if error || data.studyError}<p class="error-banner" role="alert">
    {error || msg.errorText(data.studyError)}
  </p>{/if}{#if notice}<p class="success-banner" role="status">{notice}</p>{/if}
{#if !data.workspace?.profile}<div class="empty-panel">
    <h2>{t('study.open_workspace')}</h2>
    <a href="/" class="button primary">{t('plans.go_overview')}</a>
  </div>{:else}
  <div class="study-layout">
    <section>
      <form
        class="panel form-stack"
        onsubmit={(e) => {
          e.preventDefault();
          if (inputMode === 'announce' && !reviewing) extractAnnouncement();
          else addTask();
        }}
      >
        <div class="section-heading">
          <h2>
            {inputMode === 'announce' && reviewing
              ? t('study.review_heading')
              : t('study.next_target')}
          </h2>
          <div class="segmented">
            <button
              type="button"
              class:chosen={inputMode === 'manual'}
              onclick={() => {
                if (inputMode === 'announce') detailsText = '';
                inputMode = 'manual';
                reviewing = false;
                reviewWarnings = [];
              }}>{t('study.mode_manual')}</button
            ><button
              type="button"
              class:chosen={inputMode === 'announce'}
              onclick={() => (inputMode = 'announce')}
              >{t('study.mode_announce')}</button
            >
          </div>
        </div>

        {#if inputMode === 'announce' && !reviewing}
          <label
            >{t('study.announce_label')}<textarea
              bind:value={rawAnnouncement}
              rows="5"
              placeholder={t('study.announce_placeholder')}
            ></textarea></label
          >
          <p class="muted small">{t('study.announce_hint')}</p>
          <div class="toolbar-actions">
            <button
              type="button"
              class="button"
              onclick={fillExampleAnnouncement}
              >{t('study.announce_example')}</button
            ><button
              type="submit"
              class="button primary"
              disabled={!rawAnnouncement.trim()}
              >{t('study.announce_extract')}</button
            >
          </div>
        {:else}
          {#if inputMode === 'announce' && reviewWarnings.length}<div
              class="warning-banner small"
              role="status"
            >
              {#each reviewWarnings as warn}<span>
                  {warn === 'NO_TARGET'
                    ? t('study.review_warn_target')
                    : t('study.review_warn_due')}
                </span>{/each}
            </div>{/if}
          <label
            >{goals.length
              ? t('study.course_or_goal')
              : t('study.course')}<select
              value={targetRef}
              onchange={(e) => {
                targetRef = e.currentTarget.value;
                if (targetRef.startsWith('course:')) {
                  focusCourse = targetRef.slice('course:'.length);
                }
              }}
              >{#if goals.length}<optgroup label={t('study.group_courses')}
                  >{#each data.workspace.curriculum.courses as c}<option
                      value={`course:${c.code}`}>{c.code} | {c.name}</option
                    >{/each}</optgroup
                ><optgroup label={t('study.group_goals')}
                  >{#each goals as g}<option value={`goal:${g.id}`}
                      >{g.title}</option
                    >{/each}</optgroup
                >{:else}{#each data.workspace.curriculum.courses as c}<option
                    value={`course:${c.code}`}>{c.code} | {c.name}</option
                  >{/each}{/if}</select
            ></label
          ><label
            >{t('study.target')}<input
              bind:value={title}
              placeholder={t('study.target_placeholder')}
              maxlength="250"
              required
            /></label
          >
          <div class="form-grid">
            <label
              >{t('study.target_date')}<input
                type="date"
                bind:value={due}
              /></label
            ><label
              >{t('study.start_date')}<input
                type="date"
                max={due || undefined}
                bind:value={startDate}
              /></label
            >
          </div>
          <label
            >{t('study.first_step')}<input
              bind:value={firstStep}
              placeholder={t('study.first_step_placeholder')}
              maxlength="250"
            /></label
          >
          {#if inputMode === 'announce'}<label
              >{t('study.details_label')}<textarea
                bind:value={detailsText}
                rows="3"
                placeholder={t('study.details_placeholder')}
              ></textarea></label
            >{:else}<details class="manual-details">
              <summary class="small muted"
                >{t('study.manual_details_toggle')}</summary
              >
              <label
                >{t('study.details_label')}<textarea
                  bind:value={detailsText}
                  rows="3"
                  placeholder={t('study.details_placeholder')}
                ></textarea></label
              >
            </details>{/if}
          <div class="toolbar-actions">
            {#if inputMode === 'announce'}<button
                type="button"
                class="button"
                onclick={() => (reviewing = false)}
                >{t('study.back_paste')}</button
              >{/if}
            <button class="button primary" disabled={busy || !title.trim()}
              >{inputMode === 'announce'
                ? t('study.confirm_add')
                : t('study.add')}<Icon name="plus" size={15} /></button
            >
          </div>
        {/if}
      </form>
      <section class="panel">
        <div class="section-heading">
          <h2>{t('study.targets')}</h2>
          <div class="study-filters">
            {#if goals.length}<select
                aria-label={t('study.filter_goal')}
                bind:value={goalFilter}
                ><option value="all">{t('study.filter_goal_all')}</option
                ><option value="courses"
                  >{t('study.filter_goal_courses')}</option
                >{#each goals as g}<option value={g.id}>{g.title}</option
                  >{/each}</select
              >{/if}
            <div class="segmented">
              <button
                class:chosen={filter === 'all'}
                onclick={() => (filter = 'all')}>{t('study.filter.all')}</button
              ><button
                class:chosen={filter === 'open'}
                onclick={() => (filter = 'open')}
                >{t('study.filter.open')}</button
              ><button
                class:chosen={filter === 'done'}
                onclick={() => (filter = 'done')}
                >{t('study.filter.done')}</button
              >
            </div>
          </div>
        </div>
        {#if data.study.tasks.some((task) => (task.due_date || task.start_date) && !task.done)}<div
            class="calendar-export"
          >
            <button
              class="button"
              onclick={() =>
                downloadIcs(
                  tasksToIcs(
                    data.study.tasks,
                    Object.fromEntries(
                      (data.workspace?.curriculum.courses ?? []).map((c) => [
                        c.code,
                        c.name,
                      ]),
                    ),
                    new Date(),
                    {
                      withCourse: (course) => t('study.ics_course', { course }),
                      withGoal: (goal) => t('study.ics_goal', { goal }),
                      withBoth: (course, goal) =>
                        t('study.ics_both', { course, goal }),
                      startPrefix: t('study.ics_start_prefix'),
                      firstStepLabel: (step) =>
                        t('study.ics_first_step', { step }),
                      plain: t('study.ics_plain'),
                    },
                    goalNames,
                  ),
                )}>{t('study.ics')}</button
            >
            <p class="muted small">
              {t('study.ics_hint')}
            </p>
          </div>{/if}
        {#each tasks as task (task.id)}<div class="study-task">
            {#if editingId === task.id}
              <form
                class="form-stack task-edit-form"
                onsubmit={(e) => {
                  e.preventDefault();
                  saveEdit(task);
                }}
              >
                <label
                  >{goals.length
                    ? t('study.course_or_goal')
                    : t('study.course')}<select bind:value={editTargetRef}
                    >{#if goals.length}<optgroup
                        label={t('study.group_courses')}
                        >{#each data.workspace.curriculum.courses as c}<option
                            value={`course:${c.code}`}
                            >{c.code} | {c.name}</option
                          >{/each}</optgroup
                      ><optgroup label={t('study.group_goals')}
                        >{#each goals as g}<option value={`goal:${g.id}`}
                            >{g.title}</option
                          >{/each}</optgroup
                      >{:else}{#each data.workspace.curriculum.courses as c}<option
                          value={`course:${c.code}`}>{c.code} | {c.name}</option
                        >{/each}{/if}</select
                  ></label
                >
                <label
                  >{t('study.target')}<input
                    bind:value={editTitle}
                    maxlength="250"
                    required
                  /></label
                >
                <div class="form-grid">
                  <label
                    >{t('study.target_date')}<input
                      type="date"
                      bind:value={editDue}
                    /></label
                  ><label
                    >{t('study.start_date')}<input
                      type="date"
                      max={editDue || undefined}
                      bind:value={editStartDate}
                    /></label
                  >
                </div>
                <label
                  >{t('study.first_step')}<input
                    bind:value={editFirstStep}
                    maxlength="250"
                  /></label
                >
                <label
                  >{t('study.details_label')}<textarea
                    bind:value={editDetailsText}
                    rows="3"
                    placeholder={t('study.details_placeholder')}
                  ></textarea></label
                >
                <div class="toolbar-actions">
                  <button
                    type="submit"
                    class="button primary"
                    disabled={busy || !editTitle.trim()}
                    >{t('study.save_edit')}</button
                  ><button
                    type="button"
                    class="button"
                    disabled={busy}
                    onclick={cancelEdit}>{t('study.cancel_edit')}</button
                  >
                </div>
              </form>
            {:else}
              <div class="study-task-head">
                <label
                  ><input
                    type="checkbox"
                    checked={task.done}
                    disabled={busy}
                    onchange={() => toggle(task)}
                  /><span class:completed-task={task.done}
                    ><strong>{task.title}</strong><small
                      >{taskContext(task)}{task.start_date
                        ? t('study.start_badge', { date: task.start_date })
                        : ''}{task.due_date
                        ? t('study.due', { date: task.due_date })
                        : ''}</small
                    ></span
                  ></label
                >
                <div class="task-actions">
                  {#if !task.done}<button
                      type="button"
                      class="button subtle small start-step-btn"
                      disabled={busy}
                      onclick={() => startTaskInFocus(task)}
                      >{t('study.start_now')}</button
                    >{/if}<button
                    type="button"
                    class="button subtle small"
                    aria-label={t('study.edit_target_aria', {
                      title: task.title,
                    })}
                    disabled={busy}
                    onclick={() => beginEdit(task)}>{t('study.edit')}</button
                  ><button
                    type="button"
                    class="button subtle small"
                    aria-label={t('study.delete_target_aria', {
                      title: task.title,
                    })}
                    disabled={busy}
                    onclick={() => removeTask(task)}>{t('study.delete')}</button
                  >
                </div>
              </div>
              {#if task.first_step && !task.done}<p class="task-start-step">
                  {t('study.first_step_prefix', { step: task.first_step })}
                </p>{/if}
              {#if task.details?.length && !task.done}<ul class="task-details">
                  {#each task.details as detail}<li>{detail}</li>{/each}
                </ul>{/if}
            {/if}
          </div>{/each}{#if !tasks.length}<p class="muted">
            {t('study.no_targets')}
          </p>{/if}
      </section>
      <section class="panel">
        <h2>{t('study.recent')}</h2>
        {#each data.study.sessions.slice(0, 12) as session}<div
            class="session-row"
          >
            <div>
              <strong>{session.course_code}</strong>
              <p>{session.note || t('study.default_note')}</p>
            </div>
            <span
              >{Math.floor(session.seconds / 60)}m {session.seconds % 60}s</span
            ><time datetime={session.created_at}
              >{new Date(session.created_at).toLocaleDateString(
                locale() === 'id' ? 'id-ID' : 'en-GB',
                { timeZone: 'Asia/Jakarta' },
              )}</time
            >
          </div>{/each}{#if !data.study.sessions.length}<p class="muted">
            {t('study.no_sessions')}
          </p>{/if}
      </section>
    </section>
    <aside class="panel focus-panel" bind:this={focusPanel}>
      <div class="section-heading">
        <h2>{t('study.focus_space')}</h2>
        <Icon name="clock" />
      </div>
      <div class="segmented">
        <button
          class:chosen={mode === 'focus'}
          disabled={busy}
          onclick={() => reset('focus')}>{t('study.mode.focus')}</button
        ><button
          class:chosen={mode === 'break'}
          disabled={busy}
          onclick={() => reset('break')}>{t('study.mode.break')}</button
        >
      </div>
      <div class="timer" role="timer" aria-label={t('study.timer_aria')}>
        {clock}
      </div>
      <p class="timer-caption">
        {sessionId ? sessionCourse : focusCourse} | {mode === 'focus'
          ? t('study.caption.focus')
          : t('study.caption.break')}
      </p>
      {#if goals.length}<label class="focus-course-picker"
          >{t('study.focus_course')}<select
            bind:value={focusCourse}
            disabled={running || !!sessionId}
            >{#each data.workspace.curriculum.courses as c}<option
                value={c.code}>{c.code} | {c.name}</option
              >{/each}</select
          ></label
        >{/if}
      {#if restored}<p class="warning-banner small">
          {t('study.restored')}
        </p>{/if}
      <div class="timer-actions">
        <button
          class="button primary"
          disabled={busy || remaining === 0}
          onclick={() => (running ? pause() : start())}
          >{running
            ? t('study.pause')
            : accumulated > 0
              ? t('study.resume')
              : t('study.start')}</button
        ><button class="button" disabled={busy} onclick={() => reset(mode)}
          >{t('study.reset')}</button
        >
      </div>
      <div class="form-grid">
        <label
          >{t('study.focus_minutes')}<input
            type="number"
            min="1"
            max="120"
            bind:value={minutes}
            disabled={running || !!sessionId}
            onchange={() =>
              (duration = Math.min(120, Math.max(1, minutes || 25)) * 60)}
          /></label
        ><label
          >{t('study.break_minutes')}<input
            type="number"
            min="1"
            max="120"
            bind:value={breakMinutes}
            disabled={running}
          /></label
        >
      </div>
      {#if mode === 'focus'}<label
          >{t('study.learned')}<textarea
            bind:value={sessionNote}
            maxlength="500"
            rows="3"
            placeholder={t('study.learned_placeholder')}
          ></textarea></label
        ><button
          class="button full-width"
          disabled={busy || elapsed < 1}
          onclick={saveSession}
          >{busy ? t('study.saving') : t('study.finish')}</button
        >{/if}
      <p class="footnote">
        {t('study.footnote')}
      </p>
    </aside>
  </div>{/if}
