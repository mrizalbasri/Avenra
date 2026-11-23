import { describe, expect, it } from 'vitest';
import { tasksToIcs } from './calendar.js';
import type { Task } from './types.js';

describe('calendar export', () => {
  it('exports both course tasks and goal-only tasks with start plans and reminders', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        course_code: 'IF2101',
        goal_id: null,
        title: 'Finish exercises',
        due_date: '2026-12-01',
        start_date: '2026-11-29',
        first_step: 'Open sheet and solve #1 (10 min)',
        details: ['Submit PDF on LMS'],
        done: false,
        revision: 1,
      },
      {
        id: 't2',
        course_code: null,
        goal_id: 'bem',
        title: 'BEM event proposal',
        due_date: '2026-12-03',
        start_date: null,
        first_step: null,
        details: [],
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
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('SUMMARY:Start: IF2101 | Finish exercises');
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20261129');
    expect(unfolded).toContain('First step: Open sheet and solve #1');
    expect(unfolded).toContain('SUMMARY:IF2101 | Finish exercises');
    expect(unfolded).toContain('DESCRIPTION:Study target for Algorithms.');
    expect(unfolded).toContain('SUMMARY:BEM | BEM event proposal');
    expect(unfolded).toContain('DESCRIPTION:Goal target for BEM.');
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20261203');
  });
});
