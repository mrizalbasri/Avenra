# Product Requirements Document (PRD)
## AVENRA — Explainable Academic Decision & Recovery Support

| Metadata | Detail |
|---|---|
| Document ID | AVN-PRD-001 |
| Version | 0.1 — Planning baseline |
| Date | 27 October 2026 |
| Parent document | `BRD_Avenra_STACK_2026.md` |
| Competition | STACK 2026 / Case 1 — Smarter Campus and Learning |
| Status | Planned, **not implemented or user-validated** |
| Target platform | Responsive web MVP |
| Team roles | TBD |

> **Product principle:** Avenra does not register courses, authorize enrollment, or guarantee graduation. Every plan must disclose curriculum version, data completeness, and non-verified assumptions. The student and official academic advisor retain decision authority.

## 1. Vision and problem

Help students navigate academic disruptions by transforming curriculum constraints into explainable, feasible recovery options and a concise advising action plan.

**Primary journey:** Student enters progress → selects disruption → sees blocker and downstream impact → generates feasible alternatives → compares trade-offs → exports Academic Decision Passport.

**North-star usability outcome:** complete a correct recovery-planning task and understand *why* one plan is valid and another is not. Measurement, not a claimed achievement.

## 2. Product goals / non-goals

### Goals

- Complete one end-to-end, reproducible **academic recovery** demo on a verified curriculum.
- Use a deterministic rules/constraint engine for academic feasibility.
- Make assumptions and explanation traces visible.
- Generate actionable advisor-ready documentation.
- Validate correctness and usefulness through actual testing.

### Non-goals for MVP

- Accessing live university systems, processing personal transcripts via OCR, automating enrollment, building social features, guaranteeing a completion date, training unvalidated ML risk models, or giving therapeutic/medical workload advice.

## 3. Personas, jobs and environments

| Persona | Job to be done | Critical context |
|---|---|---|
| Student with a delayed prerequisite | “Show me what changes if I must retake Course X.” | Course dependency and offerings |
| Student balancing an internship | “Show alternatives that fit my credit and time constraints.” | User-selected time restrictions, verified credit policy |
| Student preparing for advising | “Help me explain my options and unresolved questions.” | Accurate source-linked decision packet |
| Academic advisor (reviewer, not account type in MVP) | “Understand what rules and assumptions shaped this plan.” | Exported PDF, clear limitation flags |

## 4. Priority and release scope

**P0 — Competition MVP:** CUR-01, PRO-01, BOT-01, SIM-01, OPT-01, EXP-01, CMP-01, PAS-01, SEC-01, DEMO-01.

**P1 — If P0 stable:** workload preferences and internship conflict input (not claiming prediction), editable plan after advisor feedback.

**P2 — Post competition:** authenticated advisors, institutional data integrations, multiple curriculum versions/programs, notifications, predictive ML only after obtaining permitted longitudinal data.

| Module | P | Description | Demonstration result |
|---|---|---|---|
| Curriculum Registry | P0 | Courses, SKS, prerequisites, term availability, source/version | Show version and source |
| Academic Profile | P0 | Completed courses + grades/pass state + remaining requirements | Load synthetic student |
| Bottleneck Detector | P0 | Graph traversal + rule validation | Show downstream affected courses |
| Recovery Event | P0 | Fail/postpone course and recalculate | Explain changed constraints |
| Scenario Optimizer | P0 | Generate feasible semester schedules | Multiple alternatives or explain none |
| Comparison View | P0 | Compare completion term, load, assumption badges | Distinct trade-off comparison |
| Explainability Layer | P0 | Constraint trace for every recommendation | “Why this?” panel |
| Decision Passport | P0 | PDF/print summary with alternatives and questions | Downloadable adviser packet |
| Quality/Security | P0 | Deterministic tests, privacy, secret hygiene | Repeatable demo and test evidence |
| Workload Preferences | P1 | Free hours and maximum self-chosen workload | Changed scenario preferences |
| Internship Scenario | P1 | Time-block and credit assumptions | Feasible alternative where rules are known |
| Advisor Review | P2 | Comments and acknowledgment | Not needed for initial demo |

## 5. Key user flows

### FLOW-A — First-use setup

1. Open web app → choose supported program and curriculum version.
2. Read limitations; accept/use **synthetic demo profile** or manually enter own course statuses.
3. System checks invalid course IDs, duplicate statuses, and credit consistency.
4. Student lands on a requirement summary and blocker visualization.

