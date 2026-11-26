import { ApiError } from '#lib/errors.js';
import type { Curriculum, GpaCreditRule } from '#lib/types.js';

// Fields a curriculum table can carry. The first four are required.
export const FIELDS = [
  'code',
  'name',
  'credits',
  'recommended_term',
  'prerequisites',
  'corequisites',
  'min_credits',
  'offered_terms',
  'category',
] as const;
export type Field = (typeof FIELDS)[number];
export const REQUIRED_FIELDS: Field[] = [
  'code',
  'name',
  'credits',
  'recommended_term',
];

export type Delimiter = ',' | ';' | '\t' | 'spaces';

export type Issue = {
  // Table-level problems have no row. Rows count the header as row 1.
  row?: number;
  field?: Field;
  code: string;
  message: string;
  params: Record<string, string | number>;
};

export type Column = {
  index: number;
  header: string;
  field: Field | null;
  // False when the user chose this column's meaning by hand.
  auto: boolean;
};

export type ParsedCourse = {
  code: string;
  name: string;
  credits: number;
  recommended_term: number;
  category: 'required' | 'elective';
  prerequisites: string[];
  any_prerequisites: string[][];
  corequisites: string[];
  min_credits_earned: number;
  offered_terms: number[];
};

export type ParsedTable = {
  delimiter: Delimiter;
  columns: Column[];
  missing: Field[];
  // Courses from rows without problems.
  courses: ParsedCourse[];
  // Every course row as text, including rows with problems, for the row editor.
  rows: CourseRow[];
  issues: Issue[];
};

// Column names people actually use, in English and Indonesian. Compared after
// lowercasing and turning punctuation into spaces.
const ALIASES: Record<Field, string[]> = {
  code: [
    'code',
    'course code',
    'kode',
    'kode mk',
    'kode mata kuliah',
    'kode matkul',
    'kd mk',
  ],
  name: [
    'name',
    'course name',
    'course',
    'nama',
    'nama mk',
    'nama mata kuliah',
    'nama matkul',
    'mata kuliah',
    'matkul',
  ],
  credits: ['credits', 'credit', 'sks', 'kredit', 'jumlah sks', 'bobot sks'],
  recommended_term: [
    'recommended term',
    'term',
    'semester',
    'smt',
    'sem',
    'semester rekomendasi',
    'semester ke',
  ],
  prerequisites: [
    'prerequisites',
    'prerequisite',
    'prereq',
    'prasyarat',
    'syarat',
  ],
  corequisites: [
    'corequisites',
    'corequisite',
    'co requisite',
    'korequisit',
    'korequisite',
    'koreq',
  ],
  min_credits: [
    'min credits',
    'min credit',
    'min sks',
    'minimal sks',
    'sks minimal',
  ],
  offered_terms: [
    'offered terms',
    'offered',
    'offering',
    'ditawarkan',
    'penawaran',
  ],
  category: ['category', 'kategori', 'sifat', 'jenis', 'tipe', 'type'],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const ALIAS_LOOKUP = new Map<string, Field>(
  (Object.entries(ALIASES) as [Field, string[]][]).flatMap(([field, names]) =>
    names.map((name) => [normalize(name), field] as const),
  ),
);

/** Looks at the header line to guess how the pasted table is separated. */
function detectDelimiter(text: string): Delimiter {
  const first = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  let tabs = 0;
  let semicolons = 0;
  let commas = 0;
  let quoted = false;
  for (const char of first) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === '\t') tabs++;
    else if (!quoted && char === ';') semicolons++;
    else if (!quoted && char === ',') commas++;
  }
  if (tabs) return '\t';
  if (semicolons || commas) return semicolons > commas ? ';' : ',';
  // Text copied from a PDF often separates columns with runs of spaces.
  return /\S\s{2,}\S/.test(first) ? 'spaces' : ',';
}

