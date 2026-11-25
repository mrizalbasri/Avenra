import { formatHours, semesterHours } from '#lib/goals.js';
import type { Translate } from '#lib/i18n/index.js';
import type { Messages } from '#lib/i18n/messages.js';
import type { Curriculum, Plan, Profile } from '#lib/types.js';

export function buildAdvisorSummary(
  plan: Plan,
  profile: Profile,
  curriculum: Curriculum,
  t: Translate,
  msg: Messages,
  studentNotes = '',
): string {
  const v = plan.validation;
  const lines: string[] = [];
  lines.push(`${t('passport.name')} | ${plan.name}`);
  lines.push(
    `${t('passport.alias')}: ${profile.alias} | ${t('passport.curriculum')}: ${curriculum.name} (${curriculum.version})`,
  );
  lines.push(
    t('passport.snapshot_value', {
      plan: plan.revision,
      profile: profile.revision,
    }),
  );
  lines.push('');

  lines.push(
    t('passport.credits', {
      completed: v.completed_credits,
      planned: v.planned_credits,
      total: v.graduation_credits,
      peak: v.peak_credits,
      completion: v.completion_term
        ? t('plan.change_semester', { term: v.completion_term })
        : t('passport.unresolved'),
    }),
  );
  const ipsNote =
    v.planning_gpa !== null
      ? t('passport.ips_used', {
          term: profile.current_term,
          gpa: v.planning_gpa.toFixed(2),
        })
      : '';
  lines.push(
    t('passport.setbacks', {
      list: plan.failed.join(', ') || t('passport.none'),
      ips: ipsNote,
    }),
  );

  if (profile.mission || profile.goals.length || profile.time_budget) {
    lines.push('');
    lines.push(`${t('passport.mission_section')}:`);
    if (profile.mission) lines.push(`- ${profile.mission}`);
    if (profile.time_budget) {
      lines.push(
        `- ${t('passport.budget_line', {
          hours: formatHours(profile.time_budget.available_hours),
          minutes: profile.time_budget.minutes_per_credit,
        })}`,
      );
    }
    for (const goal of profile.goals) {
      const range =
        goal.start_term === goal.end_term
          ? t('overview.mission.range_single', { term: goal.start_term })
          : t('overview.mission.range_multi', {
              start: goal.start_term,
              end: goal.end_term,
            });
      lines.push(
        `- ${goal.title} (${t('overview.mission.goal_meta', {
          kind: t(`goals.kind_${goal.kind}` as 'goals.kind_internship'),
          range,
          hours: formatHours(goal.weekly_hours),
        })})`,
      );
    }
  }

  lines.push('');
  lines.push(`${t('passport.plan')}:`);
  for (const [termKey, credits] of Object.entries(v.loads)) {
    const term = Number(termKey);
    const list = curriculum.courses
      .filter(
        (c) =>
          plan.assignments[c.code] === term &&
          (!profile.completed.includes(c.code) || plan.failed.includes(c.code)),
      )
      .map((c) => `${c.code} ${c.name}`)
      .join(', ');
    let hoursSuffix = '';
    if (profile.time_budget) {
      const h = semesterHours(
        credits,
        profile.goals,
        term,
        profile.time_budget,
      );
      hoursSuffix = ` | ${
        h.over
          ? t('passport.hours_over', {
              total: formatHours(h.totalHours),
              available: formatHours(h.availableHours),
            })
          : t('passport.hours_cell', {
              total: formatHours(h.totalHours),
              available: formatHours(h.availableHours),
            })
      }`;
    }
    const loadText = t('plan.load', { load: credits, cap: v.caps[termKey] });
    lines.push(
      `- ${t('common.semester', { term })} (${loadText}${hoursSuffix}): ${list || t('passport.no_courses')}`,
    );
  }

  if (plan.bottlenecks.length) {
    lines.push('');
    lines.push(`${t('passport.affected')}:`);
    for (const blocker of plan.bottlenecks) {
      lines.push(`- ${blocker.path.join(' → ')}`);
    }
  }

  if (v.findings.length) {
    lines.push('');
    lines.push(`${t('passport.rules')}:`);
    for (const finding of v.findings) {
      lines.push(
        `- [${msg.ruleLabel(finding.rule)}] ${msg.describe('finding', finding)}`,
      );
    }
  }

  if (studentNotes.trim()) {
    lines.push('');
    lines.push(`${t('passport.student_notes')}:`);
    lines.push(studentNotes.trim());
  }

  if (v.advisor_items.length) {
    lines.push('');
    lines.push(`${t('passport.questions')}:`);
    v.advisor_items.forEach((item, index) => {
      lines.push(`${index + 1}. ${msg.describe('advisor', item)}`);
    });
  }

  lines.push('');
  lines.push(msg.disclaimer(curriculum));
  return lines.join('\n');
}