**Failure path:** Missing/unknown rule sources produce a visible warning; system will not label a speculative plan as “verified”.

### FLOW-B — Recovery after failed prerequisite (signature flow)

1. Choose failed/postponed course and affected term.
2. Show dependency graph and list of blocked downstream courses.
3. Generate valid recovery plans based on verified rules and explicitly selected offering assumptions.
4. Compare Plan A (“earliest feasible”) vs Plan B (“more balanced credit loads”) when two feasible plans exist.
5. Open rule-level explanation and reasons a suggested original plan was invalid.
6. Export Academic Decision Passport.

**Failure path:** If no feasible plan exists within chosen horizon, show `NO_FEASIBLE_PLAN`, relevant conflicting constraints, and next actions (change horizon, revise optional preferences, seek advisor clarification). **Never invent an alternative.**

### FLOW-C — Consult and update (P1)

Student prints/exports passport → discusses with advisor → records outcome and revises preferences/rules only after proper verification. MVP does not imply an advisor has approved any plan.

## 6. Functional requirements and acceptance criteria

### CUR-01 — Curriculum registry (P0)

**Requirement:** Support at least one seeded curriculum with course codes, names, credit values, prerequisite relationships, mandatory/elective classification, curriculum version, and documented offering assumptions.

**Acceptance criteria:**
- [ ] Every rule is associated with a curriculum version and source citation or an **explicit simulation-only flag**.
- [ ] Duplicate course IDs and prerequisite cycles are rejected or flagged for correction (cycle handling must not silently fail).
- [ ] Invalid/unrecognized course codes cannot be silently matched to other courses.
- [ ] Admin-maintained fixture is versioned in Git; no unauthorized official university branding.

### PRO-01 — Academic profile (P0)

**Requirement:** Allow manual structured input and seeded synthetic examples; identify completed/passed vs failed/deferred courses.

**Acceptance criteria:**
- [ ] Synthetic “on-track” and “failed-prerequisite” personas can be loaded in one click.
- [ ] Conflicting states are rejected (same course both completed and failed for the same attempt).
- [ ] Missing information is visibly flagged; results are not misrepresented as institution-verified.
- [ ] Course identifiers and SKS totals are validated server-side.

### BOT-01 — Academic bottleneck detector (P0)

**Requirement:** Traverse course dependency graph to identify direct and downstream blockers.

**Acceptance criteria:**
- [ ] A failed prerequisite correctly prevents dependent course placement until prerequisite completion.
- [ ] UI lists impacted courses and displays the shortest explanatory prerequisite path(s).
- [ ] For a course with no blockers, display “No verified blockers found,” not “Guaranteed eligible.”
- [ ] Dependency findings have unit tests for chains, branches and co-requisite handling (if supported).

### SIM-01 — Recovery scenario editor (P0)

**Requirement:** Let a student define a setback and select planning horizon, offering assumptions and objective.

**Acceptance criteria:**
- [ ] Changing setback or inputs regenerates output; stale plans are not displayed as current.
- [ ] Each scenario has a unique identifier and immutable rule/version reference.
- [ ] UI distinguishes hypothetical versus verified institutional data.

### OPT-01 — Feasible scenario generation (P0)

**Requirement:** Solve subject to hard academic constraints and selected student preferences.

**Hard constraints (where verified and modeled):**
- Prerequisites satisfied in a **prior term** (unless documented co-requisite exception).
- Each required course completed at most once toward requirements (retakes modeled explicitly).
- Semester credit cap and any minimum/maximum selected by user.
- Valid semester/course offerings; unknown offerings must be treated as conditional scenario assumptions.
- Mandatory course coverage within specified planning horizon for graduation-oriented views.

**Optimization objectives:** generate non-identical feasible options emphasizing earliest completion and balanced SKS load; tie-breaking must be documented. No automatic equivalence between “lower workload” and “better mental health”.

**Acceptance criteria:**
- [ ] Every generated plan revalidates against the same hard constraints server-side before display.
- [ ] Each alternative includes objective, term-by-term courses, SKS total, and explicit assumptions.
- [ ] Known infeasible fixtures return informative infeasibility (not fabricated results).
- [ ] Deterministic seeded fixtures produce reproducible plans under fixed solver settings.
- [ ] If only one feasible path exists, show one; do not pretend two alternatives exist.

### CMP-01 — Decision comparison (P0)