function splitRows(text: string, delimiter: Delimiter) {
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (delimiter === 'spaces')
    return {
      rows: input.split('\n').map((line) => line.trim().split(/\s{2,}|\t/)),
      unclosed: false,
    };
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === delimiter || c === '\n')) {
      row.push(cell.trim());
      cell = '';
      if (c === '\n') {
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  row.push(cell.trim());
  rows.push(row);
  return { rows, unclosed: quoted };
}

const WHOLE = /^(\d+)(?:[.,]0+)?$/;
// Indonesian curricula often write credits as "3 (2-1)": take the leading number.
const CREDITS = /^(\d+)(?:[.,]0+)?\s*(?:sks)?\s*(?:\(.*\))?$/i;
const NONE = /^(-|—|–|none|n\/a|na|tidak ada|tanpa|nihil)$/i;

function readList(value: string): string[] {
  if (!value || NONE.test(value.trim())) return [];
  return value
    .replace(/\s+(atau|or)\s+/gi, '|')
    .split(/[;,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const ODD = ['odd', 'ganjil'];
const EVEN = ['even', 'genap'];
const BOTH = [
  'both',
  'semua',
  'all',
  'ganjil genap',
  'setiap semester',
  'tiap semester',
  'every semester',
];
const ELECTIVE = ['elective', 'pilihan', 'optional', 'mata kuliah pilihan'];
const REQUIRED = ['required', 'wajib', 'mandatory', 'mata kuliah wajib'];

const raise = (
  code: string,
  message: string,
  params: Record<string, string | number> = {},
  row?: number,
  field?: Field,
): Issue => ({
  code,
  message,
  row,
  field,
  params: row === undefined ? params : { row, ...params },
});

/**
 * Reads a pasted table (Excel, Sheets, CSV or text copied from a PDF) into courses.
 *
 * `columnFields` lets the user fix a column the headers did not reveal: a column
 * index maps to a field, or to '' to ignore that column. Every problem is
 * collected, so the user can fix them all in one pass.
 */
export function parseCurriculumTable(
  text: string,
  columnFields: Record<number, Field | ''> = {},
): ParsedTable {
  const issues: Issue[] = [];
  const delimiter = detectDelimiter(text);
  const { rows: rawRows, unclosed } = splitRows(text, delimiter);
  if (unclosed)
    issues.push(
      raise(
        'UNCLOSED_QUOTE',
        'The table has an unclosed quote. Check your course names.',
      ),
    );
  const rows = rawRows.filter((row) => row.some(Boolean));
  const header = rows.shift() ?? [];

  // Automatic matches first, then the user's choices win.
  const columns: Column[] = header.map((title, index) => {
    const manual = index in columnFields;
    return {
      index,
      header: title,
      field: manual
        ? columnFields[index] || null
        : (ALIAS_LOOKUP.get(normalize(title)) ?? null),
      auto: !manual,
    };
  });
  const claimed = new Set<Field>();
  for (const column of [...columns].sort(
    (a, b) => Number(a.auto) - Number(b.auto),
  )) {
    if (!column.field) continue;
    if (claimed.has(column.field)) column.field = null;
    else claimed.add(column.field);
  }

  const missing = REQUIRED_FIELDS.filter((field) => !claimed.has(field));
  for (const field of missing)
    issues.push(
      raise(
        'MISSING_COLUMN',
        `Could not find a "${field}" column. Pick one below or add it to the table.`,
        { field },
        undefined,
        field,
      ),
    );
  if (!rows.length && !missing.length)
    issues.push(
      raise(
        'NO_ROWS',
        'Paste a table with a header row and at least one course.',
      ),
    );
  if (rows.length > 100)
    issues.push(raise('ROW_COUNT', 'Import between 1 and 100 courses.'));
  if (missing.length || !rows.length)
    return { delimiter, columns, missing, courses: [], rows: [], issues };

  const column = (field: Field) =>
    columns.find((c) => c.field === field)?.index;
  const cell = (row: string[], field: Field) => {
    const index = column(field);
    return index === undefined ? '' : (row[index] ?? '').trim();
  };
  const courseRows = rows.map((cells): CourseRow => ({
    code: cell(cells, 'code'),
    name: cell(cells, 'name'),
    credits: cell(cells, 'credits'),
    recommended_term: cell(cells, 'recommended_term'),
    prerequisites: cell(cells, 'prerequisites'),
    corequisites: cell(cells, 'corequisites'),
    min_credits: cell(cells, 'min_credits'),
    offered_terms: cell(cells, 'offered_terms'),
    category: cell(cells, 'category'),
  }));
  // The header is row 1, so the first course is row 2, as in the spreadsheet.
  const read = readRows(courseRows, 2);
  issues.push(...read.issues);
  issues.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
  return {
    delimiter,
    columns,
    missing,
    courses: read.clean,
    rows: courseRows,
    issues,
  };
}

// One editable course, as text, so a half-typed value is kept while the user edits.
export type CourseRow = {
  code: string;
  name: string;
  credits: string;
  recommended_term: string;
  // ';' separated; 'A|B' means either course.
  prerequisites: string;
  corequisites: string;
  min_credits: string;
  // odd, even or both (English or Indonesian), empty for both.
  offered_terms: string;
  // required or elective (English or Indonesian), empty for required.
  category: string;
};

export const emptyRow = (): CourseRow => ({
  code: '',
  name: '',
  credits: '',
  recommended_term: '',
  prerequisites: '',
  corequisites: '',
  min_credits: '',
  offered_terms: '',
  category: '',
});

/**
 * Checks rows and converts them to courses. The table parser and the row editor share
 * these rules, so a pasted table and an edited one are judged the same way.
 */
function readRows(rows: CourseRow[], firstRow: number) {
  const issues: Issue[] = [];
  const firstSeen = new Map<string, number>();
  const known = new Set(rows.map((r) => r.code.trim()).filter(Boolean));
  const parsed: { row: number; course: ParsedCourse }[] = [];
  rows.forEach((source, index) => {
    const rowNumber = index + firstRow;
    const get = (field: keyof CourseRow) => source[field].trim();
    const code = get('code');
    const name = get('name');
    if (!code)
      issues.push(
        raise(
          'MISSING_CODE',
          `Row ${rowNumber}: course code is required.`,
          {},
          rowNumber,
          'code',
        ),
      );
    else if (firstSeen.has(code))
      issues.push(
        raise(
          'DUPLICATE_CODE',
          `Row ${rowNumber}: course code ${code} already appears in row ${firstSeen.get(code)}.`,
          { code, first: firstSeen.get(code)! },
          rowNumber,
          'code',
        ),
      );
    else firstSeen.set(code, rowNumber);
    if (!name)
      issues.push(
        raise(
          'MISSING_NAME',
          `Row ${rowNumber}: course name is required.`,
          {},
          rowNumber,
          'name',
        ),
      );

    const creditsText = get('credits');
    const credits = Number(CREDITS.exec(creditsText)?.[1]);
    if (!(credits >= 1 && credits <= 24))
      issues.push(
        raise(
          'BAD_CREDITS',
          `Row ${rowNumber}: credits must be a whole number from 1 to 24 (found "${creditsText}").`,
          { value: creditsText },
          rowNumber,
          'credits',
        ),
      );
    const termText = get('recommended_term');
    const term = Number(WHOLE.exec(termText)?.[1]);
    if (!(term >= 1 && term <= 14))
      issues.push(
        raise(
          'BAD_TERM',
          `Row ${rowNumber}: semester must be a whole number from 1 to 14 (found "${termText}").`,
          { value: termText },
          rowNumber,
          'recommended_term',
        ),
      );
    const minText = get('min_credits');
    const minCredits = minText ? Number(WHOLE.exec(minText)?.[1]) : 0;
    if (!(minCredits >= 0 && minCredits <= 300))
      issues.push(
        raise(
          'BAD_MIN_CREDITS',
          `Row ${rowNumber}: min_credits must be a whole number from 0 to 300.`,
          { value: minText },
          rowNumber,
          'min_credits',
        ),
      );
    const offeringText = get('offered_terms');
    const offering = normalize(offeringText);
    const offered = ODD.includes(offering)
      ? [1]
      : EVEN.includes(offering)
        ? [0]
        : !offering || BOTH.includes(offering)
          ? [0, 1]
          : null;
    if (!offered)
      issues.push(
        raise(
          'BAD_OFFERED',
          `Row ${rowNumber}: offered_terms must be odd, even, or both (found "${offeringText}").`,
          { value: offeringText },
          rowNumber,
          'offered_terms',
        ),
      );
    const categoryText = get('category');
    const kind = normalize(categoryText);
    const elective = ELECTIVE.includes(kind);
    if (kind && !elective && !REQUIRED.includes(kind))
      issues.push(
        raise(
          'BAD_CATEGORY',
          `Row ${rowNumber}: category must be required or elective (found "${categoryText}").`,
          { value: categoryText },
          rowNumber,
          'category',
        ),
      );

    // "A|B" means either course satisfies the requirement.
    const requirements = readList(get('prerequisites'));
    const groups = requirements
      .filter((p) => p.includes('|'))
      .map((p) =>
        p
          .split('|')
          .map((o) => o.trim())
          .filter(Boolean),
      );
    const course: ParsedCourse = {
      code,
      name,
      credits,
      recommended_term: term,
      category: elective ? 'elective' : 'required',
      prerequisites: [
        ...requirements.filter((p) => !p.includes('|')),
        ...groups.filter((g) => g.length === 1).flat(),
      ],
      any_prerequisites: groups.filter((g) => g.length > 1),
      corequisites: readList(get('corequisites')),
      min_credits_earned: minCredits,
      offered_terms: offered ?? [0, 1],
    };
    // References are checked against every code, even rows with other problems.
    const refs = [
      ...course.prerequisites,
      ...course.any_prerequisites.flat(),
      ...course.corequisites,
    ];
    for (const ref of refs.filter((r) => !known.has(r)))
      issues.push(
        raise(
          'UNKNOWN_REFERENCE',
          `Row ${rowNumber}: ${code} lists ${ref}, which is not a course in this table.`,
          { code, ref },
          rowNumber,
          'prerequisites',
        ),
      );
    parsed.push({ row: rowNumber, course });
  });
  const withIssue = new Set(issues.map((i) => i.row));
  return {
    issues,
    courses: parsed.map((p) => p.course),
    clean: parsed.filter((p) => !withIssue.has(p.row)).map((p) => p.course),
  };
}

/** Problems in edited rows, numbered from 1. An empty or oversized list is a problem too. */
export function checkCourseRows(rows: CourseRow[]): Issue[] {
  const issues = readRows(rows, 1).issues;
  if (!rows.length || rows.length > 100)
    issues.unshift(raise('ROW_COUNT', 'Import between 1 and 100 courses.'));
  return issues;
}

/** Courses from rows that passed checkCourseRows. */
export function rowsToCourses(rows: CourseRow[]): ParsedCourse[] {
  return readRows(rows, 1).courses;
}

/** The editable form of a course, for example to fill the editor from a parsed table. */
export function courseToRow(course: ParsedCourse): CourseRow {
  return {
    code: course.code,
    name: course.name,
    credits: String(course.credits),
    recommended_term: String(course.recommended_term),
    prerequisites: [
      ...course.prerequisites,
      ...course.any_prerequisites.map((group) => group.join('|')),
    ].join('; '),
    corequisites: course.corequisites.join('; '),
    min_credits: course.min_credits_earned
      ? String(course.min_credits_earned)
      : '',
    offered_terms:
      course.offered_terms.length === 2
        ? ''
        : course.offered_terms[0] === 1
          ? 'odd'
          : 'even',
    category: course.category === 'elective' ? 'elective' : '',
  };
}

/**
 * Passed courses whose own prerequisites are not passed. Mirrors the API's
 * progress_issues: a missing either-or group is listed as its options.
 */
export function checkPassed(
  courses: ParsedCourse[],
  completed: string[],
): { course: string; missing: (string | string[])[] }[] {
  const done = new Set(completed);
  const issues = [];
  for (const course of courses) {
    if (!done.has(course.code)) continue;
    const missing: (string | string[])[] = [
      ...course.prerequisites,
      ...course.corequisites,
    ].filter((code) => !done.has(code));
    for (const group of course.any_prerequisites)
      if (!group.some((code) => done.has(code))) missing.push([...group]);
    if (missing.length) issues.push({ course: course.code, missing });
  }
  return issues;
}

/** Parses lines such as "3.00 = 24" into IPS credit rules. */
export function parseGpaRules(text: string) {
  const rules = text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(\d+(?:[.,]\d+)?)\s*[=:]\s*(\d+)$/);
      const minGpa = match ? Number(match[1].replace(',', '.')) : NaN;
      const maxCredits = match ? Number(match[2]) : NaN;
      if (
        !(minGpa >= 0 && minGpa <= 4) ||
        !(Number.isInteger(maxCredits) && maxCredits >= 1 && maxCredits <= 24)
      )
        throw new ApiError(
          `IPS rule ${index + 1} must look like "3.00 = 24" (IPS 0 to 4, credits 1 to 24).`,
          'IPS_RULE_INVALID',
          { index: index + 1 },
        );
      return { min_gpa: minGpa, max_credits: maxCredits };
    });
  if (rules.length > 10)
    throw new ApiError('Use at most 10 IPS rules.', 'IPS_TOO_MANY');
  return rules;
}

export type CurriculumTemplateBundle = {
  schema_version: 1;
  kind: 'avenra_curriculum';
  curriculum: {
    name: string;
    version: string;
    source: string;
    credit_cap: number;
    graduation_credits: number | null;
    target_terms: number;
    max_terms: number;
    gpa_credit_rules: GpaCreditRule[];
    courses: ParsedCourse[];
  };
};

export type ParsedCurriculumTemplate = {
  university: string;
  program: string;
  version: string;
  source: string;
  credit_cap: number;
  graduation_credits: number | null;
  target_terms: number;
  max_terms: number;
  gpa_credit_rules: GpaCreditRule[];
  courses: ParsedCourse[];
};

/** Strips workspace-specific profile/plan data so curricula can be shared safely. */
export function buildCurriculumTemplate(
  curriculum: Curriculum,
): CurriculumTemplateBundle {
  return {
    schema_version: 1,
    kind: 'avenra_curriculum',
    curriculum: {
      name: curriculum.name,
      version: curriculum.version,
      source: curriculum.source,
      credit_cap: curriculum.credit_cap,
      graduation_credits: curriculum.graduation_credits,
      target_terms: curriculum.target_terms,
      max_terms: curriculum.max_terms,
      gpa_credit_rules: curriculum.gpa_credit_rules.map((r) => ({
        min_gpa: r.min_gpa,
        max_credits: r.max_credits,
      })),
      courses: curriculum.courses.map((c) => ({
        code: c.code,
        name: c.name,
        credits: c.credits,
        recommended_term: c.recommended_term,
        category: c.category,
        prerequisites: [...c.prerequisites],
        any_prerequisites: (c.any_prerequisites ?? []).map((g) => [...g]),
        corequisites: [...(c.corequisites ?? [])],
        min_credits_earned: c.min_credits_earned ?? 0,
        offered_terms: [...c.offered_terms],
      })),
    },
  };
}

function failInvalidTemplate(): never {
  throw new ApiError(
    'Curriculum template JSON is not valid.',
    'INVALID_CURRICULUM_JSON',
  );
}

export function parseCurriculumTemplateJson(
  raw: string,
): ParsedCurriculumTemplate {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    failInvalidTemplate();
  }
  if (!parsed || typeof parsed !== 'object') failInvalidTemplate();
  const root = parsed as Record<string, unknown>;
  if ('schema_version' in root && root.schema_version !== 1) {
    failInvalidTemplate();
  }
  if ('kind' in root && root.kind !== 'avenra_curriculum') {
    failInvalidTemplate();
  }
  const sourceCurr =
    'curriculum' in root &&
    root.curriculum &&
    typeof root.curriculum === 'object'
      ? (root.curriculum as Record<string, unknown>)
      : root;

  const rawName =
    typeof sourceCurr.name === 'string' ? sourceCurr.name.trim() : '';
  const rawVersion =
    typeof sourceCurr.version === 'string' ? sourceCurr.version.trim() : '';
  const rawSource =
    typeof sourceCurr.source === 'string'
      ? sourceCurr.source.trim()
      : 'Shared curriculum template';
  const creditCap = sourceCurr.credit_cap;
  const maxTerms =
    sourceCurr.max_terms === undefined ? 14 : sourceCurr.max_terms;
  const targetTerms =
    sourceCurr.target_terms === undefined ? 8 : sourceCurr.target_terms;
  const graduationCredits =
    sourceCurr.graduation_credits === undefined
      ? null
      : sourceCurr.graduation_credits;
  const rawCourses = sourceCurr.courses;
  const rawGpa =
    sourceCurr.gpa_credit_rules === undefined
      ? []
      : sourceCurr.gpa_credit_rules;

  if (
    !rawName ||
    !rawVersion ||
    !Number.isInteger(creditCap) ||
    (creditCap as number) < 1 ||
    (creditCap as number) > 24 ||
    !Number.isInteger(maxTerms) ||
    (maxTerms as number) < 1 ||
    (maxTerms as number) > 14 ||
    !Number.isInteger(targetTerms) ||
    (targetTerms as number) < 1 ||
    (targetTerms as number) > (maxTerms as number) ||
    (graduationCredits !== null &&
      (!Number.isInteger(graduationCredits) ||
        (graduationCredits as number) < 1 ||
        (graduationCredits as number) > 300)) ||
    !Array.isArray(rawCourses) ||
    rawCourses.length < 1 ||
    rawCourses.length > 100 ||
    !Array.isArray(rawGpa) ||
    rawGpa.length > 10
  ) {
    failInvalidTemplate();
  }

  const gpaRules: GpaCreditRule[] = rawGpa.map((entry) => {
    if (!entry || typeof entry !== 'object') failInvalidTemplate();
    const rule = entry as Record<string, unknown>;
    if (
      typeof rule.min_gpa !== 'number' ||
      !Number.isFinite(rule.min_gpa) ||
      rule.min_gpa < 0 ||
      rule.min_gpa > 4 ||
      !Number.isInteger(rule.max_credits) ||
      (rule.max_credits as number) < 1 ||
      (rule.max_credits as number) > 24
    ) {
      failInvalidTemplate();
    }
    return { min_gpa: rule.min_gpa, max_credits: rule.max_credits as number };
  });

  const strList = (v: unknown) => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || !v.every((item) => typeof item === 'string')) {
      failInvalidTemplate();
    }
    return v.map((s) => s.trim()).filter(Boolean);
  };

  const courses: ParsedCourse[] = rawCourses.map((entry) => {
    if (!entry || typeof entry !== 'object') failInvalidTemplate();
    const c = entry as Record<string, unknown>;
    const code = typeof c.code === 'string' ? c.code.trim() : '';
    const name = typeof c.name === 'string' ? c.name.trim() : '';
    const credits = c.credits;
    const term = c.recommended_term;
    const category = c.category ?? 'required';
    const minCredits = c.min_credits_earned ?? 0;
    const offered = c.offered_terms ?? [0, 1];
    const anyGroups = c.any_prerequisites ?? [];

    if (
      !code ||
      code.length > 20 ||
      !name ||
      name.length > 150 ||
      !Number.isInteger(credits) ||
      (credits as number) < 1 ||
      (credits as number) > 24 ||
      !Number.isInteger(term) ||
      (term as number) < 1 ||
      (term as number) > (maxTerms as number) ||
      (category !== 'required' && category !== 'elective') ||
      !Number.isInteger(minCredits) ||
      (minCredits as number) < 0 ||
      (minCredits as number) > 300 ||
      !Array.isArray(offered) ||
      offered.length < 1 ||
      offered.length > 2 ||
      !offered.every((o) => o === 0 || o === 1) ||
      !Array.isArray(anyGroups) ||
      !anyGroups.every(
        (g) =>
          Array.isArray(g) &&
          g.length >= 2 &&
          g.every((item) => typeof item === 'string' && item.trim().length > 0),
      )
    ) {
      failInvalidTemplate();
    }

    return {
      code,
      name,
      credits: credits as number,
      recommended_term: term as number,
      category,
      prerequisites: strList(c.prerequisites),
      any_prerequisites: anyGroups.map((g: string[]) =>
        g.map((item) => item.trim()),
      ),
      corequisites: strList(c.corequisites),
      min_credits_earned: minCredits as number,
      offered_terms: [...new Set(offered as number[])],
    };
  });

  if (checkCourseRows(courses.map(courseToRow)).length > 0) {
    failInvalidTemplate();
  }

  const pipeIdx = rawName.indexOf('|');
  const university =
    pipeIdx >= 0 ? rawName.slice(0, pipeIdx).trim() || rawName : rawName;
  const program =
    pipeIdx >= 0 ? rawName.slice(pipeIdx + 1).trim() || university : rawName;

  return {
    university,
    program,
    version: rawVersion,
    source: rawSource || 'Shared curriculum template',
    credit_cap: creditCap as number,
    graduation_credits: graduationCredits as number | null,
    target_terms: targetTerms as number,
    max_terms: maxTerms as number,
    gpa_credit_rules: gpaRules,
    courses,
  };
}
