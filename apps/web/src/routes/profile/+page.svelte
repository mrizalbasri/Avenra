<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  let alias = $state(untrack(() => data.workspace?.profile?.alias ?? ''));
  let currentTerm = $state(
    untrack(() => data.workspace?.profile?.current_term ?? 2),
  );
  let completed = $state<string[]>(
    untrack(() => [...(data.workspace?.profile?.completed ?? [])]),
  );
  let revision = $state(untrack(() => data.workspace?.profile?.revision ?? 1));
  let notice = $state('');
  let busy = $state(false);
  let error = $state('');
  async function save() {
    busy = true;
    error = '';
    notice = '';
    try {
      const profile = await api<{ revision: number }>('profile', 'PATCH', {
        alias,
        current_term: currentTerm,
        completed,
        revision,
      });
      revision = profile.revision;
      await invalidateAll();
      notice = 'Profile saved. All plan checks now use your updated progress.';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | Academic profile</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Your starting point.</h1>
    <p>
      Set your current semester and completed courses. Plans build on this
      shared baseline.
    </p>
  </div>
</div>
{#if data.workspace?.profile}<form
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <section class="panel profile-form">
      <h2>Academic profile</h2>
      <p class="muted">
        Use an alias and fictional records in this local demo.
      </p>
      <div class="form-grid">
        <label
          >Student alias<input
            bind:value={alias}
            maxlength="80"
            required
          /></label
        ><label
          >Current semester<input
            type="number"
            min="1"
            max="12"
            bind:value={currentTerm}
            required
          /></label
        >
      </div>
    </section>
    <section class="panel">
      <div class="section-heading">
        <h2>Completed courses</h2>
        <span class="tag">{completed.length} selected</span>
      </div>
      <p class="muted small">
        Mark only courses already passed. Scenario failures stay inside
        individual plans.
      </p>
      <div class="course-checklist">
        {#each data.workspace.curriculum.courses as course}<label
            ><input
              type="checkbox"
              bind:group={completed}
              value={course.code}
            />
            <div>
              <strong>{course.name}</strong><small
                >{course.code} | {course.credits} credits</small
              >
            </div></label
          >{/each}
      </div>
    </section>
    {#if error}<p class="error-banner" role="alert">
        {error}
      </p>{/if}{#if notice}<p class="success-banner" role="status">
        {notice}
      </p>{/if}<button class="button primary" disabled={busy}
      >{busy ? 'Saving…' : 'Save academic profile'}</button
    >
  </form>{:else}<div class="empty-panel">
    <h2>No academic profile yet.</h2>
    <a class="button primary" href="/">Open the demo workspace</a>
  </div>{/if}
