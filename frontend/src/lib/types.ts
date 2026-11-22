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
};
export type Finding = {
  course: string | null;
  rule: string;
  message: string;
  related: string | null;
};
export type Validation = {
  status: string;
  findings: Finding[];
  loads: Record<string, number>;
  caps: Record<string, number>;
  cap_reasons: Record<string, string>;
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
  advisor_questions: string[];
};
export type Plan = {
  id: string;
  profile_id: string;
  name: string;
  assignments: Record<string, number | null>;
  layout: Record<string, { x: number; y: number; term: number }>;
  failed: string[];
  credit_cap: number;
  horizon: number;
  expected_gpa: number | null;
  revision: number;
  archived: boolean;
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
  course_code: string;
  title: string;
  due_date: string | null;
  done: boolean;
  revision: number;
};
export type FocusSession = {
  id: string;
  course_code: string;
  seconds: number;
  note: string;
  created_at: string;
};
export type Study = { tasks: Task[]; sessions: FocusSession[] };
export type Alternative = {
  name: string;
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
  reasons: { rule: string; message: string }[];
  suggestions: {
    kind: 'horizon' | 'credit_cap';
    value: number;
    message: string;
  }[];
};
export type SolveResult = {
  status: string;
  message: string;
  alternatives: Alternative[];
  diagnosis?: Diagnosis;
  source_revision: number;
  profile_revision: number;
};
