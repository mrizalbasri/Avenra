import { describe, expect, it } from 'vitest';
import { tasksToIcs } from './calendar.js';
import type { Task } from './types.js';

describe('calendar export', () => {
  it('exports both course tasks and goal-only tasks with reminders', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        course_code: 'IF2101',
        goal_id: null,
        title: 'Finish exercises',
        due_date: '2026-12-01',
        done: false,
        revision: 1,
      },
      {
        id: 't2',
        course_code: null,
        goal_id: 'bem',
        title: 'BEM event proposal',
        due_date: '2026-12-03',
        done: false,
        revision: 1,
      },
    ];
    const ics = tasksToIcs(
      tasks,
      { IF2101: 'Algorithms' },
      new Date('2026-11-23T00:00:00Z'),
      undefined,
      { bem: 'BEM' },
    );
    expect(ics).toContain('SUMMARY:IF2101 | Finish exercises');
    expect(ics).toContain('DESCRIPTION:Study target for Algorithms.');
    expect(ics).toContain('SUMMARY:BEM | BEM event proposal');
    expect(ics).toContain('DESCRIPTION:Goal target for BEM.');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261203');
  });
});
