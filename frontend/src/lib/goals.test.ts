import { describe, expect, it } from 'vitest';
import {
  buildGoalsPayload,
  buildTimeBudget,
  checkGoalsAndBudget,
  formatHours,
  previewCapWithoutGoals,
  semesterHours,
} from './goals.js';
import type { Goal } from './types.js';

describe('goals and time budget helpers', () => {
  it('computes weekly course + goal hours and detects overload', () => {
    const goals: Goal[] = [
      {
        id: 'intern',
        title: 'Internship',
        kind: 'internship',
        start_term: 6,
        end_term: 6,
        weekly_hours: 20,
      },
    ];
    const budget = { available_hours: 45, minutes_per_credit: 170 };
    const overloaded = semesterHours(12, goals, 6, budget);
    // 12 * 170 / 60 = 34 h + 20 h = 54 h > 45 h
    expect(overloaded.courseHours).toBe(34);
    expect(overloaded.goalHours).toBe(20);
    expect(overloaded.totalHours).toBe(54);
    expect(overloaded.over).toBe(true);
    expect(formatHours(overloaded.totalHours)).toBe('54');

    const ok = semesterHours(12, goals, 5, budget);
    expect(ok.goalHours).toBe(0);
    expect(ok.totalHours).toBe(34);
    expect(ok.over).toBe(false);
  });

  it('validates budget limits and goal term ranges', () => {
    expect(
      checkGoalsAndBudget(
        45,
        170,
        [
          {
            title: 'Internship',
            kind: 'internship',
            start_term: 6,
            end_term: 6,
            weekly_hours: 20,
          },
        ],
        8,
      ),
    ).toEqual([]);

    const issues = checkGoalsAndBudget(
      200,
      50,
      [
        {
          title: '',
          kind: 'work',
          start_term: 7,
          end_term: 6,
          weekly_hours: -1,
        },
      ],
      8,
    );
    expect(issues.map((item) => item.code)).toEqual([
      'BUDGET_HOURS',
      'BUDGET_MINUTES',
      'GOAL_TITLE',
      'GOAL_ORDER',
      'GOAL_HOURS',
    ]);
  });

  it('previews cap and builds clean payloads', () => {
    expect(previewCapWithoutGoals(45, 170)).toBe(15);
    expect(previewCapWithoutGoals(null, 170)).toBeNull();
    expect(buildTimeBudget(null, 170)).toBeNull();
    expect(buildTimeBudget(45, 150)).toEqual({
      available_hours: 45,
      minutes_per_credit: 150,
    });
    expect(
      buildGoalsPayload([
        {
          id: 'g1',
          title: '  BEM  ',
          kind: 'organisation',
          start_term: 3,
          end_term: 4,
          weekly_hours: 8,
        },
      ]),
    ).toEqual([
      {
        id: 'g1',
        title: 'BEM',
        kind: 'organisation',
        start_term: 3,
        end_term: 4,
        weekly_hours: 8,
      },
    ]);
  });
});
