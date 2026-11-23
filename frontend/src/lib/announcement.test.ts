import { describe, expect, it } from 'vitest';
import { parseAnnouncement } from './announcement.js';
import type { Course, Goal } from './types.js';

const courses: Course[] = [
  {
    code: 'IF2101',
    name: 'Data Structures',
    credits: 4,
    recommended_term: 3,
    category: 'required',
    prerequisites: [],
    any_prerequisites: [],
    corequisites: [],
    min_credits_earned: 0,
    offered_terms: [0, 1],
  },
  {
    code: 'IF2102',
    name: 'Basis Data',
    credits: 3,
    recommended_term: 3,
    category: 'required',
    prerequisites: [],
    any_prerequisites: [],
    corequisites: [],
    min_credits_earned: 0,
    offered_terms: [0, 1],
  },
];

const goals: Goal[] = [
  {
    id: 'bem',
    title: 'BEM',
    kind: 'organisation',
    start_term: 3,
    end_term: 4,
    weekly_hours: 8,
  },
];

const today = new Date(2026, 10, 23); // Monday, 2026-11-23

describe('parseAnnouncement', () => {
  it('extracts Indonesian class announcement with course code, date, time, bullets, and start plan', () => {
    const raw = `[Pengumuman] Tugas IF2101: Implementasi BST dengan Python.
- Kumpulkan PDF laporan dan kode sumber di LMS
- Dikerjakan secara individu
Deadline: 3 Des 2026 pukul 23:59 WIB`;
    const result = parseAnnouncement(raw, courses, goals, today, 'id');
    expect(result.course_code).toBe('IF2101');
    expect(result.goal_id).toBeNull();
    expect(result.title).toContain('Tugas IF2101');
    expect(result.due_date).toBe('2026-12-03');
    expect(result.due_time).toBe('23:59 WIB');
    expect(result.start_date).toBe('2026-12-01');
    expect(result.first_step).toContain('10 menit');
    expect(result.details.some((d) => d.includes('23:59 WIB'))).toBe(true);
    expect(result.details.some((d) => d.includes('PDF'))).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('matches course name and relative date (besok)', () => {
    const raw =
      'Info: Latihan normalisasi Basis Data dikumpulkan besok jam 17:00 di Google Classroom.';
    const result = parseAnnouncement(raw, courses, goals, today, 'id');
    expect(result.course_code).toBe('IF2102');
    expect(result.due_date).toBe('2026-11-24');
    expect(result.start_date).toBe('2026-11-23');
    expect(result.due_time).toBe('17:00');
  });

  it('matches workspace goal and English month date', () => {
    const raw =
      'Reminder: BEM sponsorship proposal draft due Dec 5, 2026 in PDF format (group task).';
    const result = parseAnnouncement(raw, courses, goals, today, 'en');
    expect(result.course_code).toBeNull();
    expect(result.goal_id).toBe('bem');
    expect(result.due_date).toBe('2026-12-05');
    expect(result.start_date).toBe('2026-12-03');
    expect(result.first_step).toContain('outline');
    expect(result.details.some((d) => d.includes('Group task'))).toBe(true);
  });

  it('flags warnings when target or due date cannot be detected', () => {
    const result = parseAnnouncement(
      'Baca bab 4 minggu ini.',
      courses,
      goals,
      today,
      'id',
    );
    expect(result.warnings).toEqual(['NO_TARGET', 'NO_DUE_DATE']);
    expect(result.start_date).toBe('2026-11-23');
  });
});
