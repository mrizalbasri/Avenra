import type { Translate } from '#lib/i18n/index.js';
import type {
  Course,
  Curriculum,
  Finding,
  Goal,
  Profile,
  TimeBudget,
} from '#lib/types.js';

// Display helpers for unsaved drafts. The backend checker stays authoritative;
// these mirror backend/app/rules.py so the editor shows the same limits.

export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  hidden: boolean;
  style: string;
};

export function buildCanvasEdges(
  remaining: Course[],
  selected: string,
): CanvasEdge[] {
  const remainingCodes = new Set(remaining.map((c) => c.code));
  const edges: CanvasEdge[] = [];
  const edgeStyles = {
    prereq: 'stroke: var(--edge); stroke-width: 1.5;',
    any: 'stroke: var(--edge); stroke-width: 1.35; stroke-dasharray: 5 4;',
    coreq: 'stroke: #a1a1aa; stroke-width: 1.35; stroke-dasharray: 2 3;',
  } as const;

  for (const course of remaining) {
    const seen = new Set<string>();
    const push = (source: string, kind: keyof typeof edgeStyles) => {
      if (!remainingCodes.has(source) || seen.has(source)) return;
      seen.add(source);
      edges.push({
        id: `${source}-${course.code}`,
        source,
        target: course.code,
        hidden: !!selected && selected !== course.code && selected !== source,
        style: edgeStyles[kind],
      });
    };
    for (const prereq of course.prerequisites) push(prereq, 'prereq');
    for (const group of course.any_prerequisites ?? []) {
      for (const option of group) push(option, 'any');
    }
    for (const coreq of course.corequisites ?? []) push(coreq, 'coreq');
  }
  return edges;
}

const cleanHours = (value: number) => Math.round(value * 100) / 100;

export function goalHoursInTerm(goals: Goal[] | undefined, term: number) {
  return (goals ?? [])
    .filter((goal) => goal.start_term <= term && term <= goal.end_term)
    .reduce((sum, goal) => sum + goal.weekly_hours, 0);
}

function budgetSnapshot(
  budget: TimeBudget | null | undefined,
  goals: Goal[] | undefined,
  term: number,
) {
  if (!budget) return null;
  const remaining = Math.max(
    0,
    Math.round((budget.available_hours - goalHoursInTerm(goals, term)) * 1e6) /
      1e6,
  );
  const minutes = Math.round(remaining * 60 * 1e6) / 1e6;
  return {
    cap: Math.floor(minutes / budget.minutes_per_credit),
    remaining,
    available: budget.available_hours,
    minutesPerCredit: budget.minutes_per_credit,
  };
}

export function timeBudgetCap(
  budget: TimeBudget | null | undefined,
  goals: Goal[] | undefined,
  term: number,
) {
  return budgetSnapshot(budget, goals, term)?.cap ?? null;
}

export function gpaCap(curriculum: Curriculum, gpa: number | null) {
  if (gpa === null || !curriculum.gpa_credit_rules?.length) return null;
  const eligible = curriculum.gpa_credit_rules
    .filter((rule) => gpa >= rule.min_gpa)
    .map((rule) => rule.max_credits);
  return eligible.length
    ? Math.max(...eligible)
    : Math.min(...curriculum.gpa_credit_rules.map((rule) => rule.max_credits));
}

export function termCapDetails(
  curriculum: Curriculum,
  term: number,
  currentTerm: number,
  planCap: number,
  gpa: number | null,
  timeBudget?: TimeBudget | null,
  goals?: Goal[],
): { cap: number; code: string; params: Record<string, unknown> } {
  const options: {
    cap: number;
    code: string;
    params: Record<string, unknown>;
  }[] = [];
  const fromGpa = term === currentTerm ? gpaCap(curriculum, gpa) : null;
  if (fromGpa !== null && gpa !== null) {
    options.push({ cap: fromGpa, code: 'IPS_RULE', params: { gpa } });
  }
  const budget = budgetSnapshot(timeBudget, goals, term);
  if (budget !== null) {
    options.push({
      cap: budget.cap,
      code: 'TIME_BUDGET',
      params: {
        hours: cleanHours(budget.remaining),
        available: cleanHours(budget.available),
        minutes_per_credit: budget.minutesPerCredit,
      },
    });
  }
  options.push(
    { cap: curriculum.credit_cap, code: 'CURRICULUM_MAX', params: {} },
    { cap: planCap, code: 'PLAN_LIMIT', params: {} },
  );
  let best = options[0];
  for (const option of options.slice(1)) {
    if (option.cap < best.cap) best = option;
  }
  return best;
}

