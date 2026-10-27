export type Course = {
  code: string;
  name: string;
  credits: number;
  recommended_term: number;
  prerequisites: string[];
  offered_terms: number[];
};
export type Curriculum = {
  id: string;
  name: string;
  version: string;
  status: string;
  disclaimer: string;
  source: string;
  credit_cap: number;
  courses: Course[];
};
export type Profile = {
  id: string;
  alias: string;
  current_term: number;
  completed: string[];
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
  completed_credits: number;
  remaining_credits: number;
  completion_term: number | null;
  peak_credits: number;
  curriculum_version: string;
  plan_revision: number;
  profile_revision: number;
  assumptions: string[];
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
  assignments: Record<string, number>;
  validation: Validation;
  optimal: boolean;
};
export type SolveResult = {
  status: string;
  message: string;
  alternatives: Alternative[];
  source_revision: number;
  profile_revision: number;
};
