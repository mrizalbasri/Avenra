# Business Requirements Document (BRD)
## AVENRA — Explainable Academic Decision & Recovery Support

| Metadata | Detail |
|---|---|
| Document ID | AVN-BRD-001 |
| Version | 0.1 — Concept / Draft |
| Date | 27 October 2026 |
| Competition | STACK 2026 — GDGoC ITB |
| Challenge | Case 1: **Smarter Campus and Learning** |
| Language | English (competition deliverables must be in English) |
| Business Owner / Product Owner | TBD — team to assign |
| Document status | Proposal-stage hypotheses; **not validated findings** |
| Source basis | User's Avenra proposal and *Handbook STACK 2026* |

> **Scope disclaimer:** This is a planning document, not an official institutional curriculum policy. All numerical baselines, user research, implementation progress, and outcomes must be collected or verified. Avenra supports, but does not replace, authorized academic advisors or university regulations.

## 1. Executive summary

Students planning degree completion often must reconcile prerequisites, maximum credits, course offerings, internships, academic setbacks, and personal commitments. Information may be scattered across handbooks, academic portals, spreadsheets, and advising discussions. Avenra is proposed as a **student-centered decision-support service** that connects (1) diagnosis of curriculum blockers, (2) generation of feasible recovery plans, (3) transparent trade-off comparison, and (4) preparation for advisor consultation.

The business outcome sought is not simply an attractive schedule. It is **fewer invalid plans, faster informed decisions, and better understanding of alternatives**. These are hypotheses to test, not established performance claims.

## 2. Opportunity and problem definition

### 2.1 Problems to validate

| ID | Candidate problem | Observable symptom | Validation method |
|---|---|---|---|
| PB-01 | Students cannot easily identify prerequisite chains | A delayed course unexpectedly blocks later courses | Interviews and curriculum-based planning tasks |
| PB-02 | Students lack practical recovery options | After failing/postponing a course, students cannot construct a valid revised plan | Scenario task with/without prototype |
| PB-03 | Trade-offs are difficult to compare | Students compare graduation speed and workload through guesswork | Think-aloud usability study |
| PB-04 | Advising preparation is fragmented | Students arrive without coherent alternatives or questions | Student/advisor feedback on consultation summary |
| PB-05 | Academic constraints may be misinterpreted | Proposed plans violate verified prerequisite or credit rules | Rule-compliance audit by knowledgeable reviewer |

**Research requirement:** Conduct at least 8–12 exploratory student interviews (recruit across different study stages where possible), and preferably 1–3 academic-advisor interviews. These numbers are **research targets, not achieved samples**. Do not present preliminary interview results until collected.

### 2.2 Primary use case

A student cannot pass a prerequisite course on schedule. Which remaining course sequences are permitted, what consequences follow for the next semesters, and what are practical alternatives that accommodate an internship? Avenra surfaces the blocking relationship, constructs valid alternatives, displays assumptions, and exports a concise consultation packet.

### 2.3 Existing alternatives and differentiation

- **SIS / KRS portal:** records and enrollment, possibly limited what-if reasoning; capabilities differ by university.
- **Degree audit / spreadsheet:** tracks remaining requirements, but may not support automated recovery scenarios.
- **Human advisor:** provides context and judgment; still the authority for interpreting ambiguous institutional rules.

**Proposed differentiation (to verify against real competitor products):** a single explainable **detect → recover → compare → consult** workflow, with explicit constraint provenance and conservative handling of uncertain rules. Do **not** claim this approach is globally novel without competitor research.

## 3. Business objectives and measures

| ID | Objective | Proposed metric | Evaluation method | Target status |
|---|---|---|---|---|
| BO-01 | Improve planning correctness | % of submitted plans satisfying verified hard constraints | Expert-reviewed test scenarios | Baseline and target TBD |
| BO-02 | Reduce planning effort | Median task completion time | Controlled task comparison | Baseline and target TBD |
| BO-03 | Improve understanding | Correct answers about why a plan is feasible/infeasible | Post-task comprehension questions | Baseline and target TBD |
| BO-04 | Improve recovery decision quality | % completing a disrupted-course recovery task | Usability study | Baseline and target TBD |
| BO-05 | Improve advising preparation | Advisor rating of decision packet usefulness | Short advisor evaluation | Target TBD |
| BO-06 | Preserve reliability | % of reproducible test scenarios that receive correct solver outputs | Automated regression suite | Engineering acceptance: 100% of curated critical cases |

**Competition success measures** are separate from product impact: complete eligible preliminary submission, credible semifinal evidence, and a demonstrably working final flow. No placement or winning probability can be guaranteed.

## 4. Stakeholders and personas

