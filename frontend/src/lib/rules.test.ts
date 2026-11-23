import { describe, expect, it } from 'vitest';
import { goalHoursInTerm, termCap, timeBudgetCap } from './rules.js';
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
