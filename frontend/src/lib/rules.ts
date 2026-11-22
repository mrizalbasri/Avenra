import type { Course, Curriculum } from '#lib/types.js';

// Display helpers for unsaved drafts. The backend checker stays authoritative;
// these mirror backend/app/rules.py so the editor shows the same limits.

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
) {
  const fromGpa = term === currentTerm ? gpaCap(curriculum, gpa) : null;
  return Math.min(planCap, curriculum.credit_cap, fromGpa ?? Infinity);
}

export function nextOffered(course: Course, term: number) {
  let next = term;
  while (!course.offered_terms.includes(next % 2)) next++;
  return next;
}

export function requirementText(course: Course) {
  const parts = [];
  if (course.prerequisites.length)
    parts.push(`Prerequisites: ${course.prerequisites.join(', ')}`);
  for (const group of course.any_prerequisites ?? [])
    parts.push(`One of: ${group.join(' or ')}`);
  if (course.corequisites?.length)
    parts.push(`Same semester or earlier: ${course.corequisites.join(', ')}`);
  if (course.min_credits_earned)
    parts.push(`Needs ${course.min_credits_earned} earned credits first`);
  return parts.length ? parts : ['No prerequisites'];
}

export function offeringText(course: Course) {
  return course.offered_terms.length === 2
    ? 'Every semester'
    : course.offered_terms[0] === 1
      ? 'Odd semesters only'
      : 'Even semesters only';
}
