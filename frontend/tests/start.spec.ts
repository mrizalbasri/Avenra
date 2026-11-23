import { expect, test, type Page } from '@playwright/test';
import { webOrigin } from './services';
import {
  TABLE,
  aboutYou,
  next,
  noSideScroll,
  pasteTable,
  programRules,
} from './wizard';

const create = (page: Page) =>
  page.getByRole('button', { name: 'Create my workspace' });

async function finish(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'Which courses have you passed?' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Mark semesters 1 to 2 as passed' })
    .click();
  await expect(page.getByText('4 courses passed | 16 credits')).toBeVisible();
  await create(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'On track for semester 4.' }),
  ).toBeVisible();
  await expect(page.getByText('/ 32 credits')).toBeVisible();
  await expect(page.getByText('4 courses completed')).toBeVisible();
}

test('a new student goes from nothing to the Overview', async ({ page }) => {
  await aboutYou(page);
  await pasteTable(page);
  await expect(page.getByText('8 courses | 32 credits')).toBeVisible();
  await programRules(page, false);
  // The 144 default cannot be reached with 32 credits.
  await expect(
    page.getByText('add up to 32 credits, fewer than the 144 graduation', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByLabel('Credits needed to graduate (optional)').fill('');
  await next(page).click();
  await finish(page);
});

test('a reload in the middle keeps the draft', async ({ page }) => {
  await aboutYou(page, 'Sari');
  await pasteTable(page);
  await page
    .getByLabel('University', { exact: true })
    .fill('Universitas Contoh');
  await page.reload();
  await expect(
    page.getByText('Your unfinished setup was restored.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your curriculum', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Course code, row 1', { exact: true }),
  ).toHaveValue('IF101');
  await expect(page.getByLabel('University', { exact: true })).toHaveValue(
    'Universitas Contoh',
  );
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByLabel('Student alias')).toHaveValue('Sari');
});

test('an edited row shows its problem and blocks the next step', async ({
  page,
}) => {
  await aboutYou(page);
  await pasteTable(page);
  await programRules(page);
  await expect(next(page)).toBeEnabled();
  await page.getByLabel('Credits, row 2').fill('abc');
  await expect(
    page.getByText(
      'Row 2: credits must be a whole number from 1 to 24 (found "abc").',
    ),
  ).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByLabel('Credits, row 2').fill('4');
  await page.getByRole('button', { name: 'Remove row 1' }).click();
  // IF102 lists IF101, which is gone now.
  await expect(
    page.getByText(
      'Row 2: IF102 lists IF101, which is not a course in this table.',
    ),
  ).toBeVisible();
  await expect(next(page)).toBeDisabled();
});

test('a passed course needs its prerequisite to be passed', async ({
  page,
}) => {
  await aboutYou(page);
  await pasteTable(page);
  await programRules(page);
  await next(page).click();
  await page.getByRole('checkbox', { name: /Struktur Data/ }).check();
  await expect(page.getByText('IF102 needs IF101')).toBeVisible();
  await expect(create(page)).toBeDisabled();
  await page.getByRole('checkbox', { name: /Dasar Pemrograman/ }).check();
  await expect(page.getByText('IF102 needs IF101')).toHaveCount(0);
  await expect(create(page)).toBeEnabled();
});

test('the example curriculum fills the course rows', async ({ page }) => {
  await aboutYou(page);
  await page
    .getByRole('button', { name: 'Start from the example curriculum' })
    .click();
  await expect(
    page.getByText('Example curriculum (synthetic).', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Course code, row 1', { exact: true }),
  ).not.toHaveValue('');
  await expect(
    page.getByLabel('Rule source or curriculum reference'),
  ).not.toHaveValue('');
});

test.describe('at 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('the whole flow fits the screen', async ({ page }) => {
    await page.goto('/start');
    expect(await noSideScroll(page)).toBe(true);
    await aboutYou(page);
    await pasteTable(page);
    await programRules(page);
    expect(await noSideScroll(page)).toBe(true);
    await next(page).click();
    expect(await noSideScroll(page)).toBe(true);
    await finish(page);
    expect(await noSideScroll(page)).toBe(true);
  });
});

test.describe('in Indonesian', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: 'avenra_locale', value: 'id', url: webOrigin },
    ]);
  });

  const rawKey =
    /\b(start|curriculum|import|error|offer|course|common|plan|lang)\.[A-Za-z_]+/;

  test('the steps are translated', async ({ page }) => {
    await page.goto('/start');
    await expect(
      page.getByRole('heading', { name: 'Siapkan workspace Anda.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Tentang Anda', exact: true }),
    ).toBeVisible();
    expect(
      (await page.locator('body').innerText()).match(rawKey)?.[0],
    ).toBeUndefined();
    await page.getByLabel('Alias mahasiswa').fill('Budi');
    await page.getByRole('button', { name: 'Lanjut' }).click();
    await expect(
      page.getByRole('heading', { name: 'Kurikulum Anda', exact: true }),
    ).toBeVisible();
    await page.getByLabel('Atau tempel isi CSV').fill(TABLE);
    await page.getByRole('button', { name: 'Gunakan tabel ini' }).click();
    await expect(page.getByLabel('Kode mata kuliah, baris 1')).toHaveValue(
      'IF101',
    );
    expect(
      (await page.locator('body').innerText()).match(rawKey)?.[0],
    ).toBeUndefined();
  });
});

test('landing and workspace links reach the wizard', async ({ page }) => {
  await page.goto('/curriculum');
  await expect(page).toHaveURL(/\/start$/);
  // A workspace without a profile has nothing to plan yet.
  await page.goto('/plans');
  await expect(page).toHaveURL(/\/start$/);
});
