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
    throw new Error('The CSV has an unclosed quote. Check your course names.');
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
      throw new Error(
        `Missing CSV column: ${field}. Download the template for the required format.`,
      );
  if (!rows.length || rows.length > 100)
    throw new Error('Import between 1 and 100 courses.');
  return rows.map((cells, index) => {
    const get = (field: string) => cells[header.indexOf(field)] ?? '';
    const credits = Number(get('credits'));
    const term = Number(get('recommended_term'));
    if (
      !get('code') ||
      !get('name') ||
      !Number.isInteger(credits) ||
      credits < 1 ||
      credits > 24 ||
      !Number.isInteger(term) ||
      term < 1 ||
      term > 12
    )
      throw new Error(
        `Check course row ${index + 2}: course code, name, credits (1 to 24), and semester (1 to 12) are required.`,
      );
    const offering = get('offered_terms').toLowerCase();
    if (offering && !['odd', 'even', 'both'].includes(offering))
      throw new Error(
        `Row ${index + 2}: offered_terms must be odd, even, or both.`,
      );
    return {
      code: get('code'),
      name: get('name'),
      credits,
      recommended_term: term,
      prerequisites: get('prerequisites')
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean),
      offered_terms:
        offering === 'odd' ? [1] : offering === 'even' ? [0] : [0, 1],
    };
  });
}
