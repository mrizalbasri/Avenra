// Messages for the onboarding wizard at /start.
export const enStart = {
  'start.title': 'Avenra | Get started',
  'start.heading': 'Set up your workspace.',
  'start.lead':
    'Four short steps: about you, your curriculum, passed courses, and optional weekly time and goals.',
  'start.steps_aria': 'Setup steps',
  'start.step.1': 'About you',
  'start.step.2': 'Your curriculum',
  'start.step.3': 'Passed courses',
  'start.step.4': 'Time & goals',
  'start.step_of': 'Step {n} of 4',
  'start.back': 'Back',
  'start.next': 'Next',
  'start.draft_restored': 'Your unfinished setup was restored.',
  'start.start_over': 'Start over',
  'start.start_over_confirm': 'Clear everything you entered and start again?',

  'start.language_hint':
    'Choose the language for Avenra. You can change it later.',
  'start.mission': 'Your mission (optional)',
  'start.mission_placeholder':
    'e.g. Graduate on time while leading the student union.',
  'start.mission_count': '{count} / 500',

  'start.paste_heading': 'Bring your course list',
  'start.example': 'Start from the example curriculum',
  'start.example_loading': 'Loading the example…',
  'start.example_label':
    'Example curriculum (synthetic). Replace it with your own courses when you can.',
  'start.use_table': 'Use this table',
  'start.use_table_hint': 'This replaces the courses below.',
  'start.template_loaded':
    'Curriculum template loaded. Review the courses and rules below.',
  'start.rows_heading': 'Courses',
  'start.rows_hint':
    'Check each course. Write prerequisites as course codes separated by ";", and A|B when either course is enough. Prerequisites and IPS rules can be completed later.',
  'start.rows_empty':
    'Paste a table above, start from the example, or add courses one by one.',
  'start.add_row': 'Add a course',
  'start.remove_row': 'Remove row {n}',
  'start.row_label': 'Row {n}',
  'start.row_field': '{field}, row {n}',
  'start.total.one': '{count} course | {credits} credits',
  'start.total.other': '{count} courses | {credits} credits',
  'start.rows_issues.one': '{count} problem to fix in the courses',
  'start.rows_issues.other': '{count} problems to fix in the courses',
  'start.rules_heading': 'Program rules',
  'start.required_over':
    'Required courses add up to {required} credits, more than the {target} graduation credits. Mark some as elective or raise the number.',
  'start.term_beyond':
    'Some courses are recommended after semester {max}, the maximum study period.',
  'start.target_beyond':
    'On-time graduation cannot be later than the maximum study period.',
  'start.current_beyond':
    'Your current semester ({current}) is after the maximum study period.',
  'start.missing_context':
    'Fill in the university, study program, curriculum version and rule source.',

  'start.passed_heading': 'Which courses have you passed?',
  'start.passed_lead':
    'Tick the courses you have already passed. Avenra plans the rest.',
  'start.mark_until': 'Mark semesters 1 to {n} as passed',
  'start.clear_passed': 'Clear all',
  'start.passed_count.one': '{count} course passed | {credits} credits',
  'start.passed_count.other': '{count} courses passed | {credits} credits',
  'start.passed_issues':
    'These passed courses need a prerequisite that is not ticked:',
  'start.create': 'Create my workspace',
  'start.creating': 'Creating your workspace…',
  'start.skip_create': 'Skip & create workspace',
  'start.budget_heading': 'Weekly time & goals (optional)',
  'start.budget_lead':
    'Set how many hours a week you can study and add activities like internships, work, or organisations. You can skip this and add it later in Profile.',
} as const;
