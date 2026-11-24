import { describe, expect, it } from 'vitest';
import {
  draftCourseIssues,
  goalHoursInTerm,
  termCap,
  timeBudgetCap,
} from './rules.js';
import type { Curriculum, Goal } from './types.js';

const curriculum: Curriculum = {
  id: 'demo',
  name: 'Demo',
  version: '2026',
  status: 'synthetic',
  disclaimer: 'Demo',
  source: 'Demo',
  credit_cap: 24,
  graduation_credits: 144,
  max_terms: 14,
  target_terms: 8,
  gpa_credit_rules: [
    { min_gpa: 3.0, max_credits: 24 },
    { min_gpa: 0.0, max_credits: 15 },
  ],
  courses: [],
};

const goals: Goal[] = [
  {
    id: 'intern',
    title: 'Internship',
    kind: 'internship',
    start_term: 6,
    end_term: 6,
    weekly_hours: 20,
  },
  {
    id: 'bem',
    title: 'BEM',
    kind: 'organisation',
    start_term: 5,
    end_term: 6,
    weekly_hours: 10,
  },
];

describe('weekly time budget caps', () => {
  it('sums active goals per term', () => {
    expect(goalHoursInTerm(goals, 4)).toBe(0);
    expect(goalHoursInTerm(goals, 5)).toBe(10);
    expect(goalHoursInTerm(goals, 6)).toBe(30);
    expect(goalHoursInTerm(goals, 7)).toBe(0);
  });

  it('computes floor((available - active) * 60 / minutes_per_credit) clamped at 0', () => {
    const budget = { available_hours: 45, minutes_per_credit: 170 };
    expect(timeBudgetCap(null, goals, 6)).toBeNull();
    expect(timeBudgetCap(budget, goals, 4)).toBe(15);
    expect(timeBudgetCap(budget, goals, 5)).toBe(12);
    expect(timeBudgetCap(budget, goals, 6)).toBe(5);
    expect(
      timeBudgetCap({ available_hours: 20, minutes_per_credit: 170 }, goals, 6),
    ).toBe(0);
  });

  it('combines IPS, curriculum, plan, and time budget caps', () => {
    const budget = { available_hours: 45, minutes_per_credit: 170 };
    expect(termCap(curriculum, 6, 3, 24, 3.5, budget, goals)).toBe(5);
    expect(termCap(curriculum, 3, 3, 24, 1.5, budget, goals)).toBe(15);
    expect(termCap(curriculum, 4, 3, 10, 3.5, budget, goals)).toBe(10);
    expect(termCap(curriculum, 6, 3, 24, 3.5, null, goals)).toBe(24);
  });
});

describe('draftCourseIssues', () => {
  const sampleCurriculum: Curriculum = {
    ...curriculum,
    courses: [
      {
        code: 'IF101',
        name: 'Intro',
        credits: 3,
        recommended_term: 1,
        prerequisites: [],
        any_prerequisites: [],
        corequisites: [],
        min_credits_earned: 0,
        offered_terms: [1],
        category: 'required',
      },
      {
        code: 'IF201',
        name: 'Data Structures',
        credits: 3,
        recommended_term: 2,
        prerequisites: ['IF101'],
        any_prerequisites: [],
        corequisites: [],
        min_credits_earned: 0,
        offered_terms: [0],
        category: 'required',
      },
    ],
  };

  it('flags prerequisite order and odd/even offering issues on unsaved drafts', () => {
    const clean = draftCourseIssues(
      sampleCurriculum,
      ['IF101'],
      2,
      { IF201: 2 },
      [],
      8,
    );
    expect(clean.size).toBe(0);

    const wrongParity = draftCourseIssues(
      sampleCurriculum,
      ['IF101'],
      2,
      { IF201: 3 },
      [],
      8,
    );
    expect(wrongParity.has('IF201')).toBe(true);

    const prereqConflict = draftCourseIssues(
      sampleCurriculum,
      [],
      1,
      { IF101: 3, IF201: 2 },
      [],
      8,
    );
    expect(prereqConflict.has('IF201')).toBe(true);

    const outOfRangePrereq = draftCourseIssues(
      sampleCurriculum,
      [],
      2,
      { IF101: 1, IF201: 2 },
      [],
      8,
    );
    expect(outOfRangePrereq.has('IF101')).toBe(true);
    expect(outOfRangePrereq.has('IF201')).toBe(true);
  });

  it('flags min_credits_earned, any_prerequisites, and corequisites', () => {
    const rich: Curriculum = {
      ...curriculum,
      courses: [
        {
          code: 'IF101',
          name: 'Intro',
          credits: 4,
          recommended_term: 1,
          prerequisites: [],
          any_prerequisites: [],
          corequisites: [],
          min_credits_earned: 0,
          offered_terms: [0, 1],
          category: 'required',
        },
        {
          code: 'IF102',
          name: 'Lab',
          credits: 2,
          recommended_term: 1,
          prerequisites: [],
          any_prerequisites: [],
          corequisites: ['IF101'],
          min_credits_earned: 0,
          offered_terms: [0, 1],
          category: 'required',
        },
        {
          code: 'IF301',
          name: 'Capstone',
          credits: 4,
          recommended_term: 3,
          prerequisites: [],
          any_prerequisites: [['IF101', 'IF102']],
          corequisites: [],
          min_credits_earned: 6,
          offered_terms: [0, 1],
          category: 'required',
        },
      ],
    };

    const issues = draftCourseIssues(
      rich,
      [],
      1,
      { IF101: 2, IF102: 1, IF301: 2 },
      [],
      8,
    );
    // IF102 coreq IF101 is in term 2 > 1; IF301 needs 6 earned credits before term 2 (only 2 earned).
    expect(issues.has('IF102')).toBe(true);
    expect(issues.has('IF301')).toBe(true);

    const ok = draftCourseIssues(
      rich,
      [],
      1,
      { IF101: 1, IF102: 1, IF301: 2 },
      [],
      8,
    );
    expect(ok.size).toBe(0);
  });
});
