import { expect, type Page } from '@playwright/test';

export const row = (...cells: string[]) => cells.join('\t');

// Eight courses over four semesters, 32 credits, as pasted from a spreadsheet.
export const TABLE = [
  row('Kode MK', 'Nama Mata Kuliah', 'SKS', 'Smt', 'Prasyarat'),
  row('IF101', 'Dasar Pemrograman', '4', '1', '-'),
  row('MA101', 'Kalkulus', '4', '1', '-'),
  row('IF102', 'Struktur Data', '4', '2', 'IF101'),
  row('MA102', 'Statistika', '4', '2', 'MA101'),
  row('IF201', 'Basis Data', '4', '3', 'IF102'),
  row('IF202', 'Jaringan Komputer', '4', '3', 'IF102'),
  row('IF301', 'Rekayasa Perangkat Lunak', '4', '4', 'IF201'),
  row('IF302', 'Proyek Akhir', '4', '4', 'IF201|IF202'),
].join('\n');

export const next = (page: Page) =>
  page.getByRole('button', { name: 'Next', exact: true });

export async function aboutYou(page: Page, alias = 'Budi', semester = '3') {
  await page.goto('/start');
  await page.getByLabel('Student alias').fill(alias);
  await page.getByLabel('Current semester').fill(semester);
  await next(page).click();
  await expect(
    page.getByRole('heading', { name: 'Your curriculum', exact: true }),
  ).toBeVisible();
}

export async function pasteTable(page: Page, table = TABLE) {
  await page.getByLabel('Or paste CSV content').fill(table);
  await page.getByRole('button', { name: 'Use this table' }).click();
}

export async function programRules(page: Page, clearGraduation = true) {
  await page
    .getByLabel('University', { exact: true })
    .fill('Universitas Contoh');
  await page.getByLabel('Study program').fill('Informatika');
  await page
    .getByLabel('Rule source or curriculum reference')
    .fill('Pedoman akademik 2026');
  // Small test tables cannot reach the 144-credit default.
  if (clearGraduation)
    await page.getByLabel('Credits needed to graduate (optional)').fill('');
}

export const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
