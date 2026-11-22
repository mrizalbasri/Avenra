import { expect, test, type Page } from '@playwright/test';

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