**Requirement:** Show side-by-side outputs and consequences.

**Acceptance criteria:**
- [ ] Comparison contains earliest planned completion term (conditional), per-term SKS, number of courses affected, and assumption/rule badges.
- [ ] At least one visibly distinct trade-off is available in a **designed feasible synthetic demo fixture**.
- [ ] Uncertain outcomes and unknown future course offerings are clearly labelled.

### EXP-01 — Explainable recommendations (P0)

**Requirement:** Explain constraints without treating LLM content as academic authority.

**Acceptance criteria:**
- [ ] “Why unavailable?” names the specific prerequisite or rule and source/version.
- [ ] “Why recommended?” identifies objective and binding constraints or assumptions.
- [ ] Hard infeasibility and soft preference trade-offs are distinguishable.
- [ ] No unexplained confidence percentages or pseudo-predictions.

### PAS-01 — Academic Decision Passport (P0)

**Requirement:** Produce a structured export for advisor discussion.

**Acceptance criteria:**
- [ ] Includes profile alias (no personal identifiers required), curriculum version, generated date, scenario trigger, selected alternatives, trade-offs, assumptions, unanswered advisor questions and disclaimer.
- [ ] Export matches currently selected scenario; generated filename is safe and stable.
- [ ] Does not assert university/advisor approval.

### SEC-01 — Privacy and security (P0)

**Acceptance criteria:**
- [ ] Default public demo contains **synthetic data only**.
- [ ] No sensitive records, API keys or passwords are stored in Git or browser logs.
- [ ] Validate user input, avoid leaking other users’ plan data, configure safe deployment secrets.
- [ ] Provide a clear description of data handling and a way to clear locally saved session information where used.

### DEMO-01 — Competition deliverability (P0)

**Acceptance criteria:**
- [ ] A judge can reproduce FLOW-B with supplied seed data and instructions.
- [ ] Responsive UI supports laptop screen; empty/error/loading states are implemented.
- [ ] README includes setup, supported environment, demo steps, known limitations, sources and material AI assistance.
- [ ] Evidence of meaningful Final Day development changes can be shown via commits, starting/final versions and changelog.
- [ ] Web deployment is reachable or local setup is reliable, as required by handbook.

## 7. Initial information architecture

- `/` — Landing / product explanation.
- `/demo` — Select synthetic student and curriculum.
- `/dashboard` — Graduation requirements, progress and bottlenecks.
- `/scenario/new` — Define recovery event and constraints.
- `/scenario/:id/results` — Feasible plans, side-by-side trade-offs, explanation drawer.
- `/scenario/:id/passport` — Decision Passport preview/export.
- `/methodology` — Rules, dataset provenance, limitations, privacy notes.

**Layout concept:** restrained black/white/neutral UI, accessible semantic typography, visually clear warning/assumption labels that do not rely solely on color.

## 8. Proposed technical architecture

```text
SvelteKit / Next.js UI
    | HTTPS / JSON
FastAPI API
    |-- Profile + Curriculum Validation (Pydantic)
    |-- Curriculum Graph / Prerequisite Analyzer
    |-- Scenario Service
    |-- Solver Adapter (OR-Tools CP-SAT)
    |-- Explanation Builder (rule trace)
    |-- Decision Passport Export
    +-- PostgreSQL (optional for local MVP: SQLite or JSON fixtures)

Versioned curriculum fixtures + synthetic test students
```

**Important:** This is a *proposed architecture*, not implemented infrastructure. No paid cloud or LLM is required.

### 8.1 Core data entities

| Entity | Essential fields |
|---|---|
| `Curriculum` | `id`, `program`, `version`, `effective_year`, `status`, `source_url` |
| `Course` | `code`, `name`, `credits`, `type`, `curriculum_id` |
| `Requirement` | `id`, `curriculum_id`, `rule_type`, `parameters`, `source`, `verified` |
| `CourseDependency` | `course_code`, `requires_code`, `kind`, `source` |
| `CourseOffering` | `course_code`, `term_pattern`, `verified`, `source` |
| `StudentProfile` | `id_or_alias`, `curriculum_id`, `current_term`, `course_attempts` |
| `CourseAttempt` | `code`, `term`, `status`, `grade_optional` |
| `Scenario` | `id`, `profile_id`, `disruption`, `horizon`, `assumptions`, `objective`, `curriculum_version` |
| `Plan` | `scenario_id`, `terms`, `metrics`, `solver_status`, `rule_traces` |
| `DecisionPassport` | `scenario_id`, `selected_plan_ids`, `questions`, `generated_at` |

