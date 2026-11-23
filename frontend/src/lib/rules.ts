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
