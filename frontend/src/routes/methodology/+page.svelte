<svelte:head><title>Avenra | Rules & methodology</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>Know what your plan is built on.</h1>
    <p>Clear rules, visible assumptions, and room for an advisor's judgment.</p>
  </div>
</div>
<div class="reading-column">
  <section class="panel">
    <h2>Bring your own curriculum</h2>
    <p>
      Students from different universities can create separate workspaces by
      importing their own course CSV. Each workspace retains its program,
      curriculum version, credit cap, prerequisite graph, source reference,
      plans, and study targets.
    </p>
    <p>
      Imported rules are labeled user-supplied, not independently verified. A
      structurally valid CSV does not establish that it accurately represents
      institutional policy. All imported courses are treated as required;
      elective groups need manual review.
    </p>
    <a href="/curriculum" class="button">Import a curriculum</a>
  </section>
  <section class="panel">
    <h2>Synthetic curriculum</h2>
    <p>
      The bundled Computing curriculum is fictional. Its course names, credit
      values, prerequisites, and offering calendar are demonstration
      assumptions. No university policy has been verified.
    </p>
    <p>
      Source: <code>backend/app/fixtures/demo-curriculum.json</code>. Every
      validation and export records the curriculum version.
    </p>
  </section>
  <section class="panel">
    <h2>What gets checked</h2>
    <ul>
      <li>
        All remaining required courses must be scheduled within the chosen
        horizon.
      </li>
      <li>Prerequisites must be completed or placed in an earlier semester.</li>
      <li>Each semester must stay within your selected credit limit.</li>
      <li>
        Course placement must follow the modeled odd/even offering calendar.
      </li>
    </ul>
    <p>
      Unknown codes and malformed input are rejected. Invalid drafts can be
      saved for exploration, but they are labeled for review.
    </p>
  </section>
  <section class="panel">
    <h2>How recovery works</h2>
    <p>
      OR-Tools CP-SAT searches for an earlier-completion option and a
      lighter-peak-workload option. A separate rule checker validates each
      result. If only one distinct option is found, Avenra shows one. A timeout
      is reported separately from infeasibility.
    </p>
    <p>
      Scenario setbacks override progress only inside that plan. They do not
      overwrite the shared academic profile.
    </p>
  </section>
  <section class="panel">
    <h2>Learning support</h2>
    <p>
      Course tasks and focus sessions help you turn intentions into action. Time
      spent is not a measure of comprehension, and completing a task never marks
      an academic course as passed.
    </p>
  </section>
  <section class="panel">
    <h2>Privacy and boundaries</h2>
    <p>
      Workspaces are scoped by a browser-held identifier. This prototype has no
      sign-in or verified identity: workspace separation is not authentication.
      Use aliases and non-sensitive examples. Public multi-user deployment
      requires authentication, authorization, and further privacy review.
      Clearing browser storage may remove the workspace selector; it does not
      delete database records.
    </p>
    <p>
      Exceptions, transfer credit, concurrent prerequisites, GPA-dependent
      credit caps, and internship conversion are not modeled. Discuss a Decision
      Passport with an authorized academic advisor.
    </p>
  </section>
  <section class="panel">
    <h2>Technology and attribution</h2>
    <p>
      SvelteKit, Svelte Flow, FastAPI, PostgreSQL, SQLAlchemy, and Google
      OR-Tools. OpenAI Codex materially assisted with implementation, tests, and
      documentation. Team members remain responsible for reviewing and
      understanding the work.
    </p>
  </section>
</div>
