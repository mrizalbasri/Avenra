export type Course = {
  code: string;
  name: string;
  credits: number;
  recommended_term: number;
  category: 'required' | 'elective';
  prerequisites: string[];
  any_prerequisites: string[][];
  corequisites: string[];
  min_credits_earned: number;
  offered_terms: number[];
};
export type GpaCreditRule = { min_gpa: number; max_credits: number };
export type Curriculum = {
  id: string;
  name: string;
  version: string;
  status: string;
  disclaimer: string;
  source: string;
  credit_cap: number;
  graduation_credits: number | null;
  max_terms: number;
  target_terms: number;
  gpa_credit_rules: GpaCreditRule[];
  courses: Course[];
};
export type Profile = {
  id: string;
  alias: string;
  current_term: number;
  completed: string[];
  last_gpa: number | null;
  revision: number;
  mission: string | null;
  goals: Goal[];
  time_budget: TimeBudget | null;
};
export type Goal = {
  id: string;
  title: string;
  kind: 'internship' | 'work' | 'organisation' | 'graduation' | 'other';
  start_term: number;
  end_term: number;
  weekly_hours: number;
};
export type TimeBudget = {
  available_hours: number;
  minutes_per_credit: number;
};
type Params = Record<string, unknown>;
export type CodedMessage = { code: string; params: Params; message: string };
export type Finding = {
  course: string | null;
  rule: string;
  code: string;
  params: Params;
  message: string;
  related: string | null;
};
export type Validation = {
  status: string;
  findings: Finding[];
  loads: Record<string, number>;
  caps: Record<string, number>;
  cap_reasons: Record<string, string>;
  cap_details: Record<string, { code: string; params: Params }>;
  completed_credits: number;
  planned_credits: number;
  graduation_credits: number;
  remaining_credits: number;
  completion_term: number | null;
  peak_credits: number;
  planning_gpa: number | null;
  curriculum_version: string;
  plan_revision: number;
  profile_revision: number;
  assumptions: string[];
  assumption_items: CodedMessage[];
  advisor_questions: string[];
  advisor_items: CodedMessage[];
};
export type Plan = {
  id: string;
  profile_id: string;
  name: string;
  assignments: Record<string, number | null>;
  layout: Record<string, { x: number; y: number; term: number }>;
  failed: string[];
  pinned: string[];
  credit_cap: number;
  horizon: number;
  expected_gpa: number | null;
  revision: number;
  archived: boolean;
  is_primary: boolean;
  created_at: string;
  validation: Validation;
  bottlenecks: { root: string; course: string; path: string[] }[];
};
export type Workspace = {
  profile: Profile | null;
  plans: Plan[];
  curriculum: Curriculum;
};
export type Task = {
  id: string;
  // A task belongs to a course, a goal, or both.
  course_code: string | null;
  goal_id: string | null;
  title: string;
  due_date: string | null;
  start_date: string | null;
  first_step: string | null;
  details: string[];
  done: boolean;
  revision: number;
};
export type FocusSession = {
  id: string;
  course_code: string | null;
  goal_id: string | null;
  seconds: number;
  note: string;
  created_at: string;
};
export type Study = { tasks: Task[]; sessions: FocusSession[] };
export type Alternative = {
  name: string;
  name_code: string;
  summary_items: { code: string; params: Params }[];
  assignments: Record<string, number | null>;
  validation: Validation;
  optimal: boolean;
  summary: string;
  changes: {
    code: string;
    name: string;
    from: number | null;
    to: number | null;
  }[];
};
export type Diagnosis = {
  reasons: (CodedMessage & { rule: string })[];
  suggestions: (CodedMessage & {
    kind: 'horizon' | 'credit_cap' | 'goal_hours' | 'unpin';
    value: number;
  })[];
};
export type SolveResult = {
  status: string;
  code: string;
  params: Params;
  message: string;
  alternatives: Alternative[];
  diagnosis?: Diagnosis;
  source_revision: number;
  profile_revision: number;
};
export type CriticalCourse = {
  code: string;
  name: string;
  extra_semesters: number | null;
  finish_if_failed: number | null;
  late_if_failed: boolean;
};
export type Outlook = {
  status: 'on_track' | 'late' | 'unresolved' | 'unknown';
  target_term: number;
  completion_term: number | null;
  plan_term: number | null;
  earliest_term: number | null;
  basis: 'plan' | 'earliest';
  plan_findings: number;
  delay: number | null;
  critical: CriticalCourse[];
  timed_out: boolean;
};
