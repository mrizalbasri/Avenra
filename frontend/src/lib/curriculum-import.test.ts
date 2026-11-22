import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCurriculumTable } from './curriculum-import.js';

const tsv = (rows: string[][]) => rows.map((r) => r.join('\t')).join('\n');
const HEAD = ['code', 'name', 'credits', 'recommended_term', 'prerequisites'];

const codes = (text: string) =>
  parseCurriculumTable(text).issues.map((i) => i.code);

describe('parseCurriculumTable', () => {
  it('reads a table pasted from Excel (tab separated)', () => {
    const result = parseCurriculumTable(
      tsv([
        HEAD,
        ['IF101', 'Programming fundamentals', '3', '1', ''],
        ['IF201', 'Data structures', '4', '2', 'IF101'],
      ]),
    );
    expect(result.delimiter).toBe('\t');
    expect(result.issues).toEqual([]);
    expect(result.courses).toHaveLength(2);
    expect(result.courses[1]).toMatchObject({
      code: 'IF201',
      name: 'Data structures',
      credits: 4,
      recommended_term: 2,
      category: 'required',
      prerequisites: ['IF101'],
      offered_terms: [0, 1],
    });
  });

  it('still parses the downloadable comma CSV template', () => {
    const template = readFileSync('static/curriculum-template.csv', 'utf8');
    const result = parseCurriculumTable(template);
    expect(result.delimiter).toBe(',');
    expect(result.issues).toEqual([]);
    expect(result.courses.length).toBeGreaterThan(3);
    const lab = result.courses.find((c) => c.code === 'IF102');
    expect(lab?.corequisites).toEqual(['IF101']);
    expect(lab?.offered_terms).toEqual([1]);
  });

  it('detects semicolon separated tables from regional spreadsheets', () => {
    const result = parseCurriculumTable(
      'kode;nama;sks;semester;prasyarat\nIF101;Dasar;3;1;\nIF201;Struktur;4;2;IF101',
    );
    expect(result.delimiter).toBe(';');
    expect(result.issues).toEqual([]);
    expect(result.courses.map((c) => c.code)).toEqual(['IF101', 'IF201']);
  });

  it('recognises Indonesian headers', () => {
    const result = parseCurriculumTable(
      tsv([
        [
          'Kode MK',
          'Nama Mata Kuliah',
          'SKS',
          'Smt',
          'Prasyarat',
          'Sifat',
          'Ditawarkan',
        ],
        ['IF101', 'Dasar Pemrograman', '3', '1', '-', 'Wajib', 'Ganjil'],
        ['IF390', 'Topik Khusus', '2', '5', 'IF101', 'Pilihan', 'Genap'],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.courses[0]).toMatchObject({
      category: 'required',
      offered_terms: [1],
      prerequisites: [],
    });
    expect(result.courses[1]).toMatchObject({
      category: 'elective',
      offered_terms: [0],
      prerequisites: ['IF101'],
    });
  });

  it('ignores blank lines and keeps commas inside quotes', () => {
    const result = parseCurriculumTable(
      `\n${HEAD.join(',')}\n\nIF101,"Logic, sets and proofs",3,1,\n\n`,
    );
    expect(result.issues).toEqual([]);
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].name).toBe('Logic, sets and proofs');
  });

  it('accepts credits written like "3 (2-1)"', () => {
    const result = parseCurriculumTable(
      tsv([HEAD, ['IF101', 'Dasar', '3 (2-1)', '1', '']]),
    );
    expect(result.issues).toEqual([]);
    expect(result.courses[0].credits).toBe(3);
  });

  it('reads either-or and list prerequisites', () => {
    const result = parseCurriculumTable(
      tsv([
        HEAD,
        ['A1', 'One', '2', '1', ''],
        ['A2', 'Two', '2', '1', ''],
        ['A3', 'Three', '2', '1', ''],
        ['B1', 'Four', '2', '2', 'A1;A2'],
        ['B2', 'Five', '2', '2', 'A1|A2'],
        ['B3', 'Six', '2', '2', 'A1 atau A3'],
        ['B4', 'Seven', '2', '3', 'A1, A2|A3'],
      ]),
    );
    expect(result.issues).toEqual([]);
    const by = (code: string) => result.courses.find((c) => c.code === code)!;
    expect(by('B1').prerequisites).toEqual(['A1', 'A2']);
    expect(by('B2')).toMatchObject({
      prerequisites: [],
      any_prerequisites: [['A1', 'A2']],
    });
    expect(by('B3').any_prerequisites).toEqual([['A1', 'A3']]);
    expect(by('B4')).toMatchObject({
      prerequisites: ['A1'],
      any_prerequisites: [['A2', 'A3']],
    });
  });

  it('reports every row problem at once and still returns the valid rows', () => {
    const result = parseCurriculumTable(
      tsv([
        HEAD,
        ['IF101', 'Dasar', 'three', '1', ''],
        ['IF102', 'Lab', '1', '1', ''],
        ['IF103', 'Teori', '3', '99', ''],
        ['', 'No code', '3', '1', ''],
      ]),
    );
    expect(result.issues.map((i) => [i.row, i.code])).toEqual([
      [2, 'BAD_CREDITS'],
      [4, 'BAD_TERM'],
      [5, 'MISSING_CODE'],
    ]);
    expect(result.issues[0].params).toMatchObject({ row: 2, value: 'three' });
    expect(result.courses.map((c) => c.code)).toEqual(['IF102']);
  });

  it('flags duplicate course codes with the first row they appeared in', () => {
    const result = parseCurriculumTable(
      tsv([
        HEAD,
        ['IF101', 'Dasar', '3', '1', ''],
        ['IF101', 'Salinan', '3', '1', ''],
      ]),
    );
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      row: 3,
      code: 'DUPLICATE_CODE',
      params: { row: 3, code: 'IF101', first: 2 },
    });
  });

  it('flags prerequisites that are not courses in the table', () => {
    const result = parseCurriculumTable(
      tsv([HEAD, ['IF201', 'Struktur', '4', '2', 'IF999']]),
    );
    expect(result.issues[0]).toMatchObject({
      row: 2,
      code: 'UNKNOWN_REFERENCE',
      params: { code: 'IF201', ref: 'IF999' },
    });
  });

  it('rejects unknown offering and category values', () => {
    const result = parseCurriculumTable(
      tsv([
        [...HEAD, 'offered_terms', 'category'],
        ['IF101', 'Dasar', '3', '1', '', 'sometimes', 'required'],
        ['IF102', 'Lab', '1', '1', '', 'odd', 'maybe'],
      ]),
    );
    expect(result.issues.map((i) => i.code)).toEqual([
      'BAD_OFFERED',
      'BAD_CATEGORY',
    ]);
  });

  it('names a required column it cannot find, and lets the user map it', () => {
    const text = tsv([
      ['code', 'name', 'bobot', 'recommended_term', 'prerequisites'],
      ['IF101', 'Dasar', '3', '1', ''],
    ]);
    const first = parseCurriculumTable(text);
    expect(first.missing).toEqual(['credits']);
    expect(first.issues.map((i) => i.code)).toContain('MISSING_COLUMN');
    expect(first.courses).toEqual([]);
    const bobot = first.columns.find((c) => c.header === 'bobot')!;
    expect(bobot.field).toBeNull();

    const mapped = parseCurriculumTable(text, { [bobot.index]: 'credits' });
    expect(mapped.missing).toEqual([]);
    expect(mapped.issues).toEqual([]);
    expect(mapped.courses[0].credits).toBe(3);
    expect(mapped.columns[bobot.index]).toMatchObject({
      field: 'credits',
      auto: false,
    });
  });

  it('lets a manual mapping override an automatic one', () => {
    const text = tsv([
      ['code', 'name', 'credits', 'semester', 'prasyarat'],
      ['IF101', 'Dasar', '3', '1', ''],
    ]);
    const result = parseCurriculumTable(text, { 4: '' });
    expect(result.columns[4].field).toBeNull();
    expect(result.courses[0].prerequisites).toEqual([]);
  });

  it('limits an import to 1 to 100 courses', () => {
    expect(codes(HEAD.join('\t'))).toContain('NO_ROWS');
    const rows = Array.from({ length: 101 }, (_, i) => [
      `C${i}`,
      `Course ${i}`,
      '2',
      '1',
      '',
    ]);
    expect(codes(tsv([HEAD, ...rows]))).toContain('ROW_COUNT');
  });

  it('reports an unclosed quote', () => {
    expect(codes(`${HEAD.join(',')}\nIF101,"Broken name,3,1,`)).toContain(
      'UNCLOSED_QUOTE',
    );
  });

  it('reads columns separated by runs of spaces, as copied from a PDF', () => {
    const result = parseCurriculumTable(
      [
        'Kode    Nama    SKS    Semester',
        'IF101   Dasar Pemrograman   3   1',
      ].join('\n'),
    );
    expect(result.delimiter).toBe('spaces');
    expect(result.issues).toEqual([]);
    expect(result.courses[0]).toMatchObject({
      code: 'IF101',
      name: 'Dasar Pemrograman',
      credits: 3,
    });
  });
});
