<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { api } from '#lib/api.js';
  import { parseCoursesCSV, parseGpaRules } from '#lib/curriculum-import.js';
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
          max="14"
          bind:value={currentTerm}
          required
        /></label
      ><label
        >Last semester IPS (optional)<input
          type="number"
          min="0"
          max="4"
          step="0.01"
          bind:value={lastGpa}
          placeholder="e.g. 3.25"
        /></label
      ><label
        >Maximum credits per semester<input
          type="number"
          min="1"
          max="24"
          bind:value={cap}
          required
        /></label
      ><label
        >Credits needed to graduate (optional)<input
          type="number"
          min="1"
          max="300"
          bind:value={graduationCredits}
          placeholder="e.g. 144"
        /></label
      ><label
        >On-time graduation (semester)<input
          type="number"
          min="1"
          max="14"
          bind:value={targetTerms}
          required
        /></label
      ><label
        >Maximum study period (semesters)<input
          type="number"
          min="1"
          max="14"
          bind:value={maxTerms}
          required
        /></label
      >
    </div>
    <label
      >Credit limit by IPS<textarea
        bind:value={gpaRules}
        rows="4"
        placeholder="3.00 = 24"
      ></textarea></label
    >
    <p class="muted small">
      One rule per line: minimum IPS = maximum credits. Copy the table from your
      academic handbook. Leave empty if your campus has no IPS rule.
    </p>
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
      course codes for prerequisites, separated by semicolons; write
      <code>A|B</code> when either course is enough. Offering: odd, even, or both.
      Category: required or elective. Corequisites may be taken in the same semester.
      min_credits is the credits needed before taking the course, for example an internship
      or thesis.
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
        placeholder="code,name,credits,recommended_term,prerequisites,offered_terms,category,corequisites,min_credits"
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
    Rules are user-supplied until independently verified. Avenra checks
    prerequisites (including "either A or B"), corequisites, earned-credit
    thresholds, electives toward a graduation total, odd/even offerings, and an
    IPS-based credit limit for next semester. Exceptions, equivalent courses,
    and credit transfer still need advisor review.
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