Protect profiles and session identifiers if future accounts are introduced. MVP may avoid collecting name, email or student number.

### 8.2 API draft (not finalized)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/curricula` | List supported versions and provenance |
| GET | `/api/v1/curricula/{id}` | Fetch courses, requirements, rules |
| POST | `/api/v1/profiles/validate` | Validate structured student course history |
| POST | `/api/v1/bottlenecks/analyze` | Return blockers + dependency traces |
| POST | `/api/v1/scenarios/solve` | Generate plans and feasibility explanation |
| POST | `/api/v1/scenarios/compare` | Compare selected plan IDs |
| POST | `/api/v1/passports/export` | Create export / printable output |

**Error contract:** `INVALID_CURRICULUM`, `INVALID_PROFILE`, `MISSING_RULE_SOURCE`, `NO_FEASIBLE_PLAN`, `SOLVER_TIMEOUT`, `INPUT_VALIDATION_ERROR`. Explain errors in clear user language and log machine-readable diagnostics without sensitive information.

### 8.3 Optimization pseudocode

```text
input = verified_curriculum + student_course_attempts + scenario_assumptions
validate(input)
create decision var x[course, term] in {0,1}
ensure required courses scheduled under model assumptions
ensure prerequisite completion before dependent term
ensure sum(credits * x[course, term]) <= allowed_credit_cap[term]
ensure course is offered in term OR visibly labeled hypothetical
apply any verified rules around repeats, equivalents and internships
solve objective A: minimize final completion term
solve objective B: improve load balance under feasibility constraints
revalidate each solver output using independent constraint checker
return plans + exact assumptions + rule explanation traces
```

**Limit:** Real curriculum exceptions can be complex. Unsupported equivalences, prerequisite waivers or graduation policies must be explicitly excluded, not approximated as universal truth.

## 9. Non-functional requirements

| ID | Area | Requirement / proposed quality gate |
|---|---|---|
| NFR-01 | Performance | Target normal demo solve under 5 seconds for seeded curriculum, machine dependent; timeout with graceful messaging |
| NFR-02 | Correctness | All curated critical validation fixtures pass; independent recheck of solver outputs |
| NFR-03 | Reliability | Seeded demo repeatable even without network data retrieval |
| NFR-04 | Accessibility | Keyboard navigation, labelled controls, clear focus states, readable contrast, explanatory text |
| NFR-05 | Transparency | Sources, curriculum version and scenario assumptions visible in UI and export |
| NFR-06 | Privacy | Synthetic-by-default demo, no required personal identity, minimized persistence |
| NFR-07 | Portability | Documented Docker/local environment and stable seed setup |
| NFR-08 | Maintainability | Modular constraints, unit tests, typed API contracts, conventional commits |
| NFR-09 | Robustness | Helpful empty, invalid, infeasible and timeout states |

Performance number is a **design target**, not a verified benchmark.

## 10. Test matrix

| ID | Scenario | Expected behavior | Priority |
|---|---|---|---|
| TC-01 | Standard valid profile | Summary and feasible options | P0 |
| TC-02 | Failed course blocking two downstream courses | Both blockers identified, paths explained | P0 |
| TC-03 | Schedule a dependent course before prerequisite | Plan rejected | P0 |
| TC-04 | Exceed verified maximum credits | Plan rejected or rebalanced | P0 |
| TC-05 | Missing course offering verification | Conditional label, no official availability claim | P0 |
| TC-06 | No feasible completion within planning horizon | Honest infeasible state + next actions | P0 |
| TC-07 | More than one feasible objective trade-off | Distinct valid alternatives, comparison | P0 |
| TC-08 | Unknown course code / malformed JSON | Validation error, no crash | P0 |
| TC-09 | Passport after scenario change | Export contains new scenario, not stale old data | P0 |
| TC-10 | Unsupported curriculum exception | Explicit unsupported or pending review indicator | P0 |
| TC-11 | Workload preference updated | Output re-optimized where implemented | P1 |
| TC-12 | Offline / unavailable server | Friendly failure and recoverable retry | P1 |

## 11. Product analytics & user research

**Do not instrument identifiable academic record details without consent.** For prototype usability sessions, collect aggregate observations in a separate approved research sheet.

