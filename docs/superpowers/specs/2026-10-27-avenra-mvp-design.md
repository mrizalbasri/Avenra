# Avenra MVP design and delivery plan

Status: product roadmap proposal. The user subsequently authorized foundation setup
with SvelteKit and Svelte Flow rather than the Next.js recommendation below.
See `../../IMPLEMENTATION_PLAN.md` for current implementation scope. The remaining
MVP phases are planned, not completed.

## Product direction

Avenra helps students plan and recover their academic path, then translate their
selected plan into study goals. Its main workspace is a semester board within a
pannable, zoomable canvas. A student can create, duplicate, rename, archive, edit,
and compare plans. Study support belongs to individual courses and remains
secondary to academic planning correctness.

This proposal recommends Next.js instead of the SvelteKit option in
`2026-10-27-project-setup-design.md`, following the subsequent discussion about
canvas interaction. The earlier setup document remains historical context;
neither stack proposal has been approved. The BRD and PRD remain requirements
inputs; update their frontend and study-support scope after this design is approved.

## Architecture options

1. Recommended: Next.js, React Flow, FastAPI, PostgreSQL, and OR-Tools. React Flow
   supplies canvas primitives while Python hosts the constraint engine.
2. SvelteKit with Svelte Flow and the same backend. Retains the original proposal;
   prefer this if the team is substantially more comfortable with Svelte.
3. React semester board without an infinite canvas. Fewer interaction concerns,
   but omits the requested canvas exploration experience.

The recommendation assumes no strong existing frontend preference. React Flow
provides interaction primitives, not a finished semester planner. Semester drop
zones, card layout, rule feedback, and accessible move controls require app logic.
Use one drag interaction system for the initial canvas; avoid overlapping drag
libraries until a demonstrated interaction gap warrants one.

## Proposed stack and boundaries

| Area              | Choice                                | Responsibility                                     |
| ----------------- | ------------------------------------- | -------------------------------------------------- |
| Web               | Next.js App Router, React, TypeScript | Navigation, plan workspace, study panel            |
| Canvas            | React Flow (`@xyflow/react`)          | Nodes, dependency edges, viewport interaction      |
| Styling           | Tailwind CSS                          | Consistent layout and interaction states           |
| API               | FastAPI and Pydantic                  | Validation, plan commands, versioned API contracts |
| Persistence       | PostgreSQL, SQLAlchemy, Alembic       | Plans, revisions, study records, migrations        |
| Optimization      | OR-Tools CP-SAT                       | Feasible alternatives under modeled constraints    |
| Tooling           | pnpm and uv                           | Separate locked frontend and Python dependencies   |
| Verification      | pytest, Vitest, Playwright            | Rules, state transitions, complete user journeys   |
| Local environment | Docker Compose for PostgreSQL         | Reproducible local persistence                     |

Use a supported Node LTS and a Python version with compatible OR-Tools wheels;
select exact versions after a dependency installation check and lock them.
The currently installed Python 3.14 is not assumed compatible. No paid service
or LLM is required for the core flow. Public deployment and account-provider
selection are later decisions, with a reliable local demo as the first target.

The first local demo is single-user and synthetic. A publicly accessible service
that stores individual student data requires authentication, ownership checks,
and isolation tests before release; that is a separate delivery gate.

## Workspace and plan semantics

- Start from a selected curriculum and explicitly entered completed courses.
- Prepopulate a plan; provide an unscheduled area and one frame per semester.
- Persist course-to-semester assignments separately from visual coordinates.
- Dragging a course into another semester changes the assignment. Rearranging
  its position within the same semester changes presentation only.
- Provide a keyboard-accessible Move to semester action and a list view for
  smaller screens. Canvas dragging cannot be the only editing method.
- Show prerequisite edges for the selected course and its relevant neighbors.
  Official prerequisites are read-only and derived from versioned curriculum data.
- Allow invalid drafts with visible reasons. Distinguish invalid from unknown
  or conditional rules; only confirmed checks support a valid-under-assumptions label.
- Support undo/redo for plan edits. Duplicate a plan into an independent scenario.
  Archived plans remain recoverable.
- Compare two plans by semester load, rule violations, and modeled completion
  horizon. Completion estimates remain conditional on the modeled rules.
- Disruptions such as a failed prerequisite belong to a scenario; they do not
  silently overwrite the student's academic record or another scenario.

## Domain modules and data

Curriculum holds versioned courses, prerequisites, credit limits, offering
assumptions, and source references. Profile holds course attempts and completion
status. Plan holds assignments, scenario overrides, assumptions, and revision.
Validation produces rule findings tied to that revision. The solver reads a
validated snapshot and returns alternatives. A separate checker revalidates
every generated plan; explanation generation uses structured rule traces.

StudyGoal and StudyTask attach to a course and student profile. FocusSession
records a chosen goal, elapsed time, and completion notes. Simulation outcomes
never mark a course officially passed. Study data does not change academic rules.

