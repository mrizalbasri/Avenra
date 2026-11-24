import { describe, expect, it } from 'vitest';
import { translate } from './i18n/index.js';
import { createMessages } from './i18n/messages.js';
import { buildAdvisorSummary } from './passport.js';
import type { Curriculum, Plan, Profile } from './types.js';

const curriculum: Curriculum = {
  id: 'demo',
  name: 'Example S1 Informatika',
  version: '2026',
  status: 'synthetic',
  disclaimer:
    'Demonstration assumptions only. Not an official university curriculum or graduation decision.',
  source: 'Synthetic fixture',
  credit_cap: 24,
  graduation_credits: 6,
  max_terms: 14,
  target_terms: 8,
  gpa_credit_rules: [],
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
      offered_terms: [0, 1],
      category: 'required',
    },
    {
      code: 'IF201',
      name: 'Algorithms',
      credits: 3,
      recommended_term: 2,
      prerequisites: ['IF101'],
      any_prerequisites: [],
      corequisites: [],
      min_credits_earned: 0,
      offered_terms: [0, 1],
      category: 'required',
    },
  ],
};

const profile: Profile = {
  id: 'ws-1',
  alias: 'Nadia',
  current_term: 2,
  completed: ['IF101'],
  last_gpa: 3.4,
  revision: 2,
  mission: 'Graduate on time with an internship.',
  time_budget: { available_hours: 40, minutes_per_credit: 170 },
  goals: [
    {
      id: 'g-1',
      title: 'BEM',
      kind: 'organisation',
      start_term: 2,
      end_term: 3,
      weekly_hours: 8,
    },
  ],
};

const plan: Plan = {
  id: 'plan-1',
  profile_id: 'ws-1',
  name: 'Recovery plan',
  assignments: { IF201: 2 },
  layout: {},
  failed: [],
  credit_cap: 20,
  horizon: 8,
  expected_gpa: null,
  revision: 3,
  archived: false,
  created_at: '2026-11-24T00:00:00Z',
  bottlenecks: [],
  validation: {
    status: 'valid',
    findings: [],
    loads: { '2': 3 },
    caps: { '2': 11 },
    cap_reasons: { '2': 'your weekly time budget (32 h left for courses)' },
    cap_details: {
      '2': { code: 'TIME_BUDGET', params: { hours: 32 } },
    },
    completed_credits: 3,
    planned_credits: 3,
    remaining_credits: 3,
    graduation_credits: 6,
    peak_credits: 3,
    completion_term: 2,
    planning_gpa: 3.4,
    curriculum_version: '2026',
    plan_revision: 3,
    profile_revision: 2,
    assumptions: [],
    assumption_items: [],
    advisor_questions: [],
    advisor_items: [
      {
        code: 'ACCURACY',
        message: 'Are the prerequisites accurate?',
        params: {},
      },
    ],
  },
};

describe('buildAdvisorSummary', () => {
  it('includes mission, goals, weekly hours, courses, questions, and disclaimer', () => {
    const t = (
      key: Parameters<typeof translate>[1],
      params?: Parameters<typeof translate>[2],
    ) => translate('en', key, params);
    const msg = createMessages(() => 'en');
    const summary = buildAdvisorSummary(plan, profile, curriculum, t, msg);

    expect(summary).toContain('Academic Decision Passport | Recovery plan');
    expect(summary).toContain('Plan version 3 | Profile version 2');
    expect(summary).toContain('Graduate on time with an internship.');
    expect(summary).toContain('BEM (Organisation | Semesters 2-3 | 8 h/week)');
    expect(summary).toContain('IF201 Algorithms');
    expect(summary).toContain('3 / 11 cr | 16.5 / 40 h');
    expect(summary).toContain(
      '1. Are the prerequisites and offerings used here accurate',
    );
    expect(summary).toContain('Demonstration assumptions only.');
  });

  it('localizes units, overload marker, and bottlenecks in Indonesian', () => {
    const t = (
      key: Parameters<typeof translate>[1],
      params?: Parameters<typeof translate>[2],
    ) => translate('id', key, params);
    const msg = createMessages(() => 'id');
    const tightProfile: Profile = {
      ...profile,
      time_budget: { available_hours: 10, minutes_per_credit: 170 },
    };
    const blockedPlan: Plan = {
      ...plan,
      bottlenecks: [
        { root: 'IF101', course: 'IF201', path: ['IF101', 'IF201'] },
      ],
    };
    const summary = buildAdvisorSummary(
      blockedPlan,
      tightProfile,
      curriculum,
      t,
      msg,
    );

    expect(summary).toContain('BEM (Organisasi | Semester 2-3 | 8 jam/minggu)');
    expect(summary).toContain('3 / 11 SKS | 16.5 / 10 jam (lebih)');
    expect(summary).toContain('Mata kuliah yang terdampak kemunduran:');
    expect(summary).toContain('- IF101 → IF201');
  });
});
