import { ApiError } from '#lib/errors.js';

export function parseCoursesCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(cell.trim());
      cell = '';
      if (c === '\n') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted)
    throw new ApiError(
      'The CSV has an unclosed quote. Check your course names.',
      'CSV_UNCLOSED_QUOTE',
    );
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const header = rows.shift()?.map((s) => s.toLowerCase()) ?? [];
  for (const field of [
    'code',
    'name',
    'credits',
    'recommended_term',
    'prerequisites',
  ])
    if (!header.includes(field))
      throw new ApiError(
        `Missing CSV column: ${field}. Download the template for the required format.`,
        'CSV_MISSING_COLUMN',
        { field },
      );
  if (!rows.length || rows.length > 100)
    throw new ApiError('Import between 1 and 100 courses.', 'CSV_ROW_COUNT');
  const list = (value: string) =>
    value
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean);
  return rows.map((cells, index) => {
    const get = (field: string) =>
      header.includes(field) ? (cells[header.indexOf(field)] ?? '') : '';
    const credits = Number(get('credits'));
    const term = Number(get('recommended_term'));
    const minCredits = Number(get('min_credits') || 0);
    if (
      !get('code') ||
      !get('name') ||
      !Number.isInteger(credits) ||
      credits < 1 ||
      credits > 24 ||
      !Number.isInteger(term) ||
      term < 1 ||
      term > 14
    )
      throw new ApiError(
        `Check course row ${index + 2}: course code, name, credits (1 to 24), and semester (1 to 14) are required.`,
        'CSV_ROW_INVALID',
        { row: index + 2 },
      );
    if (!Number.isInteger(minCredits) || minCredits < 0 || minCredits > 300)
      throw new ApiError(
        `Row ${index + 2}: min_credits must be a whole number from 0 to 300.`,
        'CSV_MIN_CREDITS',
        { row: index + 2 },
      );
    const offering = get('offered_terms').toLowerCase();
    const odd = ['odd', 'ganjil'].includes(offering);
    const even = ['even', 'genap'].includes(offering);
    if (offering && !odd && !even && !['both', 'semua'].includes(offering))
      throw new ApiError(
        `Row ${index + 2}: offered_terms must be odd, even, or both.`,
        'CSV_OFFERED',
        { row: index + 2 },
      );
    const category = get('category').toLowerCase();
    const elective = ['elective', 'pilihan'].includes(category);
    if (category && !elective && !['required', 'wajib'].includes(category))
      throw new ApiError(
        `Row ${index + 2}: category must be required or elective.`,
        'CSV_CATEGORY',
        { row: index + 2 },
      );
    const requirements = list(get('prerequisites'));
    return {
      code: get('code'),
      name: get('name'),
      credits,
      recommended_term: term,
      category: elective ? ('elective' as const) : ('required' as const),
      prerequisites: requirements.filter((p) => !p.includes('|')),
      // "A|B" means either course satisfies the requirement.
      any_prerequisites: requirements
        .filter((p) => p.includes('|'))
        .map((p) =>
          p
            .split('|')
            .map((o) => o.trim())
            .filter(Boolean),
        ),
      corequisites: list(get('corequisites')),
      min_credits_earned: minCredits,
      offered_terms: odd ? [1] : even ? [0] : [0, 1],
    };
  });
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