export function termCap(
  curriculum: Curriculum,
  term: number,
  currentTerm: number,
  planCap: number,
  gpa: number | null,
  timeBudget?: TimeBudget | null,
  goals?: Goal[],
) {
  return termCapDetails(
    curriculum,
    term,
    currentTerm,
    planCap,
    gpa,
    timeBudget,
    goals,
  ).cap;
}

export function nextOffered(course: Course, term: number) {
  let next = term;
  while (!course.offered_terms.includes(next % 2)) next++;
  return next;
}

export function requirementText(course: Course, t: Translate) {
  const or = t('list.or');
  const parts = [];
  if (course.prerequisites.length)
    parts.push(
      t('req.prerequisites', { list: course.prerequisites.join(', ') }),
    );
  for (const group of course.any_prerequisites ?? [])
    parts.push(t('req.any_of', { list: group.join(or) }));
  if (course.corequisites?.length)
    parts.push(t('req.corequisites', { list: course.corequisites.join(', ') }));
  if (course.min_credits_earned)
    parts.push(t('req.min_credits', { count: course.min_credits_earned }));
  return parts.length ? parts : [t('req.none')];
}

export function offeringText(course: Course, t: Translate) {
  return course.offered_terms.length === 2
    ? t('offer.every')
    : course.offered_terms[0] === 1
      ? t('offer.odd')
      : t('offer.even');
}

export type DraftCheckInput = {
  assignments: Record<string, number | null>;
  failed: string[];
  credit_cap: number;
  horizon: number;
  expected_gpa: number | null;
};

type DraftProfile = Pick<
  Profile,
  'current_term' | 'completed' | 'last_gpa' | 'goals' | 'time_budget'
>;

