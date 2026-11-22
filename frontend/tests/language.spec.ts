import { expect, test, type Page } from '@playwright/test';
import { webOrigin } from './services';

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
}

test('defaults to English and marks the document language', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language choice persists across reloads on desktop', async ({ page }) => {
  await openDemo(page);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Study plans' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'On track for semester 8.' }),
  ).toBeVisible();

  await page
    .getByRole('group', { name: 'Language' })
    .first()
    .getByRole('button', { name: 'ID' })
    .click();
  const navId = page.getByRole('navigation', { name: 'Navigasi utama' });
  await expect(
    navId.getByRole('link', { name: 'Rencana studi' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sesuai jalur untuk semester 8.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  await page.reload();
  await expect(
    navId.getByRole('link', { name: 'Rencana studi' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sesuai jalur untuk semester 8.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  await page
    .getByRole('group', { name: 'Bahasa' })
    .first()
    .getByRole('button', { name: 'EN' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'On track for semester 8.' }),
  ).toBeVisible();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('switcher is in the top bar and does not overflow', async ({ page }) => {
    await openDemo(page);
    await page.goto('/');
    const switcher = page
      .locator('.app-topbar')
      .getByRole('group', { name: 'Language' });
    await expect(switcher).toBeVisible();
    await switcher.getByRole('button', { name: 'ID' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Navigasi utama' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('navigation', { name: 'Navigasi utama' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test.describe('plan editor in Indonesian', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: 'avenra_locale', value: 'id', url: webOrigin },
    ]);
  });

  test('shows a prerequisite finding in Indonesian from its code and params', async ({
    page,
  }) => {
    await openDemo(page);
    await expect(
      page.getByRole('heading', { name: 'My study plan', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Papan semester', exact: true })
      .click();
    await page
      .getByLabel('Pindahkan IF2201 ke semester', { exact: true })
      .selectOption('3');
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('Selesaikan IF2101 sebelum mengambil IF2201.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'IF2201 hanya ditawarkan pada semester genap, bukan semester 3.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText('PRASYARAT', { exact: true }).first(),
    ).toBeVisible();
  });

  test('explains an impossible plan and offers alternatives in Indonesian', async ({
    page,
  }) => {
    await openDemo(page);
    await page.getByLabel('Batas SKS', { exact: true }).fill('12');
    await page.getByLabel('Batas SKS', { exact: true }).blur();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Buat alternatif' }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Mengapa tidak ada rencana yang muat',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Anda masih membutuhkan 105 SKS', { exact: false }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: 'Naikkan batas SKS Anda sendiri menjadi 18 SKS.',
      })
      .click();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Buat alternatif' }).click();
    await expect(
      page.getByRole('heading', { name: 'Selesai lebih awal', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Dibandingkan dengan Selesai lebih awal', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('button', { name: 'Simpan sebagai rencana terpisah' })
        .first(),
    ).toBeVisible();
  });

  test('translates a server error from its code', async ({ page }) => {
    await openDemo(page);
    await page.route('**/api/v1/plans/*', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: {
            code: 'PLAN_CONFLICT',
            message:
              'This plan changed in another tab. Reload before saving your draft.',
            params: {},
          },
        }),
      });
    });
    await page.getByLabel('Batas SKS', { exact: true }).fill('20');
    await page.getByLabel('Batas SKS', { exact: true }).blur();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByRole('alert').getByText('Rencana ini berubah di tab lain', {
        exact: false,
      }),
    ).toBeVisible();
  });

  test('opens the Decision Passport in Indonesian', async ({ page }) => {
    await openDemo(page);
    await page.getByRole('link', { name: 'Paspor', exact: true }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Paspor Keputusan Akademik',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Revisi rencana 1 | Revisi profil 1'),
    ).toBeVisible();
    await expect(
      page.getByText('Pertanyaan untuk dosen wali', { exact: true }),
    ).toBeVisible();
  });
});
