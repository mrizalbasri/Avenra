import { goalHoursInTerm, timeBudgetCap } from './rules.js';
import type { Goal, TimeBudget } from './types.js';

export const GOAL_KINDS = [
  'internship',
  'work',
  'organisation',
  'graduation',
  'other',
] as const;

export const MAX_GOALS = 3;
export const DEFAULT_MINUTES_PER_CREDIT = 170;

export type GoalDraft = {
  id?: string;
  title: string;
  kind: Goal['kind'];
  start_term: number | null;
  end_term: number | null;
  weekly_hours: number | null;
};

export type BudgetIssue = {
  code:
    | 'BUDGET_HOURS'
    | 'BUDGET_MINUTES'
    | 'GOAL_TITLE'
    | 'GOAL_TERM'
    | 'GOAL_ORDER'
    | 'GOAL_HOURS';
  params: Record<string, string | number>;
};

export function emptyGoal(term: number, maxTerms: number): GoalDraft {
  const clamped = Math.max(1, Math.min(maxTerms, term));
  return {
    title: '',
    kind: 'internship',
    start_term: clamped,
    end_term: clamped,
    weekly_hours: 10,
  };
}

export function goalToDraft(goal: Goal): GoalDraft {
  return {
    id: goal.id,
    title: goal.title,
    kind: goal.kind,
    start_term: goal.start_term,
    end_term: goal.end_term,
    weekly_hours: goal.weekly_hours,
  };
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function semesterHours(
  credits: number,
  goals: Goal[] | undefined,
  term: number,
  budget: TimeBudget,
) {
  const courseHours = (credits * budget.minutes_per_credit) / 60;
  const goalHours = goalHoursInTerm(goals, term);
  const totalHours = courseHours + goalHours;
  const availableHours = budget.available_hours;
  return {
    courseHours,
    goalHours,
    totalHours,
    availableHours,
    over: totalHours > availableHours + 1e-6,
  };
}

export function previewCapWithoutGoals(
  availableHours: number | null,
  minutesPerCredit: number | null,
) {
  if (
    availableHours === null ||
    !Number.isFinite(availableHours) ||
    availableHours < 0 ||
    availableHours > 168
  )
    return null;
  const mpc = minutesPerCredit ?? DEFAULT_MINUTES_PER_CREDIT;
  if (!Number.isInteger(mpc) || mpc < 60 || mpc > 300) return null;
  return timeBudgetCap(
    { available_hours: availableHours, minutes_per_credit: mpc },
    [],
    1,
  );
}

export function checkGoalsAndBudget(
  availableHours: number | null,
  minutesPerCredit: number | null,
  goals: GoalDraft[],
  maxTerms: number,
): BudgetIssue[] {
  const issues: BudgetIssue[] = [];
  if (availableHours !== null) {
    if (
      !Number.isFinite(availableHours) ||
      availableHours < 0 ||
      availableHours > 168
    ) {
      issues.push({ code: 'BUDGET_HOURS', params: {} });
    }
    const mpc = minutesPerCredit ?? DEFAULT_MINUTES_PER_CREDIT;
    if (!Number.isInteger(mpc) || mpc < 60 || mpc > 300) {
      issues.push({ code: 'BUDGET_MINUTES', params: {} });
    }
  }
  goals.forEach((goal, index) => {
    const n = index + 1;
    if (!goal.title.trim() || goal.title.trim().length > 80) {
      issues.push({ code: 'GOAL_TITLE', params: { n } });
    }
    const startOk =
      goal.start_term !== null &&
      Number.isInteger(goal.start_term) &&
      goal.start_term >= 1 &&
      goal.start_term <= maxTerms;
    const endOk =
      goal.end_term !== null &&
      Number.isInteger(goal.end_term) &&
      goal.end_term >= 1 &&
      goal.end_term <= maxTerms;
    if (!startOk || !endOk) {
      issues.push({ code: 'GOAL_TERM', params: { n, max: maxTerms } });
    } else if (goal.start_term! > goal.end_term!) {
      issues.push({ code: 'GOAL_ORDER', params: { n } });
    }
    if (
      goal.weekly_hours === null ||
      !Number.isFinite(goal.weekly_hours) ||
      goal.weekly_hours < 0 ||
      goal.weekly_hours > 168
    ) {
      issues.push({ code: 'GOAL_HOURS', params: { n } });
    }
  });
  return issues;
}

export function buildTimeBudget(
  availableHours: number | null,
  minutesPerCredit: number | null,
): TimeBudget | null {
  if (availableHours === null) return null;
  return {
    available_hours: availableHours,
    minutes_per_credit: minutesPerCredit ?? DEFAULT_MINUTES_PER_CREDIT,
  };
}

export function buildGoalsPayload(goals: GoalDraft[]) {
  return goals.map((goal) => ({
    ...(goal.id ? { id: goal.id } : {}),
    title: goal.title.trim(),
    kind: goal.kind,
    start_term: goal.start_term!,
    end_term: goal.end_term!,
    weekly_hours: goal.weekly_hours!,
  }));
}
