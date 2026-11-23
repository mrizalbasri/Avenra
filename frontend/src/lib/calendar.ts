import type { Task } from '#lib/types.js';

const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// Content lines longer than 75 octets must be folded (RFC 5545).
function fold(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length ? 74 : 75;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else current += char;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const compactDate = (iso: string) => iso.replaceAll('-', '');

function nextDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return date.toISOString().slice(0, 10);
}

export type CalendarText = {
  withCourse: (course: string) => string;
  withGoal?: (goal: string) => string;
  withBoth?: (course: string, goal: string) => string;
  startPrefix?: string;
  firstStepLabel?: (step: string) => string;
  plain: string;
};

/** Builds all-day calendar events per open target (due date + optional planned start date). */
export function tasksToIcs(
  tasks: Task[],
  courseNames: Record<string, string>,
  now = new Date(),
  text: CalendarText = {
    withCourse: (course: string) =>
      `Study target for ${course}. Added from Avenra.`,
    withGoal: (goal: string) => `Goal target for ${goal}. Added from Avenra.`,
    withBoth: (course: string, goal: string) =>
      `Target for ${course} (${goal}). Added from Avenra.`,
    startPrefix: 'Start',
    firstStepLabel: (step: string) => `First step: ${step}`,
    plain: 'Added from Avenra.',
  },
  goalNames: Record<string, string> = {},
) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Avenra//Study targets//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const task of tasks) {
    if (task.done || (!task.due_date && !task.start_date)) continue;
    const course = task.course_code ? courseNames[task.course_code] : undefined;
    const goal = task.goal_id ? goalNames[task.goal_id] : undefined;
    const label = [task.course_code, goal].filter(Boolean).join(' | ');
    const summary = label ? `${label} | ${task.title}` : task.title;
    const baseDescription =
      course && goal && text.withBoth
        ? text.withBoth(course, goal)
        : course
          ? text.withCourse(course)
          : goal && text.withGoal
            ? text.withGoal(goal)
            : text.plain;
    const extraParts: string[] = [];
    if (task.first_step) {
      extraParts.push(
        text.firstStepLabel
          ? text.firstStepLabel(task.first_step)
          : `First step: ${task.first_step}`,
      );
    }
    if (task.details?.length) {
      extraParts.push(task.details.map((d) => `- ${d}`).join('\n'));
    }
    const description = [baseDescription, ...extraParts].join('\n');

    if (task.start_date && task.start_date !== task.due_date) {
      const startSummary = `${text.startPrefix ?? 'Start'}: ${summary}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${task.id}-start@avenra`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compactDate(task.start_date)}`,
        `DTEND;VALUE=DATE:${compactDate(nextDay(task.start_date))}`,
        `SUMMARY:${escapeText(startSummary)}`,
        `DESCRIPTION:${escapeText(description)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(task.first_step || task.title)}`,
        'TRIGGER:PT9H',
        'END:VALARM',
        'END:VEVENT',
      );
    }

    if (task.due_date) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${task.id}@avenra`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compactDate(task.due_date)}`,
        `DTEND;VALUE=DATE:${compactDate(nextDay(task.due_date))}`,
        `SUMMARY:${escapeText(summary)}`,
        `DESCRIPTION:${escapeText(description)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(task.title)}`,
        // Relative to local midnight of the all-day due date.
        'TRIGGER:-PT5H',
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(content: string, filename = 'avenra-study.ics') {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/calendar;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
