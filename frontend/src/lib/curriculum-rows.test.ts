import { describe, expect, it } from 'vitest';
import {
  checkCourseRows,
  checkPassed,
  courseToRow,
  emptyRow,
  rowsToCourses,
  type CourseRow,
} from './curriculum-import.js';

const row = (overrides: Partial<CourseRow>): CourseRow => ({
  ...emptyRow(),
  ...overrides,
});

const rows = (): CourseRow[] => [
  row({ code: 'A1', name: 'Basics', credits: '3', recommended_term: '1' }),
  row({
    code: 'B1',
    name: 'Next',
    credits: '3',
    recommended_term: '2',
    prerequisites: 'A1',
  }),
];

describe('checkCourseRows', () => {
  it('accepts clean rows', () => {
    expect(checkCourseRows(rows())).toEqual([]);
  });

  it('numbers rows from 1 and reports an edited bad value', () => {
    const edited = rows();
    edited[1].credits = 'abc';
    const issues = checkCourseRows(edited);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      row: 2,
      field: 'credits',
      code: 'BAD_CREDITS',
      params: { row: 2, value: 'abc' },
    });
  });

  it('reports a duplicate made by editing a code', () => {
    const edited = rows();
    edited[1].code = 'A1';
    expect(checkCourseRows(edited).map((i) => i.code)).toContain(
      'DUPLICATE_CODE',
    );
  });

  it('reports a prerequisite whose course was removed', () => {
    const edited = rows().slice(1);
    expect(checkCourseRows(edited)[0]).toMatchObject({
      row: 1,
      code: 'UNKNOWN_REFERENCE',
      params: { code: 'B1', ref: 'A1' },
    });
  });

  it('needs 1 to 100 rows', () => {
    expect(checkCourseRows([]).map((i) => i.code)).toEqual(['ROW_COUNT']);
    const many = Array.from({ length: 101 }, (_, i) =>
      row({ code: `C${i}`, name: 'x', credits: '2', recommended_term: '1' }),
    );
    expect(checkCourseRows(many).map((i) => i.code)).toContain('ROW_COUNT');
  });
});

describe('rowsToCourses and courseToRow', () => {
  it('round-trips a course with either-or prerequisites', () => {
    const course = {
      code: 'C1',
      name: 'Topic',
      credits: 2,
      recommended_term: 5,
      category: 'elective' as const,
      prerequisites: ['A1'],
      any_prerequisites: [['B1', 'B2']],
      corequisites: ['B3'],
      min_credits_earned: 100,
      offered_terms: [0],
    };
    expect(rowsToCourses([courseToRow(course)])).toEqual([course]);
  });

  it('turns edited text into numbers and lists', () => {
    expect(rowsToCourses(rows())[1]).toMatchObject({
      credits: 3,
      recommended_term: 2,
      category: 'required',
      prerequisites: ['A1'],
      offered_terms: [0, 1],
    });
  });
});

describe('checkPassed', () => {
  const courses = rowsToCourses([
    row({ code: 'A1', name: 'a', credits: '3', recommended_term: '1' }),
    row({ code: 'A2', name: 'b', credits: '3', recommended_term: '1' }),
    row({
      code: 'B1',
      name: 'c',
      credits: '3',
      recommended_term: '2',
      prerequisites: 'A1|A2',
    }),
    row({
      code: 'B2',
      name: 'd',
      credits: '3',
      recommended_term: '2',
      prerequisites: 'A1',
      corequisites: 'B1',
    }),
  ]);

  it('lists a passed course whose prerequisite is not passed', () => {
    expect(checkPassed(courses, ['B2', 'B1', 'A2'])).toEqual([
      { course: 'B2', missing: ['A1'] },
    ]);
  });

  it('accepts one option of an either-or group', () => {
    expect(checkPassed(courses, ['A2', 'B1'])).toEqual([]);
  });

  it('reports an unmet either-or group and a corequisite', () => {
    expect(checkPassed(courses, ['A1', 'B2'])).toEqual([
      { course: 'B2', missing: ['B1'] },
    ]);
    expect(checkPassed(courses, ['B1'])).toEqual([
      { course: 'B1', missing: [['A1', 'A2']] },
    ]);
  });
});
