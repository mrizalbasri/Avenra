import { expect, test, type Page } from '@playwright/test';

const row = (...cells: string[]) => cells.join('\t');

async function fillContext(page: Page) {
  await page.goto('/curriculum');
  await page.getByLabel('Student alias').fill('Student C');
  await page
    .getByLabel('University', { exact: true })
    .fill('Example University');
  await page.getByLabel('Study program').fill('Informatika');
  await page
    .getByLabel('Rule source or curriculum reference')
    .fill('Example faculty handbook');
}

test('a table pasted from Excel with Indonesian headers becomes a workspace', async ({
  page,
}) => {
  await fillContext(page);
  const table = [
    row('Kode MK', 'Nama Mata Kuliah', 'SKS', 'Smt', 'Prasyarat', 'Sifat'),
    row('IF101', 'Dasar Pemrograman', '3 (2-1)', '1', '-', 'Wajib'),
    row('IF201', 'Struktur Data', '4', '2', 'IF101', 'Wajib'),
    row('IF390', 'Topik Khusus', '2', '5', 'IF101 atau IF201', 'Pilihan'),
  ].join('\n');
  await page.getByLabel('Or paste CSV content').fill(table);
  await expect(page.getByText('Detected separator: tab')).toBeVisible();
  await expect(page.getByText('3 courses ready to validate.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'IF390' })).toBeVisible();
  await expect(page.getByText('problems to fix')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Create my academic workspace' })
    .click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByText('IF390 | 2 credits | Semester 5 | Elective', {
      exact: true,
    }),
  ).toBeVisible();
});

test('shows every row problem at once and lets the user map an unknown column', async ({
  page,
}) => {
  await fillContext(page);
  const table = [
    row('code', 'name', 'bobot', 'recommended_term', 'prerequisites'),
    row('IF101', 'Dasar', '3', '1', ''),
    row('IF101', 'Salinan', '3', '1', ''),
    row('IF201', 'Struktur', '4', '2', 'IF999'),
  ].join('\n');
  await page.getByLabel('Or paste CSV content').fill(table);
  const create = page.getByRole('button', {
    name: 'Create my academic workspace',
  });
  await expect(
    page.getByText('Could not find a "Credits" column'),
  ).toBeVisible();
  await expect(create).toBeDisabled();

  await page
    .getByLabel('Meaning of column bobot')
    .selectOption({ label: 'Credits' });
  await expect(page.getByText('2 problems to fix')).toBeVisible();
  await expect(
    page.getByText('Row 3: course code IF101 already appears in row 2.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Row 4: IF201 lists IF999, which is not a course in this table.',
    ),
  ).toBeVisible();
  await expect(create).toBeDisabled();
});

test('semicolon tables and a pasted table without a prerequisite column work', async ({
  page,
}) => {
  await fillContext(page);
  await page
    .getByLabel('Or paste CSV content')
    .fill('kode;nama;sks;semester\nIF101;Dasar;3;1\nIF102;Lanjut;3;2');
  await expect(page.getByText('Detected separator: semicolon')).toBeVisible();
  await expect(page.getByText('2 courses ready to validate.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create my academic workspace' }),
  ).toBeEnabled();
});