- `task_completion_time_seconds` by test task.
- `hard_constraint_violations` in submitted plan.
- `task_success` yes/no, with predefined rubric.
- `explanation_comprehension_score` measured from 2–3 questions.
- `scenario_comparison_used` aggregate count.
- Qualitative feedback: confusion points, inaccurate assumptions, perceived usefulness.

**Experiment:** Compare manual worksheet planning with Avenra using matched tasks, counterbalanced order where practical. Report small-sample limitations, missing data and actual results only. No fabricated percentages.

## 12. Delivery roadmap (proposed; handbook dates fixed unless organizer updates)

| Period | Deliverable | Owner |
|---|---|---|
| By 5 Nov | Team registration; verified problem statement; project title | Team lead — TBD |
| By 10 Nov | 300–500-word English abstract PDF + complete twibbon evidence | Writer/researcher — TBD |
| By 18 Nov | Early interview notes, curriculum test fixture, UX flows | Research + engineering — TBD |
| By 30 Nov | English semifinal proposal (≤10 content pages), ≤2-minute team video, signed original-work declaration | Whole team |
| 1–7 Dec | P0 feasibility engine, UI and technical testing | Engineering — TBD |
| 7–16 Dec | Starting prototype; user tests; define 2–3 substantive Final Day tasks | Whole team |
| 16 Dec | Finish planned Final Day features, record commits, deploy/demo, submit deck and pitch | Whole team |

Dates above are planning checkpoints, not claims of completion. Registration fee for semifinal and final logistics must be confirmed from organizer updates.

## 13. Competition demonstration script (suggested)

**Problem (45 sec):** Failed prerequisite changes future enrollment; existing information doesn't explain viable next steps.

**Input (45 sec):** Load synthetic student, show approved rules and course graph.

**Analysis (90 sec):** Trigger failure; show downstream affected courses and source-linked constraint.

**Recovery (120 sec):** Generate valid alternatives, compare “earlier finish” vs “balanced workload”.

**Explain and act (90 sec):** Show reasons, uncertain assumptions; export Decision Passport.

**Validation & limits (60 sec):** Show tested scenarios, actual results if available, unsupported rules, and Final Day implemented changes.

This is a modular outline; keep the official final session within the handbook's **proposed 10-minute presentation/live demo and 10-minute Q&A** and committee updates.

## 14. Definition of done / release gate

- [ ] One verified curriculum and a labeled synthetic data fixture are loaded.
- [ ] FLOW-B works from fresh start through passport export.
- [ ] Constraint validation passes the critical test suite.
- [ ] Every plan displays rule sources, version and assumptions.
- [ ] Infeasibility is explained honestly.
- [ ] No misleading claims about institutional approval, user research or AI accuracy.
- [ ] Usability test completed with real participant observations; limitations written down.
- [ ] README: setup, demo credentials if applicable, deployment, known limitations, third-party credits and **material AI disclosure**.
- [ ] Team members can defend code and design choices; commits reflect actual contributions.
- [ ] Required competition paperwork and format requirements are checked separately.

## 15. Unresolved product decisions

- Supported university/program/curriculum version and rights to use underlying documents.
- Strategy for prerequisites with grades, concurrent courses, credits transfer and electives.
- Availability calendar: verified data or clear simulation-only assumptions.
- Optimization priority and objective weighting for comparable plans.
- Time spent implementing real advising workflow vs export-only passport.
- Whether database is necessary for MVP or seeded stateless service is enough.
- Team ownership, frontend choice (SvelteKit vs Next.js), research recruitment.

## 16. References and traceability

- `BRD_Avenra_STACK_2026.md` — primary business requirements and hypotheses.
- User-provided *Avenra STACK 2026 Proposal — Black Formal v2* — source concept and scope.
- User-provided *Handbook STACK 2026* — official challenge cases, deliverables, rules, timeline and judging; especially pp. 3–4, 6–9, 11–13, 16–17.
- Google OR-Tools CP: https://developers.google.com/optimization/cp (proposed technology, not a contest requirement).

**Traceability**: BR-01→CUR-01/PRO-01; BR-02→BOT-01/EXP-01; BR-03→SIM-01/OPT-01; BR-04→CMP-01; BR-05→PAS-01; BR-06→CUR-01/EXP-01; BR-07→SEC-01; BR-08→DEMO-01.

---
**Change log:** v0.1 — Full implementation-oriented PRD drafted 27 Oct 2026. All features remain proposed until verified in the repository.
