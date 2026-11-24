import type { Translate } from '#lib/i18n/index.js';
import type { Course, Curriculum, Goal, TimeBudget } from '#lib/types.js';

// Display helpers for unsaved drafts. The backend checker stays authoritative;
// these mirror backend/app/rules.py so the editor shows the same limits.

export function goalHoursInTerm(goals: Goal[] | undefined, term: number) {
  return (goals ?? [])
    .filter((goal) => goal.start_term <= term && term <= goal.end_term)
    .reduce((sum, goal) => sum + goal.weekly_hours, 0);
}

export function timeBudgetCap(
  budget: TimeBudget | null | undefined,
  goals: Goal[] | undefined,
  term: number,
) {
  if (!budget) return null;
  const remaining = Math.max(
    0,
    budget.available_hours - goalHoursInTerm(goals, term),
  );
  const minutes = Math.round(remaining * 60 * 1e6) / 1e6;
  return Math.floor(minutes / budget.minutes_per_credit);
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

export function termCap(
  curriculum: Curriculum,
  term: number,
  currentTerm: number,
  planCap: number,
  gpa: number | null,
  timeBudget?: TimeBudget | null,
  goals?: Goal[],
) {
  const fromGpa = term === currentTerm ? gpaCap(curriculum, gpa) : null;
  const fromBudget = timeBudgetCap(timeBudget, goals, term);
  return Math.min(
    planCap,
    curriculum.credit_cap,
    fromGpa ?? Infinity,
    fromBudget ?? Infinity,
  );
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
  const flagged = new Set<string>();
  const failedSet = new Set(failed);
  const doneSet = new Set(completed.filter((code) => !failedSet.has(code)));
  const maxTerm = Math.min(horizon, curriculum.max_terms);

  const termOf = (code: string): number | null => {
    if (doneSet.has(code)) return 0;
    const assigned = assignments[code];
    return typeof assigned === 'number' ? assigned : null;
  };

  for (const course of curriculum.courses) {
    if (doneSet.has(course.code)) continue;
    const term = assignments[course.code];
    if (typeof term !== 'number') {
      if (course.category === 'required') flagged.add(course.code);
      continue;
    }
    if (term < currentTerm || term > maxTerm) {
      flagged.add(course.code);
      continue;
    }
    if (
      failedSet.has(course.code) &&
      !completed.includes(course.code) &&
      term <= currentTerm
    ) {
      flagged.add(course.code);
      continue;
    }
    if (!course.offered_terms.includes(term % 2)) {
      flagged.add(course.code);
      continue;
    }
    for (const prereq of course.prerequisites) {
      const pt = termOf(prereq);
      if (pt === null || pt >= term) {
        flagged.add(course.code);
        break;
      }
    }
    if (flagged.has(course.code)) continue;
    for (const group of course.any_prerequisites ?? []) {
      const ok = group.some((opt) => {
        const pt = termOf(opt);
        return pt !== null && pt < term;
      });
      if (!ok) {
        flagged.add(course.code);
        break;
      }
    }
    if (flagged.has(course.code)) continue;
    for (const coreq of course.corequisites ?? []) {
      const ct = termOf(coreq);
      if (ct === null || ct > term) {
        flagged.add(course.code);
        break;
      }
    }
  }
  return flagged;
}
