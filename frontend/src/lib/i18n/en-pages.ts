// Messages for Plans, Study, Profile, Curriculum, Methodology, the error page,
// the workspace switcher, calendar export and curriculum import errors.
export const enPages = {
  // Import and parsing errors (also used as API-style codes by lib/curriculum-import.ts)
  'error.IPS_RULE_INVALID':
    'IPS rule {index} must look like "3.00 = 24" (IPS 0 to 4, credits 1 to 24).',
  'error.IPS_TOO_MANY': 'Use at most 10 IPS rules.',
  'error.CSV_TOO_LARGE': 'Keep the CSV under 60 KB and 100 courses.',

  // Pasted table import
  'import.field.code': 'Course code',
  'import.field.name': 'Course name',
  'import.field.credits': 'Credits',
  'import.field.recommended_term': 'Semester',
  'import.field.prerequisites': 'Prerequisites',
  'import.field.corequisites': 'Corequisites',
  'import.field.min_credits': 'Minimum credits earned',
  'import.field.offered_terms': 'Offered in',
  'import.field.category': 'Category',
  'import.UNCLOSED_QUOTE':
    'The table has an unclosed quote. Check your course names.',
  'import.MISSING_COLUMN':
    'Could not find a "{field}" column. Pick one below or add it to the table.',
  'import.NO_ROWS': 'Paste a table with a header row and at least one course.',
  'import.ROW_COUNT': 'Import between 1 and 100 courses.',
  'import.MISSING_CODE': 'Row {row}: course code is required.',
  'import.MISSING_NAME': 'Row {row}: course name is required.',
  'import.BAD_CREDITS':
    'Row {row}: credits must be a whole number from 1 to 24 (found "{value}").',
  'import.BAD_TERM':
    'Row {row}: semester must be a whole number from 1 to 14 (found "{value}").',
  'import.BAD_MIN_CREDITS':
    'Row {row}: min_credits must be a whole number from 0 to 300.',
  'import.BAD_OFFERED':
    'Row {row}: offered_terms must be odd, even, or both (found "{value}").',
  'import.BAD_CATEGORY':
    'Row {row}: category must be required or elective (found "{value}").',
  'import.DUPLICATE_CODE':
    'Row {row}: course code {code} already appears in row {first}.',
  'import.UNKNOWN_REFERENCE':
    'Row {row}: {code} lists {ref}, which is not a course in this table.',
  'import.paste_hint':
    'You can also paste a table copied from Excel, Google Sheets, or a PDF. Avenra detects the separator and recognises English and Indonesian column names.',
  'import.separator': 'Detected separator: {name}',
  'import.sep.tab': 'tab',
  'import.sep.comma': 'comma',
  'import.sep.semicolon': 'semicolon',
  'import.sep.spaces': 'spaces',
  'import.columns': 'How Avenra read your columns',
  'import.column_aria': 'Meaning of column {header}',
  'import.ignore': 'Ignore this column',
  'import.guess': 'Not recognised',
  'import.issues.one': '{count} problem to fix before you can continue',
  'import.issues.other': '{count} problems to fix before you can continue',
  'import.more': '…and {count} more.',

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
  'plans.findings_review': '{count} rule issues to review',
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
  'profile.alias_hint': 'Use a name or alias you recognize.',
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
  'profile.mission_section': 'Mission, weekly time & goals',
  'profile.mission_lead':
    'Share what you are aiming for and how much time you have outside classes. Avenra uses this to suggest realistic semester credit limits.',
  'profile.edit_courses': 'Edit courses',
  'profile.edit_courses_hint':
    'Add missing prerequisites, update IPS rules, or adjust courses anytime. Your plans recheck immediately.',
  'profile.save_courses': 'Save curriculum',
  'profile.saving_courses': 'Saving curriculum…',
  'profile.courses_saved':
    'Curriculum saved. All plans now use your updated courses and rules.',
  'profile.courses_removed_passed':
    'Uncheck these passed courses first before deleting them: {courses}.',
  'profile.search_courses': 'Filter courses by code or name',
  'profile.search_placeholder': 'e.g. IF2101 or Data Structures',
  'profile.mark_earlier': 'Mark semesters 1 to {term} as passed',
  'profile.semester_group': 'Semester {term}',
  'profile.semester_count': '{done} / {total}',
  'profile.no_course_match': 'No courses match "{query}".',
  'profile.data_section': 'Workspace backup & local data',
  'profile.data_lead':
    'Export a full backup JSON to move devices, restore a previous backup into a new workspace, or clear browser data.',
  'profile.export_json': 'Export workspace (.json)',
  'profile.restore_json': 'Restore from backup (.json)',
  'profile.restoring': 'Restoring…',
  'profile.exported': 'Workspace backup downloaded.',
  'profile.restore_invalid': 'Choose a valid Avenra backup JSON file.',
  'profile.restore_too_large': 'Keep backup files under 2 MB.',
  'profile.clear_browser': 'Clear browser workspace list & drafts',
  'profile.clear_browser_confirm':
    'Clear remembered workspaces, unsaved drafts, and paused timers from this browser? Database records will not be deleted.',
  'profile.browser_cleared':
    'Browser workspace list and local drafts cleared. Database records are unchanged.',
  'profile.delete_workspace': 'Delete this workspace',
  'profile.delete_workspace_confirm':
    'Permanently delete this workspace, its plans, study targets, and focus sessions from the local database?',
  'profile.deleting': 'Deleting…',

  // Goals & weekly time budget editor
  'goals.available_hours': 'Weekly hours available (optional)',
  'goals.available_placeholder': 'e.g. 45',
  'goals.minutes_per_credit': 'Minutes per SKS per week',
  'goals.minutes_hint':
    'Assumes 1 SKS = 170 min/week (50 class + 60 structured + 60 independent). Adjust if your courses take more or less time.',
  'goals.implied_cap':
    '{hours} h/week | up to {cap} credits/semester before goal hours.',
  'goals.list_heading': 'Goals & commitments',
  'goals.list_hint':
    'Add up to 3 activities (such as an internship, job, or organisation). Active goals lower that semester’s credit cap when a weekly budget is set.',
  'goals.count': '{count} / {max}',
  'goals.item_label': 'Goal {n}',
  'goals.remove': 'Remove',
  'goals.remove_aria': 'Remove goal {n}',
  'goals.field_title': 'Goal title',
  'goals.title_placeholder': 'e.g. Internship or BEM',
  'goals.field_kind': 'Kind',
  'goals.field_start': 'Start semester',
  'goals.field_end': 'End semester',
  'goals.field_hours': 'Hours / week',
  'goals.field_aria': '{field}, goal {n}',
  'goals.kind_internship': 'Internship',
  'goals.kind_work': 'Work',
  'goals.kind_organisation': 'Organisation',
  'goals.kind_graduation': 'Graduation',
  'goals.kind_other': 'Other',
  'goals.empty': 'No goals added yet.',
  'goals.add': 'Add a goal',
  'goals.error.BUDGET_HOURS':
    'Weekly hours available must be between 0 and 168.',
  'goals.error.BUDGET_MINUTES':
    'Minutes per SKS must be a whole number between 60 and 300.',
  'goals.error.GOAL_TITLE': 'Goal {n}: enter a title (up to 80 characters).',
  'goals.error.GOAL_TERM':
    'Goal {n}: start and end semesters must be between 1 and {max}.',
  'goals.error.GOAL_ORDER': 'Goal {n}: end semester cannot be before start.',
  'goals.error.GOAL_HOURS': 'Goal {n}: weekly hours must be between 0 and 168.',

  // Study
  'study.title': 'Avenra | Study & focus',
  'study.heading': 'Give your plan some focus.',
  'study.lead':
    'Small, specific learning targets. Time set aside to work on them.',
  'study.minutes_tag': '{minutes} focused minutes recorded',
  'study.open_workspace': 'Open a workspace to start learning.',
  'study.next_target': "What's your next learning target?",
  'study.mode_manual': 'Manual target',
  'study.mode_announce': 'Paste announcement',
  'study.announce_label': 'Class announcement or chat message',
  'study.announce_placeholder':
    'Paste a WhatsApp, Telegram, or LMS announcement (course, deadline, format, instructions)…',
  'study.announce_hint':
    'Avenra extracts the course/goal, due date, key details, and a tiny first step. Nothing is saved until you confirm.',
  'study.announce_example': 'Try an example',
  'study.announce_extract': 'Extract & review',
  'study.review_heading': 'Confirm task & start plan',
  'study.review_warn_target':
    'Could not match a course or goal automatically | choose one below.',
  'study.review_warn_due':
    'No due date was detected | add one if this task has a deadline.',
  'study.start_date': 'Planned start date (optional)',
  'study.first_step': 'First tiny step (optional)',
  'study.first_step_placeholder':
    'e.g. Open template and write 3 outline points (10 min)',
  'study.details_label': 'Key details & requirements (one per line)',
  'study.details_placeholder': 'e.g. Format PDF\nSubmit to LMS before 23:59',
  'study.confirm_add': 'Confirm & add task',
  'study.back_paste': 'Edit announcement',
  'study.start_badge': ' | Start {date}',
  'study.first_step_prefix': 'First step: {step}',
  'study.start_now': 'Start now',
  'study.notice.started_task': 'Focus sprint started: {step}',
  'study.notice.session_active':
    'Finish or reset your current focus session first before switching tasks.',
  'study.ics_start_prefix': 'Start',
  'study.ics_first_step': 'First step: {step}',
  'study.course': 'Course',
  'study.course_or_goal': 'Course or goal',
  'study.group_courses': 'Courses',
  'study.group_goals': 'Goals',
  'study.filter_goal': 'Filter by goal',
  'study.filter_goal_all': 'All courses & goals',
  'study.filter_goal_courses': 'Courses only',
  'study.focus_course': 'Focus course',
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
    'Opens in Google Calendar, Apple Calendar, or Outlook with a 09:00 reminder on planned start dates and a 19:00 reminder the day before each due date.',
  'study.ics_course': 'Study target for {course}. Added from Avenra.',
  'study.ics_goal': 'Goal target for {goal}. Added from Avenra.',
  'study.ics_both': 'Target for {course} ({goal}). Added from Avenra.',
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
    'The timer uses timestamps, so background tabs do not lose elapsed time. Reload restores it paused. Sessions are saved when you finish.',
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
  'study.notice.updated': 'Study target updated.',
  'study.notice.deleted': 'Study target deleted.',
  'study.notice.started_goal_task':
    'Focus sprint started for {course} (goal task): {step}',
  'study.edit': 'Edit',
  'study.delete': 'Delete',
  'study.delete_confirm': 'Delete "{title}"?',
  'study.save_edit': 'Save changes',
  'study.cancel_edit': 'Cancel',
  'study.manual_details_toggle': 'Add key details & checklist (optional)',
  'study.edit_target_aria': 'Edit target {title}',
  'study.delete_target_aria': 'Delete target {title}',

  // Curriculum import
  'curriculum.alias': 'Student alias',
  'curriculum.alias_placeholder': 'Your name or alias',
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
  'curriculum.grad_too_high':
    'The courses in your table add up to {total} credits, fewer than the {target} graduation credits. Add the missing courses, or change or clear this number.',
  'curriculum.on_time': 'On-time graduation (semester)',
  'curriculum.max_period': 'Maximum study period (semesters)',
  'curriculum.ips_rules': 'Credit limit by IPS',
  'curriculum.ips_rules_hint':
    'One rule per line: minimum IPS = maximum credits. Copy the table from your academic handbook. Leave empty if your campus has no IPS rule.',
  'curriculum.source': 'Rule source or curriculum reference',
  'curriculum.source_placeholder':
    'Official handbook URL, document title, or rule reference',
  'curriculum.template': 'Download CSV template',
  'curriculum.csv_hint_a':
    'Export a course list from your curriculum handbook into the template. Use course codes for prerequisites, separated by semicolons; write ',
  'curriculum.csv_hint_b':
    ' when either course is enough. Offering: odd, even, or both. Category: required or elective. Corequisites may be taken in the same semester. min_credits is the credits needed before taking the course, for example an internship or thesis.',
  'curriculum.choose_file': 'Choose a CSV file',
  'curriculum.paste': 'Or paste CSV content',
  'curriculum.warning':
    'Rules are user-supplied until independently verified. Avenra checks prerequisites (including "either A or B"), corequisites, earned-credit thresholds, electives toward a graduation total, odd/even offerings, and an IPS-based credit limit for next semester. Exceptions, equivalent courses, and credit transfer still need advisor review.',
  'curriculum.footnote':
    'A new workspace keeps any previous curriculum and plans intact. Data stays in this local workspace without a sign-in.',

  // Methodology
  'method.title': 'Avenra | Rules & methodology',
  'method.heading': 'Know what your plan is built on.',
  'method.lead':
    "Clear rules, visible assumptions, and room for an advisor's judgment.",
  'method.own.heading': 'Bring your own curriculum',
  'method.own.p1':
    'Students from different universities can paste a course table from Excel, Google Sheets, or a PDF during setup, review and edit each row, and update courses, prerequisites, or IPS rules later from Academic profile.',
  'method.own.p2':
    'Imported rules are labeled user-supplied, not independently verified. A valid course table does not establish that it accurately represents institutional policy. Courses are required unless marked as elective; electives count toward the graduation credit total.',
  'method.own.link': 'Set up a curriculum',
  'method.synthetic.heading': 'Example curriculum',
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
    'Each semester stays within your limit, the curriculum maximum, your weekly time budget when set, and, for next semester, the IPS-based limit.',
  'method.checks.5':
    'Courses follow the odd/even offering calendar and stay within the maximum study period. A course failed this semester is retaken from next semester.',
  'method.checks.note':
    'Unknown codes and malformed input are rejected. Drafts with rule issues can still be saved for exploration, and stay clearly labeled for review.',
  'method.budget.heading': 'Weekly time budget, goals, and languages',
  'method.budget.p1':
    'When you enter available weekly hours and up to 3 goals (such as an internship, job, or student organisation), Avenra subtracts active goal hours in each semester and converts remaining time into a semester credit cap. By default, 1 SKS is assumed to take 170 minutes per week (50 face-to-face + 60 structured + 60 independent), and you can edit that assumption in Profile.',
  'method.budget.p2':
    'The plan editor shows weekly course and goal hours per semester, and the Overview flags semesters whose hours exceed what you have available in neutral wording. Avenra supports planning only: it never labels burnout, stress, or health risk, and never guarantees graduation. The interface and all rule explanations are available in Indonesian and English.',
  'method.recovery.heading': 'How recovery works',
  'method.recovery.p1':
    'OR-Tools CP-SAT searches for an earlier-completion option and a lighter-peak-workload option. A separate rule checker validates each result, and each option explains how it differs. If only one distinct option is found, Avenra shows one. A timeout is reported separately from infeasibility.',
  'method.recovery.p2':
    'When no plan fits, Avenra names the blocking prerequisite chain, credit shortfall, or weekly time budget limit, and tests the smallest longer plan, higher personal credit limit (within your time budget), or reduced goal hours that would work.',
  'method.recovery.p3':
    'Scenario setbacks and scenario IPS values apply only inside that plan. They do not overwrite the shared academic profile.',
  'method.learning.heading': 'Learning support',
  'method.learning.p1':
    'Study targets can be linked to a course, a goal, or both, and open targets with due dates export to a calendar file (.ics) with reminders. Focus sessions track time spent on a course; time spent is not a measure of comprehension, and completing a task never marks an academic course as passed.',
  'method.privacy.heading': 'Privacy and boundaries',
  'method.privacy.p1':
    'Workspaces are scoped by a browser-held identifier. This prototype has no sign-in or verified identity: workspace separation is not authentication. Use aliases and non-sensitive examples. Public multi-user deployment requires authentication, authorization, and further privacy review. Clearing browser storage may remove the workspace selector; it does not delete database records.',
  'method.privacy.p2':
    'Exceptions, transfer credit, equivalent courses, and internship conversion are not modeled. The IPS rule applies only to next semester because later grades are unknown. Discuss a Decision Passport with an authorized academic advisor.',
  'method.tech.heading': 'Technology and attribution',
  'method.tech.p1':
    'SvelteKit, Svelte Flow, FastAPI, PostgreSQL, SQLAlchemy, and Google OR-Tools. OpenAI Codex materially assisted with implementation, tests, and documentation. Team members remain responsible for reviewing and understanding the work.',
} as const;