Viewport coordinates are presentation state. Validation and solver results are
derived artifacts; they must identify the curriculum version and plan revision.
Decision Passport export includes the chosen snapshot, assumptions, findings,
and questions for an advisor.

## Data flow and failure behavior

The browser sends requests through a same-origin web API proxy to FastAPI.
FastAPI owns all domain validation and database writes. The frontend may show
immediate provisional feedback, but server results are authoritative. Use generated
TypeScript contracts from OpenAPI once endpoints stabilize.

A plan edit increments its revision. After saving, request validation of that
snapshot. Discard stale responses for older revisions. Solver execution is
explicitly requested, time-bounded, and reports feasible, infeasible, timeout,
and invalid-input outcomes separately. A timeout does not establish infeasibility.
Show two distinct valid alternatives only when available; explain if there is
one or none. Never fill gaps with invented schedules.

Track unsaved, saving, saved, and failed-save states visibly. Failed saves retain
the local draft for retry; reload recovery requires a local draft snapshot.
Use optimistic revision checks to prevent silent overwrite between tabs.
Liveness checks the API process; readiness checks database availability.

## Learning support scope

After a student selects a plan, they can add weekly course goals and tasks,
start a focus timer, pause/resume it, and record progress. Offer configurable
focus/break durations and a free timer. Persist timestamps and accumulated time
so background-tab throttling does not corrupt elapsed time. Reload restores a
paused session pending confirmation. Notifications are optional and permission-based.

Do not infer understanding from minutes spent. Goals and tasks have explicit
user-confirmed completion. Quizzes, AI tutoring, spaced-repetition scheduling,
real-time collaboration, and campus-system integration are outside this MVP.

## Delivery sequence and acceptance gates

Each phase is a work package, not a promised calendar duration. Assign dates and
owners after team availability and data access are known.

1. Foundation: create `apps/web`, `apps/api`, fixtures, local database configuration,
   migrations, environment examples, and README. Pass web build/type checks,
   API liveness/readiness checks, and an isolated OR-Tools smoke problem.
2. Curriculum and rule engine: introduce a small synthetic fixture, source/status
   metadata, profile validation, prerequisite traversal, and credit checks. Reject
   duplicate/unknown course assignments and prerequisite cycles. Cover the PRD's
   critical rule cases before building solver recommendations.
3. Plan workspace: implement saved plans, semester frames, course moves,
   dependency highlighting, undo/redo, revision handling, and keyboard controls.
   Verify save/reload, cross-semester moves, invalid drafts, and failed-save retry.
4. Recovery and comparison: model a disruption, solve alternatives, independently
   check outputs, and compare snapshots. Test infeasible horizons, timeouts,
   unavailable/uncertain offerings, and stale solve responses.
5. Learning companion: course goals, tasks, and focus sessions. Verify pause,
   resume, reload, and background-tab timing independently of academic progress.
6. Demo and evaluation: add print-ready Decision Passport, validate the chosen
   curriculum against actual sources, test student tasks, and document actual
   results, limitations, third-party resources, and material AI assistance.

The first useful vertical slice ends at phase 3: load a profile, duplicate a plan,
move a course, inspect a rule finding, and reload the saved draft. Full MVP
completion requires recovery generation, comparison, study support, and export.
Do not call the synthetic vertical slice a verified institutional planner.

For competition preparation, track completed work and remaining substantive work
honestly. Select 2–3 Final Day tasks from the actual remaining backlog; record
starting/final versions and contributions. Recheck organizer updates before
committing to competition deadlines.

## Verification and research

Use pytest for graph rules, solver-independent checks, infeasibility, timeouts,
and API revision behavior; Vitest for plan edit/undo and timer calculations;
Playwright for the saved-plan recovery flow, accessible movement, comparison,
and export freshness. Report executed checks accurately.

With consenting students, compare a manual planning task to Avenra using plan
correctness, task time, and explanation comprehension. Evaluate learning support
separately through target completion and qualitative feedback. These are proposed
measurements, not established outcomes. Do not claim learning gains or winning odds.

## Reference sources

- Local BRD and PRD in the repository root.
- User-provided STACK handbook: `D:\Dwonload\Handbook STACK 2026.pdf`.
- Next.js: https://nextjs.org/docs/app/getting-started/installation
- React Flow viewport: https://reactflow.dev/learn/concepts/the-viewport
- React Flow API: https://reactflow.dev/api-reference/react-flow
- OR-Tools Python installation: https://developers.google.com/optimization/install/python

## Review and implementation boundary

Review the product scope, proposed switch to Next.js, and delivery sequence with
the user before scaffolding. No Git repository, commit, remote, deployment, or
application code is created by this planning step. Obtain explicit authorization
for commits and remote writes under the repository guidelines.