| Stakeholder | Need | Role / responsibility |
|---|---|---|
| Undergraduate student (primary) | Understand constraints and choose feasible next steps | Supplies information, evaluates alternatives; retains decision autonomy |
| Academic advisor (secondary) | Review assumptions and discuss viable options quickly | Reviews packet; confirms policy interpretation |
| Product team | Build and demonstrate reproducible core interaction | Implements, tests, documents provenance and limitations |
| Curriculum data maintainer (prototype) | Keep example curriculum rules accurate | Validates source documents, effective dates, rule versions |
| University administrators (future) | Govern integrations and institutional policies | Not an MVP dependency; no assumed partnerships |
| Competition judges | Verify actual functionality and team contributions | Independent assessment against competition rubric |

**Persona P1 — On-track planner:** wants semester planning with accurate prerequisites.

**Persona P2 — Recovery student:** failed or postponed a course and needs feasible alternatives (primary MVP persona).

**Persona P3 — Working/interning student:** wants constraints that reflect actual commitments, not a maximal-credit schedule.

## 5. Scope and boundaries

### 5.1 MVP in scope (must be operational)

1. One **explicitly selected, verified sample curriculum** with courses, credits, prerequisites, academic requirements, and known offering assumptions.
2. Student profile with manually entered academic progress; synthetic demo profiles.
3. Curriculum graph and **blocker detection** with rule/source reference.
4. Recovery scenario input: mark a prerequisite course as failed or postponed, then recompute.
5. Feasible semester plan generation with a deterministic constraint engine.
6. Side-by-side comparison of **at least two feasible scenarios** where such scenarios exist; explain when none exist.
7. Explanations of constraint violations, assumptions, and limitation labels.
8. **Academic Decision Passport** export as PDF or print-ready document for consultation.
9. Test cases, readable setup/README, demonstration account/data, and deployed web version or reliable local setup.

### 5.2 Conditional / post-MVP

- Workload balancing based on user-entered availability (clearly subjective, not health/risk diagnosis).
- Verified internship credit/conversion conditions.
- Advisor review interface (only after permissions and workflow validation).
- Course offering imports, integrations with SIS/KRS, notifications, additional campuses.
- Early warnings based on user-submitted progress, NOT unvalidated predictive labels.
- Historical-data ML only with lawful representative data, proper validation and bias assessment.

### 5.3 Explicitly out of scope

- Automatic university registration or approval.
- Issuing official graduation eligibility decisions.
- Predicting an individual student's mental health or diagnosing burnout.
- Claiming guaranteed graduation time or course availability.
- Processing real transcripts through OCR for MVP (structured manual entry is safer and more reliable).
- Unconsented handling of identifiable academic records.

## 6. Business requirements

| ID | Requirement | Priority | Success evidence |
|---|---|---|---|
| BR-01 | Students must see which curriculum requirements remain | Must | Profile and requirement summary |
| BR-02 | Students must understand **why** a proposed path is blocked | Must | Traceable prerequisite/credit/availability messages |
| BR-03 | Students must obtain alternative feasible recovery options | Must | Tested generated plans and failure case behavior |
| BR-04 | Students must compare meaningful planning trade-offs | Must | At least two distinct valid scenarios in curated demo |
| BR-05 | Students must be able to take results into advising | Must | Exportable Decision Passport |
| BR-06 | Unverified assumptions must be conspicuous | Must | Assumption labels, no implied official approval |
| BR-07 | The system must protect participant and demo data | Must | Privacy controls, no secrets in repository |
| BR-08 | The team must be able to demonstrate and explain full core flow | Must | Live demo and technical documentation |
| BR-09 | The product should accommodate internship and workload preferences | Should | Preference input and documented optimization effect |
| BR-10 | The system may support multiple institutions | Could | Extension design, not MVP commitment |

## 7. Policies, rules, and assumptions

- Only **validated** rules can be enforced as official hard constraints. Every rule should include a source, effective curriculum version, and reviewer status.
- Unknown course offerings must not be silently assumed available; provide an explicit user-selectable scenario assumption and label it as hypothetical.
- Course prerequisites must be completed **before** the semester where a dependent course is scheduled unless the curriculum explicitly permits co-requisites.
- Credit caps and required courses follow the selected curriculum and university policy, not universal defaults.
- Optimization targets are preferences, not guarantees; solver infeasibility is an acceptable, informative outcome.
- No mandatory Google technology or AI agent: STACK handbook describes them as optional.

## 8. Value hypothesis and validation plan

**Hypothesis H1:** Students using Avenra make fewer invalid plans than in manual planning.

**Hypothesis H2:** Users can better explain the effect of a failed prerequisite after seeing traceable explanations.

**Hypothesis H3:** Students can find an acceptable recovery pathway faster with guided what-if analysis.

**Study plan:** Obtain informed voluntary participation; define 3–5 curriculum-grounded tasks; randomize task ordering when practical; capture timings, violations, comprehension, completion, and qualitative comments. Use a small pilot to improve the tasks, report sample size and limitations, and do not generalize beyond the study population.

