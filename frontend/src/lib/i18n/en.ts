import { enPages } from './en-pages.js';
import { enPlan } from './en-plan.js';
import { enStart } from './en-start.js';

// English is the source of truth for message keys. id.ts must define the same keys.
// Plural messages use `key.one` and `key.other` and are selected with a `count` param.
export const en = {
  ...enPlan,
  ...enPages,
  ...enStart,
  'lang.label': 'Language',

  'nav.main': 'Main navigation',
  'nav.overview': 'Overview',
  'nav.overview.short': 'Overview',
  'nav.plans': 'Study plans',
  'nav.plans.short': 'Plans',
  'nav.compare': 'Compare plans',
  'nav.compare.short': 'Compare',
  'nav.study': 'Study & focus',
  'nav.study.short': 'Study',
  'nav.profile': 'Academic profile',
  'nav.profile.short': 'Profile',

  'sidebar.about': 'About Avenra',
  'sidebar.methodology': 'Rules & methodology',
  'sidebar.workspace': 'Your workspace',
  'sidebar.identity.synthetic': 'Example curriculum',
  'sidebar.identity.own': 'Your curriculum',

  'topbar.connected': 'Workspace connected',
  'topbar.unavailable': 'Workspace unavailable',
  'topbar.curriculum.example': 'Example curriculum',
  'topbar.curriculum.own': 'Your curriculum',
  'layout.retry': 'Retry connection',

  'overview.title': 'Avenra | Your academic workspace',
  'overview.eyebrow': 'Graduation outlook',
  'overview.headline.loading': 'Checking your graduation outlook…',
  'overview.headline.unknown': 'Make your next semester count.',
  'overview.headline.on_track': 'On track for semester {term}.',
  'overview.headline.late': 'Heading for semester {term}.',
  'overview.headline.unresolved': 'No plan fits within the study period yet.',
  'overview.sub.loading':
    'Comparing your saved plan with the curriculum rules.',
  'overview.sub.unknown':
    'The outlook could not be confirmed in time. Your plans are saved; open one to check it.',
  'overview.sub.unresolved':
    'Open your plan to see which rule blocks it and the smallest change that helps.',
  'overview.sub.basis.plan': 'Your saved plan',
  'overview.sub.basis.fix.one':
    'Your saved plan has {count} rule check to fix, so this is the earliest modeled finish',
  'overview.sub.basis.fix.other':
    'Your saved plan has {count} rule checks to fix, so this is the earliest modeled finish',
  'overview.sub.target': 'the semester {term} target set in your curriculum',
  'overview.sub.earlier': ' A rearranged plan could finish in semester {term}.',
  'overview.sub.late': '{base} finishes {delay} after {target}.',
  'overview.sub.ontime': '{base} meets {target}.',
  'overview.sub.estimate': ' A modeled estimate, not an official decision.',
  'overview.semesters.one': '{count} semester',
  'overview.semesters.other': '{count} semesters',
  'overview.meta.finish': 'Finish',
  'overview.meta.target': 'Target',
  'overview.meta.status': 'Status',
  'overview.meta.semester': 'Semester {term}',
  'overview.meta.late': '{delay} late',
  'overview.meta.ontime': 'On time',
  'overview.action.recovery': 'Find a recovery plan',
  'overview.action.open_plan': 'Open your plan',
  'overview.action.study_space': 'Study space',

  'overview.attention.heading': 'Needs your attention',
  'overview.attention.overdue': 'Overdue: {title}',
  'overview.attention.due_soon': 'Due soon: {title}',
  'overview.attention.start_today': 'Start today: {title}',
  'overview.attention.start_detail': 'First step: {step}',
  'overview.attention.task_detail': 'Course {course} | due {date}',
  'overview.attention.task_detail_goal': 'Goal {goal} | due {date}',
  'overview.attention.task_detail_both':
    'Course {course} | Goal {goal} | due {date}',
  'overview.attention.task_detail_plain': 'Due {date}',
  'overview.attention.open_study': 'Open study',
  'overview.attention.protect': 'Protect {name}',
  'overview.attention.fail_none':
    'If you fail it this semester, no modeled plan finishes within the study period.',
  'overview.attention.fail_moves':
    'If you fail it this semester, the earliest modeled finish moves to semester {term}.',
  'overview.attention.set_target': 'Set a target',
  'overview.attention.findings.one':
    'Your plan has {count} rule check to review',
  'overview.attention.findings.other':
    'Your plan has {count} rule checks to review',
  'overview.attention.review_plan': 'Review plan',
  'overview.attention.overload':
    'Semester {term} needs {total} h of {available} h available',
  'overview.attention.overload_goals':
    '{course} h for {credits} credits + {goal} h for goals. Adjust your plan or weekly hours.',
  'overview.attention.overload_courses':
    '{course} h for {credits} credits. Adjust your plan or weekly hours.',
  'overview.attention.empty.ready':
    'Nothing flagged right now. Check again after new grades or deadlines.',
  'overview.attention.empty.loading':
    'Checking for deadlines and critical courses…',
  'overview.attention.empty.unavailable':
    'The outlook is unavailable right now. Your plans are still saved.',

  'overview.mission.heading': 'Your mission & goals',
  'overview.mission.active': 'Active this semester',
  'overview.mission.upcoming': 'Other planned goals',
  'overview.mission.no_active':
    'No goals are scheduled for semester {term} right now.',
  'overview.mission.goal_meta': '{kind} | {range} | {hours} h/week',
  'overview.mission.range_single': 'Semester {term}',
  'overview.mission.range_multi': 'Semesters {start}-{end}',

  'overview.progress.heading': 'Credits toward graduation',
  'overview.progress.edit': 'Edit profile',
  'overview.progress.credits': '/ {total} credits',
  'overview.progress.aria': 'Completed credits toward graduation',
  'overview.progress.courses.one': '{count} course completed',
  'overview.progress.courses.other': '{count} courses completed',
  'overview.progress.now': 'Now in semester {term}',

  'overview.plans.heading': 'Your plans',
  'overview.plans.all': 'All plans',
  'overview.plans.checks.one': '{count} check to review',
  'overview.plans.checks.other': '{count} checks to review',
  'overview.plans.valid': 'Meets listed rules',
  'overview.plans.summary':
    '{credits} credits planned | Up to semester {horizon}',
  'overview.plans.open': 'Open plan',
  'overview.footnote':
    'Avenra supports planning and advisor consultation. It does not issue academic approvals.',
} as const;

export type MessageKey = keyof typeof en;