/** Full client-side preview of rule findings while editing an unsaved draft. */
export function draftFindings(
  curriculum: Curriculum,
  profile: DraftProfile,
  draft: DraftCheckInput,
): { findings: Finding[]; completion_term: number | null } {
  const courses = new Map(curriculum.courses.map((c) => [c.code, c]));
  const failedSet = new Set(draft.failed);
  const doneSet = new Set(
    profile.completed.filter((code) => !failedSet.has(code)),
  );
  const end = Math.min(draft.horizon, curriculum.max_terms);
  const terms: number[] = [];
  for (let t = profile.current_term; t <= end; t++) terms.push(t);
  const gpa = draft.expected_gpa ?? profile.last_gpa ?? null;
  const caps = new Map(
    terms.map((t) => [
      t,
      termCapDetails(
        curriculum,
        t,
        profile.current_term,
        draft.credit_cap,
        gpa,
        profile.time_budget,
        profile.goals,
      ),
    ]),
  );
  const loads = new Map(terms.map((t) => [t, 0]));
  const scheduled = new Map<string, number>();
  const findings: Finding[] = [];

  const pushFinding = (
    course: string | null,
    rule: string,
    message: string,
    related: string | null = null,
    params: Record<string, unknown> = {},
  ) => {
    findings.push({
      course,
      rule,
      code: rule,
      message,
      related,
      params: course ? { course, ...params } : params,
    });
  };

  for (const course of curriculum.courses) {
    if (doneSet.has(course.code)) continue;
    const term = draft.assignments[course.code];
    if (typeof term !== 'number') {
      if (course.category === 'required') {
        pushFinding(
          course.code,
          'UNSCHEDULED',
          `${course.code} ${course.name} has not been scheduled.`,
          null,
          { name: course.name },
        );
      }
      continue;
    }
    if (!loads.has(term)) {
      if (term > curriculum.max_terms) {
        pushFinding(
          course.code,
          'STUDY_PERIOD',
          `${course.code} is placed in semester ${term}, beyond the maximum study period of ${curriculum.max_terms} semesters.`,
          null,
          { term, max_terms: curriculum.max_terms },
        );
      } else {
        pushFinding(
          course.code,
          'TERM_RANGE',
          `${course.code} must be between semesters ${profile.current_term} and ${end}.`,
          null,
          { start: profile.current_term, end },
        );
      }
      continue;
    }
    scheduled.set(course.code, term);
    loads.set(term, (loads.get(term) ?? 0) + course.credits);
    const earliest =
      failedSet.has(course.code) && !profile.completed.includes(course.code)
        ? profile.current_term + 1
        : profile.current_term;
    if (term < earliest) {
      pushFinding(
        course.code,
        'RETAKE',
        `${course.code} fails in semester ${profile.current_term} in this scenario, so it can be retaken from semester ${profile.current_term + 1}.`,
        null,
        { current: profile.current_term, next: profile.current_term + 1 },
      );
    }
  }

  const completedCredits = curriculum.courses
    .filter((c) => doneSet.has(c.code))
    .reduce((sum, c) => sum + c.credits, 0);

  const doneBefore = (code: string, term: number, sameTerm = false) => {
    if (doneSet.has(code)) return true;
    const placed = scheduled.get(code);
    return placed !== undefined && (sameTerm ? placed <= term : placed < term);
  };

  for (const [code, term] of scheduled.entries()) {
    const course = courses.get(code);
    if (!course) continue;
    if (!course.offered_terms.includes(term % 2)) {
      const parity = course.offered_terms.includes(1) ? 'odd' : 'even';
      pushFinding(
        code,
        'OFFERING',
        `${code} is offered only in ${parity} semesters, not semester ${term}.`,
        null,
        { parity, term },
      );
    }
    for (const prereq of course.prerequisites) {
      if (!doneBefore(prereq, term)) {
        pushFinding(
          code,
          'PREREQUISITE',
          `Complete ${prereq} before taking ${code}.`,
          prereq,
          { prerequisite: prereq },
        );
      }
    }
    for (const group of course.any_prerequisites ?? []) {
      if (!group.some((opt) => doneBefore(opt, term))) {
        pushFinding(
          code,
          'ANY_PREREQUISITE',
          `Complete one of ${group.join(' or ')} before taking ${code}.`,
          group[0],
          { options: [...group] },
        );
      }
    }
    for (const coreq of course.corequisites ?? []) {
      if (!doneBefore(coreq, term, true)) {
        pushFinding(
          code,
          'COREQUISITE',
          `Take ${coreq} in the same semester as ${code} or earlier.`,
          coreq,
          { corequisite: coreq },
        );
      }
    }
    if (course.min_credits_earned) {
      let earned = completedCredits;
      for (const [otherCode, placed] of scheduled.entries()) {
        if (placed < term) earned += courses.get(otherCode)?.credits ?? 0;
      }
      if (earned < course.min_credits_earned) {
        pushFinding(
          code,
          'CREDITS_EARNED',
          `${code} needs ${course.min_credits_earned} earned credits before semester ${term}; this plan reaches ${earned}.`,
          null,
          { required: course.min_credits_earned, term, earned },
        );
      }
    }
  }

  let plannedCredits = 0;
  for (const [term, credits] of loads.entries()) {
    plannedCredits += credits;
    const limit = caps.get(term);
    if (limit && credits > limit.cap) {
      pushFinding(
        null,
        'CREDIT_CAP',
        `Semester ${term} has ${credits} credits; the limit is ${limit.cap}.`,
        null,
        {
          term,
          credits,
          cap: limit.cap,
          reason: limit.code,
          ...limit.params,
        },
      );
    }
  }

  const target =
    curriculum.graduation_credits ??
    curriculum.courses.reduce((sum, c) => sum + c.credits, 0);
  if (
    curriculum.graduation_credits &&
    completedCredits + plannedCredits < target
  ) {
    const missing = target - completedCredits - plannedCredits;
    pushFinding(
      null,
      'GRADUATION_CREDITS',
      `This plan reaches ${completedCredits + plannedCredits} of ${target} graduation credits. Add ${missing} more credits, for example from electives.`,
      null,
      { reached: completedCredits + plannedCredits, target, missing },
    );
  }

  return {
    findings,
    completion_term: findings.length
      ? null
      : Math.max(...scheduled.values(), profile.current_term - 1),
  };
}

/**
 * Lightweight client-side preview of course-level issues while editing an unsaved draft.
 * Keeps visual feedback on canvas cards before the authoritative backend validation runs.
 */
export function draftCourseIssues(
  curriculum: Curriculum,
  completed: string[],
  currentTerm: number,
  assignments: Record<string, number | null>,
  failed: string[],
  horizon: number,
): Set<string> {
  const result = draftFindings(
    curriculum,
    {
      current_term: currentTerm,
      completed,
      last_gpa: null,
      goals: [],
      time_budget: null,
    },
    {
      assignments,
      failed,
      credit_cap: curriculum.credit_cap,
      horizon,
      expected_gpa: null,
    },
  );
  return new Set(
    result.findings
      .map((f) => f.course)
      .filter((code): code is string => code !== null),
  );
}
