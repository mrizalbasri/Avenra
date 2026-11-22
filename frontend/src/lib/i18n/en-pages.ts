// Messages for Plans, Study, Profile, Curriculum, Methodology, the error page,
// the workspace switcher, calendar export and curriculum import errors.
export const enPages = {
  // Import and parsing errors (also used as API-style codes by lib/curriculum-import.ts)
  'error.CSV_UNCLOSED_QUOTE':
    'The CSV has an unclosed quote. Check your course names.',
  'error.CSV_MISSING_COLUMN':
    'Missing CSV column: {field}. Download the template for the required format.',
  'error.CSV_ROW_COUNT': 'Import between 1 and 100 courses.',
  'error.CSV_ROW_INVALID':
    'Check course row {row}: course code, name, credits (1 to 24), and semester (1 to 14) are required.',
  'error.CSV_MIN_CREDITS':
    'Row {row}: min_credits must be a whole number from 0 to 300.',
  'error.CSV_OFFERED': 'Row {row}: offered_terms must be odd, even, or both.',
  'error.CSV_CATEGORY': 'Row {row}: category must be required or elective.',
  'error.IPS_RULE_INVALID':
    'IPS rule {index} must look like "3.00 = 24" (IPS 0 to 4, credits 1 to 24).',
  'error.IPS_TOO_MANY': 'Use at most 10 IPS rules.',
  'error.CSV_TOO_LARGE': 'Keep the CSV under 60 KB and 100 courses.',

  // Workspace switcher
  'ws.label': 'Workspace',
  'ws.aria': 'Switch workspace',
  'ws.choose': 'Choose a workspace',
  'ws.import': '+ Import another curriculum',
  'ws.invalid': 'Invalid workspace.',
  'ws.not_found': 'Workspace not found.',

  // Error page
  'errorpage.title': 'Avenra | Workspace unavailable',
  'errorpage.not_found': 'That page is not available.',
  'errorpage.generic': 'We could not open this workspace.',
  'errorpage.hint': 'Check the API and database connection, then try again.',
  'errorpage.back': 'Return to overview',

  // Plans list
  'plans.title': 'Avenra | Study plans',
  'plans.heading': 'Your plans. Your possibilities.',
  'plans.lead':
    'Keep a baseline, try something different, and compare before deciding.',
  'plans.start': 'Start with your academic profile.',
  'plans.start_hint':
    'Open the demo workspace from Overview to create your first plan.',
  'plans.go_overview': 'Go to overview',
  'plans.new_name': 'New plan name',
  'plans.name_placeholder': 'e.g. Internship next year',
  'plans.create': 'Create plan',
  'plans.active': 'Active plans',
  'plans.archived': 'Archived',
  'plans.count.one': '{count} plan',
  'plans.count.other': '{count} plans',
  'plans.needs_review': 'Needs review',
  'plans.tile_meta': '{remaining} remaining credits | {cap} credit cap',
  'plans.findings_review': '{count} rule findings to review',
  'plans.view_restore': 'View & restore',
  'plans.duplicate': 'Duplicate {name}',
  'plans.copy_name': '{name} copy',
  'plans.empty_archived': 'No archived plans.',
  'plans.empty_active': 'Your next plan starts here.',
  'plans.empty_archived_hint': 'Plans you archive remain available here.',
  'plans.empty_active_hint': 'Give your plan a name above to start exploring.',

  // Profile
  'profile.title': 'Avenra | Academic profile',
  'profile.heading': 'Your starting point.',
  'profile.lead':
    'Set your current semester and completed courses. Plans build on this shared baseline.',
  'profile.panel': 'Academic profile',
  'profile.alias_hint':
    'Use an alias and fictional records in this local demo.',
  'profile.alias': 'Student alias',
  'profile.current': 'Current semester',
  'profile.last_ips': 'Last semester IPS',
  'profile.ips_placeholder': 'e.g. 3.25',
  'profile.ips_limits': 'Credit limits by IPS: {list}.',
  'profile.ips_limit_item': 'IPS {gpa}+ | {credits} credits',
  'profile.completed': 'Completed courses',
  'profile.selected': '{count} selected',
  'profile.completed_hint':
    'Mark only courses already passed. Scenario failures stay inside individual plans.',
  'profile.course_line': '{code} | {credits} credits | Semester {term}{extra}',
  'profile.elective_extra': ' | Elective',
  'profile.saving': 'Saving…',
  'profile.save': 'Save academic profile',
  'profile.saved':
    'Profile saved. All plan checks now use your updated progress.',
  'profile.none': 'No academic profile yet.',
  'profile.open_demo': 'Open the demo workspace',

  // Study
  'study.title': 'Avenra | Study & focus',
  'study.heading': 'Give your plan some focus.',
  'study.lead':
    'Small, specific learning targets. Time set aside to work on them.',
  'study.minutes_tag': '{minutes} focused minutes recorded',
  'study.open_workspace': 'Open a workspace to start learning.',
  'study.next_target': "What's your next learning target?",
  'study.course': 'Course',
  'study.target': 'Specific target',
  'study.target_placeholder': 'e.g. Solve 5 linked-list exercises',
  'study.target_date': 'Target date (optional)',
  'study.add': 'Add study target',
  'study.targets': 'Your study targets',
  'study.filter.all': 'All',
  'study.filter.open': 'Open',
  'study.filter.done': 'Done',
  'study.ics': 'Add open targets to my calendar (.ics)',
  'study.ics_hint':
    'Opens in Google Calendar, Apple Calendar, or Outlook with a reminder at 19:00 the day before each due date.',
  'study.ics_course': 'Study target for {course}. Added from Avenra.',
  'study.ics_plain': 'Added from Avenra.',
  'study.due': ' | Due {date}',
  'study.no_targets':
    'No targets in this view. Add a clear, achievable target above.',
  'study.recent': 'Recent focus sessions',
  'study.default_note': 'Focused study session',
  'study.no_sessions': 'Your saved sessions will appear here.',
  'study.focus_space': 'Focus space',
  'study.mode.focus': 'Focus',
  'study.mode.break': 'Break',
  'study.timer_aria': 'Time remaining',
  'study.caption.focus': 'One thing at a time.',
  'study.caption.break': 'Step away and recharge.',
  'study.restored': "Restored in a paused state. Resume when you're ready.",
  'study.pause': 'Pause',
  'study.resume': 'Resume',
  'study.start': 'Start session',
  'study.reset': 'Reset',
  'study.focus_minutes': 'Focus minutes',
  'study.break_minutes': 'Break minutes',
  'study.learned': 'What did you learn?',
  'study.learned_placeholder': 'A short reflection or your next question…',
  'study.saving': 'Saving…',
  'study.finish': 'Finish & save session',
  'study.footnote':
    'The timer uses timestamps, so background tabs do not lose elapsed time. Reload restores it paused. Sessions are saved to PostgreSQL when you finish.',
  'study.notice.no_storage':
    'Browser recovery is unavailable. Keep this page open until you save the session.',
  'study.notice.no_restore':
    'The previous timer could not be restored. Start a new session.',
  'study.notice.focus_done':
    'Focus block complete. Save your reflection, then take a break.',
  'study.notice.break_done': 'Break complete. Ready for your next focus block?',
  'study.discard': 'Discard this unsaved focus session?',
  'study.notice.saved':
    'Focus session saved. Time spent does not imply course mastery.',
  'study.notice.added': 'Study target added.',

  // Curriculum import
  'curriculum.title': 'Avenra | Bring your curriculum',
  'curriculum.heading': 'Your campus. Your curriculum.',
  'curriculum.lead':
    'Build a workspace for your own program. Avenra uses the rules you provide, without assuming every university is the same.',
  'curriculum.context': 'Academic context',
  'curriculum.alias': 'Student alias',
  'curriculum.alias_placeholder': 'Use an alias for this local prototype',
  'curriculum.university': 'University',
  'curriculum.university_placeholder': 'Your university',
  'curriculum.program': 'Study program',
  'curriculum.program_placeholder': 'e.g. Informatika',
  'curriculum.version': 'Curriculum year / version',
  'curriculum.current': 'Current semester',
  'curriculum.last_ips': 'Last semester IPS (optional)',
  'curriculum.ips_placeholder': 'e.g. 3.25',
  'curriculum.max_credits': 'Maximum credits per semester',
  'curriculum.grad_credits': 'Credits needed to graduate (optional)',
  'curriculum.grad_placeholder': 'e.g. 144',
  'curriculum.on_time': 'On-time graduation (semester)',
  'curriculum.max_period': 'Maximum study period (semesters)',
  'curriculum.ips_rules': 'Credit limit by IPS',
  'curriculum.ips_rules_hint':
    'One rule per line: minimum IPS = maximum credits. Copy the table from your academic handbook. Leave empty if your campus has no IPS rule.',
  'curriculum.source': 'Rule source or curriculum reference',
  'curriculum.source_placeholder':
    'Official handbook URL, document title, or rule reference',
  'curriculum.import': 'Import your courses',
  'curriculum.template': 'Download CSV template',
  'curriculum.csv_hint_a':
    'Export a course list from your curriculum handbook into the template. Use course codes for prerequisites, separated by semicolons; write ',
  'curriculum.csv_hint_b':
    ' when either course is enough. Offering: odd, even, or both. Category: required or elective. Corequisites may be taken in the same semester. min_credits is the credits needed before taking the course, for example an internship or thesis.',
  'curriculum.choose_file': 'Choose a CSV file',
  'curriculum.paste': 'Or paste CSV content',
  'curriculum.ready.one': '{count} course ready to validate{from}.',
  'curriculum.ready.other': '{count} courses ready to validate{from}.',
  'curriculum.from_file': ' from {filename}',
  'curriculum.col.code': 'Code',
  'curriculum.col.course': 'Course',
  'curriculum.col.credits': 'Credits',
  'curriculum.col.prereq': 'Prerequisites',
  'curriculum.none': 'None',
  'curriculum.warning':
    'Rules are user-supplied until independently verified. Avenra checks prerequisites (including "either A or B"), corequisites, earned-credit thresholds, electives toward a graduation total, odd/even offerings, and an IPS-based credit limit for next semester. Exceptions, equivalent courses, and credit transfer still need advisor review.',
  'curriculum.validating': 'Validating curriculum…',
  'curriculum.create': 'Create my academic workspace',
  'curriculum.footnote':
    'A new workspace keeps any previous curriculum and plans intact. This local prototype has no sign-in; use aliases and non-sensitive data.',

  // Methodology
  'method.title': 'Avenra | Rules & methodology',
  'method.heading': 'Know what your plan is built on.',
  'method.lead':
    "Clear rules, visible assumptions, and room for an advisor's judgment.",
  'method.own.heading': 'Bring your own curriculum',
  'method.own.p1':
    'Students from different universities can create separate workspaces by importing their own course CSV. Each workspace retains its program, curriculum version, credit cap, prerequisite graph, source reference, plans, and study targets.',
  'method.own.p2':
    'Imported rules are labeled user-supplied, not independently verified. A structurally valid CSV does not establish that it accurately represents institutional policy. Courses are required unless the CSV marks them as electives; electives count toward the graduation credit total.',
  'method.own.link': 'Import a curriculum',
  'method.synthetic.heading': 'Synthetic curriculum',
  'method.synthetic.p1':
    "The bundled S1 Informatika curriculum is fictional. It follows a common Indonesian structure: 144 credits, 8 recommended semesters, a 14-semester study limit, courses offered only in odd or even semesters, and an IPS table for next semester's credit limit. No specific university's policy has been used or verified.",
  'method.synthetic.source_a': 'Source: ',
  'method.synthetic.source_b':
    '. Every validation and export records the curriculum version.',
  'method.checks.heading': 'What gets checked',
  'method.checks.1':
    'Every remaining required course is scheduled, and the planned total reaches the graduation credits.',
  'method.checks.2':
    'Prerequisites are finished in an earlier semester. "Either A or B" rules need one of them. Corequisites can share the semester.',
  'method.checks.3':
    'Courses such as an internship or thesis wait until enough credits are earned.',
  'method.checks.4':
    'Each semester stays within your limit, the curriculum maximum, and, for next semester, the IPS-based limit.',
  'method.checks.5':
    'Courses follow the odd/even offering calendar and stay within the maximum study period. A course failed this semester is retaken from next semester.',
  'method.checks.note':
    'Unknown codes and malformed input are rejected. Invalid drafts can be saved for exploration, but they are labeled for review.',
  'method.recovery.heading': 'How recovery works',
  'method.recovery.p1':
    'OR-Tools CP-SAT searches for an earlier-completion option and a lighter-peak-workload option. A separate rule checker validates each result, and each option explains how it differs. If only one distinct option is found, Avenra shows one. A timeout is reported separately from infeasibility.',
  'method.recovery.p2':
    'When no plan fits, Avenra names the blocking prerequisite chain or credit shortfall and tests the smallest longer plan or higher personal credit limit that would work.',
  'method.recovery.p3':
    'Scenario setbacks and scenario IPS values apply only inside that plan. They do not overwrite the shared academic profile.',
  'method.learning.heading': 'Learning support',
  'method.learning.p1':
    'Course tasks and focus sessions help you turn intentions into action. Time spent is not a measure of comprehension, and completing a task never marks an academic course as passed.',
  'method.privacy.heading': 'Privacy and boundaries',
  'method.privacy.p1':
    'Workspaces are scoped by a browser-held identifier. This prototype has no sign-in or verified identity: workspace separation is not authentication. Use aliases and non-sensitive examples. Public multi-user deployment requires authentication, authorization, and further privacy review. Clearing browser storage may remove the workspace selector; it does not delete database records.',
  'method.privacy.p2':
    'Exceptions, transfer credit, equivalent courses, and internship conversion are not modeled. The IPS rule applies only to next semester because later grades are unknown. Discuss a Decision Passport with an authorized academic advisor.',
  'method.tech.heading': 'Technology and attribution',
  'method.tech.p1':
    'SvelteKit, Svelte Flow, FastAPI, PostgreSQL, SQLAlchemy, and Google OR-Tools. OpenAI Codex materially assisted with implementation, tests, and documentation. Team members remain responsible for reviewing and understanding the work.',
} as const;