**Minimum recommended evidence package:** anonymized interview themes, documented curriculum source, a rule-validation checklist, test-case results, and a short demo showing one disrupted-course recovery journey.

## 9. Risks, dependencies, and mitigations

| Risk / dependency | Impact | Mitigation |
|---|---|---|
| Incorrect or incomplete curriculum rules | Potentially misleading plans | Explicit versioning, reviewer checklist, strict assumption labels |
| No access to real institutional data | Blocks realistic testing | Use authorized public rules and clearly labeled synthetic transcripts |
| Solver cannot find a feasible plan | Poor user trust if unexplained | Explain conflicting rules; allow preference changes; never fabricate a plan |
| Building too many features | Incomplete demo | Freeze core workflow; move extras post-MVP |
| Private information exposure | Security and ethical risk | Data minimization, synthetic examples, environment secret management |
| Weak evidence of user need | Lower competition scores | Interviews + measurable usability study before full polishing |
| Advisor does not approve a plan | Reputational harm | State decision-support-only role; require official verification |
| AI-generated advice contradicts rules | Unsafe recommendations | Solver is authoritative for modelled constraints; optional LLM only paraphrases verified output |

## 10. Competition alignment and milestones

**From STACK 2026 handbook (schedule may change):**

| Date (WIB) | Milestone | Output / condition |
|---|---|---|
| 20 Oct–5 Nov 2026 | Registration | 3–4 students, one original project, promotion requirements for each member |
| 10 Nov 2026 | Preliminary | English abstract 300–500 words in PDF + consolidated individual twibbon evidence |
| 18 Nov 2026 | Semifinal announcement | Continue only if selected; semifinal fee amount initially unspecified |
| 30 Nov 2026 | Semifinal submission | English proposal, max 10 **content** pages (cover/references/declaration excluded); video max 2 min |
| 7 Dec 2026 | Top 10 announcement | Confirm Final Day participation |
| 7–16 Dec 2026 | Product improvement | Working starting prototype, recorded remaining substantive tasks |
| 16 Dec 2026 | Final Day | Functional prototype, repository, setup/demo access, deck PDF max 15 content slides and technical pitch |

**Final Day may be in Bandung, with transport/accommodation at participant expense if confirmed.** Deadline is 23:59 WIB on stated dates. English required for submissions and pitching. AI use and original contribution must be disclosed and documented.

### 10.1 Judging alignment

| Round | High-weight judging factors | BRD implication |
|---|---|---|
| Preliminary | Problem clarity 30%; originality/value 25%; case fit 20% | Support a narrowly validated user problem and clear distinction |
| Semifinal | Problem understanding 25%; solution design 25%; technical feasibility 20%; execution/validation 20% | Evidence, technical plan and user testing are necessary |
| Final | Functionality/reliability 30%; problem fit 20%; technical quality 15% | Demonstrate reliable full workflow rather than a sprawling feature list |

## 11. Business acceptance / go-no-go

Proceed to a semifinal build only after: (1) obtaining and checking a representative curriculum, (2) evidence of at least one meaningful student problem, (3) testable MVP rules, (4) clear ownership of frontend/backend/validation/documentation, and (5) ability to build one end-to-end recovery flow. These are internal team gates, not formal committee gates.

## 12. Open questions

1. Which specific program, curriculum version, and academic rule sources are available and permitted?
2. Are course offerings known by semester or only hypothetical?
3. What support do advisor interviewees or academic reviewers agree to provide?
4. Which disruption scenario best reflects actual student pain?
5. What is the team composition, registration identity, and repository owner?
6. Can every team member attend a possible in-person final in Bandung?
7. What is the semifinal registration fee once announced?

## 13. Preliminary sources

- *Handbook STACK 2026*, GDGoC ITB (user-provided; challenge descriptions pp. 3–4, timeline p. 6, rules pp. 7–9, proposal p. 11, final deliverables pp. 12–13, judging pp. 16–17).
- *Avenra STACK 2026 Proposal — Black Formal v2* (user's prior working proposal; concept foundation).
- Mohamed, A. (2016), *Interactive decision support for academic advising*, **Quality Assurance in Education**, 24(3), 349–368, https://doi.org/10.1108/QAE-03-2013-0011 (preliminary reference; verify bibliographic details before submission).
- Shakhsi-Niaei et al. (2020), *An optimization-based decision support system for students' personalized long-term course planning*, **Computer Applications in Engineering Education**, https://doi.org/10.1002/cae.22299 (preliminary reference; verify bibliographic details before submission).
- Google OR-Tools: https://developers.google.com/optimization/cp

---
**Change log:** v0.1 (27 Oct 2026) — Initial BRD to guide research, scope and evaluation; no fabricated progress or results.
