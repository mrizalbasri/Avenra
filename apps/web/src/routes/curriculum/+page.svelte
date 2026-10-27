<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import { parseCoursesCSV } from '#lib/curriculum-import.js';
  import type { Workspace } from '#lib/types.js';
  let alias = $state('');
  let university = $state('');
  let program = $state('');
  let year = $state('2026');
  let source = $state('');
  let cap = $state(20);
  let currentTerm = $state(1);
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
      error = 'Keep the CSV under 60 KB and 100 courses.';
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
      const result = await api<Workspace>('workspace/import', 'POST', {
        alias,
        current_term: currentTerm,
        curriculum: {
          id: crypto.randomUUID(),
          name: `${university} | ${program}`,
          version: year,
          status: 'user_supplied',
          disclaimer:
            'User-supplied curriculum. Verify rules with your university.',
          source,
          credit_cap: cap,
          courses,
        },
      });
      await invalidateAll();
      await goto('/profile');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Avenra | Bring your curriculum</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Your campus. Your curriculum.</h1>
    <p>
      Build a workspace for your own program. Avenra uses the rules you provide,
      without assuming every university is the same.
    </p>
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
    <h2>Academic context</h2>
    <div class="form-grid">
      <label
        >Student alias<input
          bind:value={alias}
          required
          maxlength="80"
          placeholder="Use an alias for this local prototype"
        /></label
      ><label
        >University<input
          bind:value={university}
          required
          maxlength="70"
          placeholder="Your university"
        /></label
      ><label
        >Study program<input
          bind:value={program}
          required
          maxlength="70"
          placeholder="e.g. Informatika"
        /></label
      ><label
        >Curriculum year / version<input
          bind:value={year}
          required
          maxlength="80"
        /></label
      ><label
        >Current semester<input
          type="number"
          min="1"
          max="12"
          bind:value={currentTerm}
          required
        /></label
      ><label
        >Maximum credits per semester<input
          type="number"
          min="1"
          max="24"
          bind:value={cap}
          required
        /></label
      >
    </div>
    <label
      >Rule source or curriculum reference<input
        bind:value={source}
        required
        maxlength="500"
        placeholder="Official handbook URL, document title, or rule reference"
      /></label
    >
  </section>
  <section class="panel">
    <div class="section-heading">
      <h2>Import your courses</h2>
      <a href="/curriculum-template.csv" download class="button"
        >Download CSV template</a
      >
    </div>
    <p class="muted small">
      Export a course list from your curriculum handbook into the template. Use
      course codes for prerequisites, separated by semicolons. Offering options:
      odd, even, or both. Leave no required rule implied.
    </p>
    <label
      >Choose a CSV file<input
        type="file"
        accept=".csv,text/csv"
        onchange={(e) => readFile(e.currentTarget.files?.[0])}
      /></label
    ><label
      >Or paste CSV content<textarea
        bind:value={csv}
        rows="9"
        placeholder="code,name,credits,recommended_term,prerequisites,offered_terms"
      ></textarea></label
    >{#if preview.length}<p class="success-text">
        {preview.length} courses ready to validate{filename
          ? ` from ${filename}`
          : ''}.
      </p>
      <div class="table-scroll">
        <table>
          <thead
            ><tr
              ><th>Code</th><th>Course</th><th>Credits</th><th>Prerequisites</th
              ></tr
            ></thead
          ><tbody
            >{#each preview.slice(0, 8) as c}<tr
                ><td>{c.code}</td><td>{c.name}</td><td>{c.credits}</td><td
                  >{c.prerequisites.join(', ') || 'None'}</td
                ></tr
              >{/each}</tbody
          >
        </table>
      </div>{/if}
  </section>
  <div class="warning-banner">
    Rules are user-supplied until independently verified. This importer supports
    ordinary prerequisite chains, credit caps, and odd/even offerings.
    Concurrent prerequisites, electives with alternative requirements, credit
    transfer, and GPA-dependent caps need advisor review.
  </div>
  {#if error}<p class="error-banner" role="alert">{error}</p>{/if}<button
    class="button primary"
    disabled={busy || !csv.trim()}
    >{busy ? 'Validating curriculum…' : 'Create my academic workspace'}</button
  >
  <p class="footnote">
    A new workspace keeps any previous curriculum and plans intact. This local
    prototype has no sign-in; use aliases and non-sensitive data.
  </p>
</form>
