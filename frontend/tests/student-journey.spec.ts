import { expect, test } from '@playwright/test';
import { webOrigin } from './services';
import { noSideScroll, row } from './wizard';

const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('en-CA');
};

test('end-to-end Indonesian student flow: paste table, time budget, goals, calendar reminder, honest labels', async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: 'avenra_locale', value: 'id', url: webOrigin },
  ]);

  const table = [
    row('Kode MK', 'Nama Mata Kuliah', 'SKS', 'Smt', 'Prasyarat'),
    row('IF101', 'Dasar Pemrograman', '4', '1', '-'),
    row('IF102', 'Struktur Data', '4', '2', 'IF101'),
    row('IF201', 'Basis Data', '4', '3', 'IF102'),
    row('IF202', 'Jaringan Komputer', '4', '3', 'IF102'),
    row('IF301', 'Rekayasa Perangkat Lunak', '4', '4', 'IF201'),
  ].join('\n');

  await page.goto('/start');
  await page.getByLabel('Alias mahasiswa').fill('Ayu');
  await page.getByLabel('Semester saat ini').fill('3');
  await page
    .getByLabel('Misi Anda (opsional)')
    .fill('Lulus tepat waktu sambil aktif di BEM dan magang.');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await page.getByLabel('Atau tempel isi CSV').fill(table);
  await page.getByRole('button', { name: 'Gunakan tabel ini' }).click();
  await page.getByLabel('Universitas', { exact: true }).fill('Univ Nusantara');
  await page.getByLabel('Program studi').fill('Informatika');
  await page
    .getByLabel('Sumber aturan atau rujukan kurikulum')
    .fill('Pedoman 2026');
  await page.getByLabel('SKS yang dibutuhkan untuk lulus (opsional)').fill('');
  await page.getByRole('button', { name: 'Lanjut' }).click();

  await page
    .getByRole('button', { name: 'Tandai semester 1 sampai 2 sebagai lulus' })
    .click();
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Step 4: weekly time budget + BEM goal this semester.
  await page.getByLabel('Jam tersedia per minggu (opsional)').fill('30');
  await page.getByRole('button', { name: 'Tambah tujuan' }).click();
  await page.getByLabel('Nama tujuan, tujuan 1').fill('BEM');
  await page.getByLabel('Jenis, tujuan 1').selectOption('organisation');
  await page.getByLabel('Semester mulai, tujuan 1').fill('3');
  await page.getByLabel('Semester selesai, tujuan 1').fill('3');
  await page.getByLabel('Jam / minggu, tujuan 1').fill('10');

  await page.getByRole('button', { name: 'Buat workspace saya' }).click();
  await expect(page).toHaveURL(/\/$/);

  // Honest curriculum label, no DEMO or Prototipe lokal jargon.
  await expect(page.getByText('Kurikulum Anda').first()).toBeVisible();
  await expect(page.getByText('DEMO', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Prototipe lokal')).toHaveCount(0);

  // Mission, active goal, and neutral overload notice in Indonesian.
  await expect(
    page.getByText('Lulus tepat waktu sambil aktif di BEM dan magang.'),
  ).toBeVisible();
  await expect(
    page.getByText('Organisasi | Semester 3 | 10 jam/minggu'),
  ).toBeVisible();
  await expect(
    page.getByText('Semester 3 membutuhkan 32.7 jam dari 30 jam tersedia'),
  ).toBeVisible();

  // Add a BEM task with a due date and export .ics reminder.
  await page.getByRole('link', { name: 'Belajar & fokus' }).click();
  await expect(page).toHaveURL(/\/study$/);
  const due = tomorrowIso();
  await page
    .getByLabel('Mata kuliah atau tujuan')
    .selectOption({ label: 'BEM' });
  await page.getByLabel('Target spesifik').fill('Proposal acara BEM');
  await page.getByLabel('Tanggal target (opsional)').fill(due);
  await page.getByRole('button', { name: 'Tambah target belajar' }).click();
  await expect(page.getByText('Proposal acara BEM')).toBeVisible();

  const download = page.waitForEvent('download');
  await page
    .getByRole('button', {
      name: 'Tambahkan target terbuka ke kalender saya (.ics)',
    })
    .click();
  const file = await download;
  const ics = await (
    await import('node:fs/promises')
  ).readFile((await file.path())!, 'utf8');
  expect(ics).toContain('BEM | Proposal acara BEM');
  expect(ics).toContain('Target tujuan untuk BEM.');

  // Verify methodology page renders the time budget section in Indonesian.
  await page.getByRole('link', { name: 'Aturan & metodologi' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Anggaran waktu mingguan, tujuan, dan bahasa',
    }),
  ).toBeVisible();

  // Verify mobile 390 px layout on Overview without horizontal overflow.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await noSideScroll(page)).toBe(true);
});
