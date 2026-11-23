// Messages for the plan editor, Decision Passport, comparison and backend results.
// Text rendered from backend `code` + `params` mirrors the English `message` the API
// sends, so English users see the same words either way.
export const enPlan = {
  'common.semester': 'Semester {term}',
  'list.or': ' or ',
  'parity.odd': 'odd',
  'parity.even': 'even',
  'status.feasible': 'feasible',
  'status.infeasible': 'infeasible',
  'status.timeout': 'timeout',
  'status.unverified': 'unverified',
  'status.complete': 'complete',

  // Rule labels (tags next to findings and diagnosis reasons)
  'rule.UNSCHEDULED': 'UNSCHEDULED',
  'rule.STUDY_PERIOD': 'STUDY PERIOD',
  'rule.TERM_RANGE': 'TERM RANGE',
  'rule.RETAKE': 'RETAKE',
  'rule.OFFERING': 'OFFERING',
  'rule.PREREQUISITE': 'PREREQUISITE',
  'rule.ANY_PREREQUISITE': 'ANY PREREQUISITE',
  'rule.COREQUISITE': 'COREQUISITE',
  'rule.CREDITS_EARNED': 'CREDITS EARNED',
  'rule.CREDIT_CAP': 'CREDIT CAP',
  'rule.GRADUATION_CREDITS': 'GRADUATION CREDITS',
  'rule.PREREQUISITE_CHAIN': 'PREREQUISITE CHAIN',
  'rule.CAPACITY': 'CAPACITY',
  'rule.GPA_CREDIT_LIMIT': 'GPA CREDIT LIMIT',
  'rule.TIME_BUDGET': 'TIME BUDGET',
  'rule.COMBINED': 'COMBINED',

  // Findings
  'finding.UNSCHEDULED': '{course} {name} has not been scheduled.',
  'finding.STUDY_PERIOD':
    '{course} is placed in semester {term}, beyond the maximum study period of {max_terms} semesters.',
  'finding.TERM_RANGE': '{course} must be between semesters {start} and {end}.',
  'finding.RETAKE':
    '{course} fails in semester {current} in this scenario, so it can be retaken from semester {next}.',
  'finding.OFFERING':
    '{course} is offered only in {parity} semesters, not semester {term}.',
  'finding.PREREQUISITE': 'Complete {prerequisite} before taking {course}.',
  'finding.ANY_PREREQUISITE':
    'Complete one of {options} before taking {course}.',
  'finding.COREQUISITE':
    'Take {corequisite} in the same semester as {course} or earlier.',
  'finding.CREDITS_EARNED':
    '{course} needs {required} earned credits before semester {term}; this plan reaches {earned}.',
  'finding.CREDIT_CAP':
    'Semester {term} has {credits} credits; the limit is {cap} under {reason}.',
  'finding.GRADUATION_CREDITS':
    'This plan reaches {reached} of {target} graduation credits. Add {missing} more credits, for example from electives.',
  'cap.IPS_RULE': 'the IPS {gpa} rule',
  'cap.TIME_BUDGET': 'your weekly time budget ({hours} h left for courses)',
  'cap.CURRICULUM_MAX': 'the curriculum maximum',
  'cap.PLAN_LIMIT': 'your plan limit',

  // Diagnosis
  'diag.CREDIT_CAP':
    '{course} has {credits} credits, more than any semester allows ({cap}).',
  'diag.PREREQUISITE_CHAIN':
    '{course} cannot start before semester {start} because of the chain {chain} and the odd/even calendar. The plan ends at semester {end}.',
  'diag.CAPACITY':
    'You still need {needed} credits, but semesters {from} to {to} allow at most {capacity}.',
  'diag.GPA_CREDIT_LIMIT':
    'The IPS {gpa} limit of {cap} credits in semester {term} is part of the conflict.',
  'diag.TIME_BUDGET':
    'Your weekly time budget limits semester {term} to {cap} credits ({hours} h left for courses).',
  'diag.COMBINED':
    'The modeled rules conflict only in combination, for example corequisites, earned-credit thresholds, and credit limits together.',
  'suggest.HORIZON': 'Extend the plan to semester {term}.',
  'suggest.CREDIT_CAP': 'Raise your own credit limit to {cap} credits.',
  'suggest.GOAL_HOURS':
    'Reduce {goal} hours in semester {term} to {hours} h/week.',
  'suggest.GOAL_HOURS_RANGE':
    'Reduce {goal} hours in semesters {start_term}-{end_term} to {hours} h/week.',

  // Solve outcomes and alternatives
  'solve.COMPLETE': 'All modeled requirements are already complete.',
  'solve.PLAN_ENDS_EARLY':
    'The plan ends before the current semester or beyond the maximum study period.',
  'solve.FOUND.one': 'Found {count} distinct, independently checked plan.',
  'solve.FOUND.other': 'Found {count} distinct, independently checked plans.',
  'solve.note.timeout':
    ' The second option hit the time limit, so another arrangement may exist.',
  'solve.note.single': ' No second valid arrangement differs from this one.',
  'solve.TIMEOUT':
    'Time limit reached without a plan. This does not prove infeasibility.',
  'solve.UNVERIFIED':
    'A generated plan failed the independent rule check, so it is not shown. Please report this case.',
  'solve.INFEASIBLE':
    'No plan satisfies every modeled rule. The reasons and the smallest changes that would help are listed below.',
  'alt.EARLIER_COMPLETION': 'Earlier completion',
  'alt.LIGHTER_PEAK': 'Lighter peak workload',
  'alt.summary':
    'Finishes in semester {finish} with at most {peak} credits in one semester.',
  'alt.compare': ' Compared with {against}: finishes {timing}, {load}.',
  'alt.later.one': '{count} semester later',
  'alt.later.other': '{count} semesters later',
  'alt.earlier.one': '{count} semester earlier',
  'alt.earlier.other': '{count} semesters earlier',
  'alt.same_time': 'at the same time',
  'alt.lighter': '{count} fewer credits at peak',
  'alt.heavier': '{count} more credits at peak',
  'alt.same_load': 'the same peak load',

  // Advisor questions and assumptions
  'advisor.RETAKE':
    'Can I retake {course} {name} in semester {term}, and is it still offered on that calendar?',
  'advisor.IPS_LIMIT':
    'With an IPS of {gpa}, is my limit for semester {term} really {cap} credits?',
  'advisor.OPEN_ISSUES':
    'This plan still has {names} issues. Is there an exception or a better arrangement?',
  'advisor.ELECTIVES':
    'Do the electives in this plan count toward my graduation requirement and concentration?',
  'advisor.LATE_FINISH':
    'Finishing in semester {term} is later than 8 semesters. Does this affect my tuition (UKT), scholarship, or study period limit?',
  'advisor.ACCURACY':
    'Are the prerequisites and offerings used here accurate for my intake year?',
  'assume.DISCLAIMER': '{text}',
  'assume.RULE_SOURCE': 'Rule source: {source}',
  'assume.IPS_MISSING':
    'No IPS was entered, so the IPS credit rule is not applied.',
  'assume.IPS_RULE':
    'The IPS credit rule uses {gpa} for semester {term} only. Later semesters assume up to {cap} credits.',
  'assume.OFFERINGS':
    'Offerings follow the stated odd/even calendar. Exceptions, transfer credit, and internship conversion are not modeled.',
  'assume.TIME_BUDGET':
    'Weekly time budget uses {available} h/week available at {minutes_per_credit} minutes per SKS per week (default 170: 50 class + 60 structured + 60 independent).',
  'disclaimer.synthetic':
    'Demonstration assumptions only. Not an official university curriculum or graduation decision.',
  'disclaimer.user_supplied':
    'User-supplied curriculum. Verify rules with your university.',

  // API errors
  'error.NETWORK':
    'Cannot reach the API. Your changes have not been saved. Retry when the service is available.',
  'error.INVALID_INPUT': 'Check the input fields and try again.',
  'error.PROFILE_NOT_FOUND': 'Open the synthetic demo workspace first.',
  'error.PLAN_NOT_FOUND': 'Plan not found.',
  'error.UNKNOWN_COURSES':
    'Use unique course codes from the selected curriculum.',
  'error.TERM_OUT_OF_RANGE':
    'Semester assignments must be between 1 and {max}.',
  'error.PROGRESS_ISSUES':
    'Some completed courses are missing their prerequisites: {issues}. Mark the prerequisites as completed, or ask your advisor about an exemption.',
  'error.issue': '{course} needs {missing}',
  'error.PROFILE_CONFLICT':
    'The profile changed in another tab. Reload before saving.',
  'error.PROFILE_CHANGED':
    'The academic profile changed. Reload before saving this plan.',
  'error.HORIZON_BEFORE_CURRENT':
    'The planning horizon cannot end before the current semester.',
  'error.PLAN_CONFLICT':
    'This plan changed in another tab. Reload before saving your draft.',
  'error.SOLVE_CONFLICT':
    'The source plan or profile changed. Reload before generating alternatives.',
  'error.TASK_CONFLICT': 'Task changed. Reload before trying again.',
  'error.SESSION_NOT_FOUND': 'Session not found',
  'error.WORKSPACE_EXISTS':
    'Choose a new workspace for a different curriculum.',
  'error.GOAL_TERM_RANGE':
    'Goal semesters must be within the maximum study period of {max} semesters.',
  'error.UNKNOWN_GOAL': 'Choose a goal from this workspace.',

  // Course requirement text (lib/rules.ts)
  'req.prerequisites': 'Prerequisites: {list}',
  'req.any_of': 'One of: {list}',
  'req.corequisites': 'Same semester or earlier: {list}',
  'req.min_credits': 'Needs {count} earned credits first',
  'req.none': 'No prerequisites',
  'offer.every': 'Every semester',
  'offer.odd': 'Odd semesters only',
  'offer.even': 'Even semesters only',
  'course.elective': 'Elective',
  'course.required': 'Required',

  // Canvas nodes
  'node.elective': 'Elective | ',
  'node.credits_short': '{count} cr',
  'node.retake': 'Retake in this scenario',
  'node.review': 'Review rule findings',
  'node.planned': 'Planned course',
  'node.semester_credits': '{credits} / {cap} credits',
  'node.semester_hours': '{total} / {available} h',
  'node.semester_hours_split': '{total} / {available} h ({course} + {goal} h)',

  // Plan editor
  'plan.title': 'Avenra | {name}',
  'plan.rev': 'Rev {revision} | {state} | {version}',
  'plan.unsaved': 'Unsaved changes',
  'plan.saved': 'Saved to PostgreSQL',
  'plan.passport': 'Passport',
  'plan.passport_blocked':
    'Save your draft before opening its Decision Passport.',
  'plan.saving': 'Saving…',
  'plan.save': 'Save & validate',
  'plan.dismiss': 'Dismiss',
  'plan.draft_available': 'An unsaved browser draft is available.',
  'plan.restore': 'Restore draft',
  'plan.discard': 'Discard draft',
  'plan.needs_check': 'Changes need checking',
  'plan.findings.one': '{count} rule finding',
  'plan.findings.other': '{count} rule findings',
  'plan.valid': 'Valid under modeled assumptions',
  'plan.credits_planned': '{done} / {total} credits planned',
  'plan.completion': 'Modeled completion: semester {term}',
  'plan.explore': 'Explore your semester assignments',
  'plan.view.canvas': 'Canvas',
  'plan.view.board': 'Semester board',
  'plan.undo': 'Undo',
  'plan.redo': 'Redo',
  'plan.load': '{load} / {cap} cr',
  'plan.course_meta': '{code} | {credits} credits',
  'plan.move_label': 'Move {code} to semester',
  'plan.unscheduled': 'Unscheduled',
  'plan.drop_hint': 'Drop a course here',
  'plan.hint':
    'Move a course across semester frames to reschedule it. Select a course for details or keyboard-friendly movement.',
  'plan.required_off': 'Required courses unscheduled or outside the plan',
  'plan.elective_pool': 'Elective pool',
  'plan.elective_hint':
    'Optional. Select one to schedule it when you need more credits.',
  'plan.elective_chip': '{code} | {name} | {credits} cr',
  'plan.tools': 'Plan tools',
  'plan.settings': 'Plan settings',
  'plan.name': 'Plan name',
  'plan.credit_limit': 'Credit limit',
  'plan.last_semester': 'Last semester',
  'plan.limit_note':
    'Semester {term} limit: {cap} credits{ips}. Maximum study period: {max} semesters.',
  'plan.limit_ips': ' (IPS {gpa})',
  'plan.course_details': 'Course details',
  'plan.course_line': '{code} | {credits} credits | {category} | {offering}',
  'plan.assigned': 'Assigned semester',
  'plan.study_goal': 'Create a study goal',
  'plan.select_hint':
    'Select a card on the canvas or board to inspect its prerequisites and move it.',
  'plan.setback': 'Simulate a setback',
  'plan.setback_hint':
    'Mark a course you might fail this semester, or a passed course you must retake. Your profile stays unchanged.',
  'plan.this_semester': 'This semester',
  'plan.none_this_semester': 'No courses planned for this semester.',
  'plan.retake_passed': 'Passed courses to retake',
  'plan.expected_ips': 'Expected IPS after this setback',
  'plan.ips_placeholder': 'e.g. 2.40',
  'plan.ips_hint':
    "A lower IPS can reduce next semester's credit limit. Leave empty to use your profile IPS.",
  'plan.recovery': 'Find a recovery route',
  'plan.recovery_hint':
    'Compare earlier completion with a lighter peak workload under the demo rules.',
  'plan.finding_alternatives': 'Finding alternatives…',
  'plan.generate': 'Generate alternatives',
  'plan.save_first': 'Save your changes first.',
  'plan.archive': 'Archive this plan',
  'plan.archive_hint': 'Archived plans remain recoverable from Study plans.',
  'plan.results': 'Recovery alternatives',
  'plan.why_none': 'Why no plan fits',
  'plan.smallest': 'Smallest changes that work',
  'plan.no_suggestion':
    'No change to the plan length or your own credit limit is enough. Discuss the conflicting rules with your academic advisor.',
  'plan.optimal': 'Optimal for this modeled objective.',
  'plan.feasible': 'Feasible result found within the time limit.',
  'plan.checked': ' Independently checked.',
  'plan.changes.one': '{count} change from your plan',
  'plan.changes.other': '{count} changes from your plan',
  'plan.change_line': '{code} {name}: {from} | {to}',
  'plan.change_semester': 'semester {term}',
  'plan.change_none_from': 'not planned',
  'plan.change_none_to': 'left out',
  'plan.same_arrangement': 'Same arrangement as your saved plan.',
  'plan.keep': 'Save as a separate plan',
  'plan.checks': 'Rule checks & explanation',
  'plan.awaiting': 'Awaiting save',
  'plan.revision': 'Revision {revision}',
  'plan.dirty_note':
    'Save to check this draft. Findings below belong to the last saved revision.',
  'plan.all_pass': 'All modeled rules pass for the saved plan.',
  'plan.downstream': 'Downstream impact',
  'plan.source_note': '{assumptions} Source: {version}.',
  'plan.leave': 'You have an unsaved draft. Leave this page?',
  'plan.suggestion_applied':
    'Suggestion applied. Save & validate, then generate alternatives again.',
  'plan.saved_ok': 'Plan saved and checked against the modeled rules.',
  'plan.save_before_generate':
    'Save your scenario changes before generating alternatives.',
  'plan.draft_old':
    'This draft belongs to an older saved revision. Copy any notes before discarding it.',
  'plan.draft_invalid': 'This browser draft is not valid.',

  // Decision Passport
  'passport.title': 'Avenra | Decision Passport | {name}',
  'passport.heading': 'Take the conversation forward.',
  'passport.lead':
    'A saved plan snapshot for an informed discussion with your academic advisor.',
  'passport.print': 'Print / Save as PDF',
  'passport.brand_synthetic': 'SYNTHETIC DEMO | ADVISOR CONSULTATION',
  'passport.brand_own': 'USER-SUPPLIED CURRICULUM | ADVISOR CONSULTATION',
  'passport.name': 'Academic Decision Passport',
  'passport.alias': 'Student alias',
  'passport.snapshot': 'Snapshot',
  'passport.snapshot_value':
    'Plan revision {plan} | Profile revision {profile}',
  'passport.curriculum': 'Curriculum',
  'passport.generated': 'Generated',
  'passport.summary': 'Decision summary',
  'passport.findings_need.one': '{count} rule finding requires review.',
  'passport.findings_need.other': '{count} rule findings require review.',
  'passport.all_satisfied':
    'The saved plan satisfies the modeled rules under the listed assumptions.',
  'passport.credits':
    'Credits: {completed} completed + {planned} planned of {total} | Peak load: {peak} | Modeled completion: {completion}',
  'passport.unresolved': 'unresolved',
  'passport.setbacks': 'Scenario setbacks: {list}.{ips}',
  'passport.none': 'None',
  'passport.ips_used': ' IPS used for semester {term}: {gpa}.',
  'passport.plan': 'Proposed semester plan',
  'passport.col.semester': 'Semester',
  'passport.col.courses': 'Courses',
  'passport.col.credits': 'Credits',
  'passport.col.limit': 'Limit',
  'passport.no_courses': 'No courses scheduled',
  'passport.affected': 'Courses affected by the setback',
  'passport.rules': 'Rule findings',
  'passport.no_violations': 'No modeled violations in this saved snapshot.',
  'passport.questions': 'Questions for an academic advisor',
  'passport.sources': 'Sources, assumptions, and limits',
  'passport.source_line':
    'Source: {source} | {version}. Completed courses: {completed}. This is a planning aid, not enrollment authorization or a graduation determination.',

  // Compare plans
  'compare.title': 'Avenra | Compare plans',
  'compare.heading': 'See the trade-offs clearly.',
  'compare.lead':
    'Compare saved snapshots under the same academic profile and curriculum assumptions.',
  'compare.empty': 'Give yourself another option.',
  'compare.empty_hint':
    'Create or duplicate a second plan, then come back to compare the differences.',
  'compare.open_plans': 'Open study plans',
  'compare.plan_a': 'Plan A',
  'compare.plan_b': 'Plan B',
  'compare.findings.one': '{count} rule finding',
  'compare.findings.other': '{count} rule findings',
  'compare.completion': 'Modeled completion',
  'compare.unresolved': 'Unresolved',
  'compare.peak': 'Peak semester load',
  'compare.credits_n': '{count} credits',
  'compare.planned': 'Credits planned',
  'compare.your_limit': 'Your credit limit',
  'compare.ips': 'Scenario IPS',
  'compare.not_set': 'Not set',
  'compare.setbacks': 'Scenario setbacks',
  'compare.revision': 'Saved revision',
  'compare.edit': 'Edit this plan',
  'compare.differences': 'Course-by-course differences',
  'compare.course': 'Course',
  'compare.completed': 'Completed',
  'compare.not_chosen': 'Not chosen',
  'compare.unscheduled': 'Unscheduled',
  'compare.footnote':
    'Highlighted rows differ. Completion is conditional on the modeled demo rules, not a graduation guarantee.',
  'compare.choose_two': 'Choose two different plans.',
} as const;
