import { expect, test } from '@playwright/test';
import { aboutYou, next, pasteTable, programRules, row } from './wizard';

test('a table pasted from Excel with Indonesian headers becomes a workspace', async ({
  page,
}) => {
  await aboutYou(page, 'Student C', '1');
  const table = [
    row('Kode MK', 'Nama Mata Kuliah', 'SKS', 'Smt', 'Prasyarat', 'Sifat'),
    row('IF101', 'Dasar Pemrograman', '3 (2-1)', '1', '-', 'Wajib'),
    row('IF201', 'Struktur Data', '4', '2', 'IF101', 'Wajib'),
    row('IF390', 'Topik Khusus', '2', '5', 'IF101 atau IF201', 'Pilihan'),
  ].join('\n');
  await page.getByLabel('Or paste CSV content').fill(table);
  await expect(page.getByText('Detected separator: tab')).toBeVisible();
  await page.getByRole('button', { name: 'Use this table' }).click();
  await expect(page.getByText('3 courses | 9 credits')).toBeVisible();
  await expect(page.getByLabel('Category, row 3')).toHaveValue('elective');
  await programRules(page);
  await next(page).click();
  await page.getByRole('button', { name: 'Create my workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/profile');
  await expect(
    page.getByText('IF390 | 2 credits | Semester 5 | Elective', {
      exact: true,
    }),
  ).toBeVisible();
});

test('an unknown column can be mapped, and row problems are listed together', async ({
  page,
}) => {
  await aboutYou(page);
  const table = [
    row('code', 'name', 'bobot', 'recommended_term', 'prerequisites'),
    row('IF101', 'Dasar', '3', '1', ''),
    row('IF101', 'Salinan', '3', '1', ''),
    row('IF201', 'Struktur', '4', '2', 'IF999'),
  ].join('\n');
  await page.getByLabel('Or paste CSV content').fill(table);
  const useTable = page.getByRole('button', { name: 'Use this table' });
  await expect(
    page.getByText('Could not find a "Credits" column'),
  ).toBeVisible();
  await expect(useTable).toBeDisabled();

  await page
    .getByLabel('Meaning of column bobot')
    .selectOption({ label: 'Credits' });
  await useTable.click();
  await expect(
    page.getByText('2 problems to fix in the courses'),
  ).toBeVisible();
  await expect(
    page.getByText('Row 2: course code IF101 already appears in row 1.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Row 3: IF201 lists IF999, which is not a course in this table.',
    ),
  ).toBeVisible();
  await programRules(page);
  await expect(next(page)).toBeDisabled();
});

test('a semicolon table without a prerequisite column works', async ({
  page,
}) => {
  await aboutYou(page, 'Student D', '1');
  await page
    .getByLabel('Or paste CSV content')
    .fill('kode;nama;sks;semester\nIF101;Dasar;3;1\nIF102;Lanjut;3;2');
  await expect(page.getByText('Detected separator: semicolon')).toBeVisible();
  await pasteTable(
    page,
    'kode;nama;sks;semester\nIF101;Dasar;3;1\nIF102;Lanjut;3;2',
  );
  await expect(page.getByText('2 courses | 6 credits')).toBeVisible();
  await programRules(page);
  await expect(next(page)).toBeEnabled();
});