export function buildComparisonSummary(
  left: Plan,
  right: Plan,
  profile: Profile,
  curriculum: Curriculum,
  t: Translate,
  msg: Messages,
  studentNotes = '',
): string {
  const lines: string[] = [];
  lines.push(`${t('compare.print_heading')} | ${left.name} vs ${right.name}`);
  lines.push(
    `${t('passport.alias')}: ${profile.alias} | ${t('passport.curriculum')}: ${curriculum.name} (${curriculum.version})`,
  );
  lines.push('');

  for (const plan of [left, right]) {
    const v = plan.validation;
    const finish = v.completion_term
      ? t('common.semester', { term: v.completion_term })
      : t('compare.unresolved');
    const peak = t('compare.credits_n', { count: v.peak_credits });
    const status = v.findings.length
      ? t('compare.findings', { count: v.findings.length })
      : t('plan.valid');
    lines.push(
      `- ${plan.name}: ${finish} | ${t('compare.peak')}: ${peak} | ${status}`,
    );
  }

  const terms = [
    ...new Set([
      ...Object.keys(left.validation.loads).map(Number),
      ...Object.keys(right.validation.loads).map(Number),
    ]),
  ].sort((a, b) => a - b);

  if (terms.length) {
    lines.push('');
    lines.push(`${t('compare.workload_heading')}:`);
    for (const term of terms) {
      const key = String(term);
      const aLoad = left.validation.loads[key] ?? 0;
      const bLoad = right.validation.loads[key] ?? 0;
      const aCap = left.validation.caps[key];
      const bCap = right.validation.caps[key];
      const aText =
        aCap !== undefined
          ? t('compare.load_cell', { credits: aLoad, cap: aCap })
          : t('compare.credits_n', { count: aLoad });
      const bText =
        bCap !== undefined
          ? t('compare.load_cell', { credits: bLoad, cap: bCap })
          : t('compare.credits_n', { count: bLoad });
      const delta = bLoad - aLoad;
      const deltaText =
        delta === 0
          ? t('compare.same_load')
          : t('compare.delta_credits', {
              sign: delta > 0 ? '+' : '',
              count: delta,
            });
      lines.push(
        `- ${t('common.semester', { term })}: ${aText} vs ${bText} (${deltaText})`,
      );
    }
  }

  const stateLabel = (code: string, plan: Plan, category: string) => {
    if (profile.completed.includes(code) && !plan.failed.includes(code)) {
      return t('compare.completed');
    }
    const term = plan.assignments[code];
    if (term) return t('common.semester', { term });
    return category === 'elective'
      ? t('compare.not_chosen')
      : t('compare.unscheduled');
  };

  const diffs = curriculum.courses.filter((course) => {
    const aDone =
      profile.completed.includes(course.code) &&
      !left.failed.includes(course.code);
    const bDone =
      profile.completed.includes(course.code) &&
      !right.failed.includes(course.code);
    const aTerm = aDone ? 'completed' : (left.assignments[course.code] ?? null);
    const bTerm = bDone
      ? 'completed'
      : (right.assignments[course.code] ?? null);
    return (
      aTerm !== bTerm ||
      left.failed.includes(course.code) !== right.failed.includes(course.code)
    );
  });

  if (diffs.length) {
    lines.push('');
    lines.push(`${t('compare.differences')}:`);
    for (const course of diffs) {
      lines.push(
        `- ${course.code} ${course.name}: ${stateLabel(course.code, left, course.category)} | ${stateLabel(course.code, right, course.category)}`,
      );
    }
  }

  if (studentNotes.trim()) {
    lines.push('');
    lines.push(`${t('passport.student_notes')}:`);
    lines.push(studentNotes.trim());
  }

  lines.push('');
  lines.push(msg.disclaimer(curriculum));
  return lines.join('\n');
}
