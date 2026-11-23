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

/** Builds an all-day calendar event per open target, with a reminder at 19:00 the day before. */
export function tasksToIcs(
  tasks: Task[],
  courseNames: Record<string, string>,
  now = new Date(),
  text = {
    withCourse: (course: string) =>
      `Study target for ${course}. Added from Avenra.`,
    plain: 'Added from Avenra.',
  },
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
    if (!task.due_date || task.done) continue;
    const course = task.course_code ? courseNames[task.course_code] : undefined;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@avenra`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(task.due_date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(task.due_date))}`,
      `SUMMARY:${escapeText(task.course_code ? `${task.course_code} | ${task.title}` : task.title)}`,
      `DESCRIPTION:${escapeText(course ? text.withCourse(course) : text.plain)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(task.title)}`,
      // Relative to local midnight of the all-day due date.
      'TRIGGER:-PT5H',
      'END:VALARM',
      'END:VEVENT',
    );
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
  URL.revokeObjectURL(url);
}
