import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
}

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('bottom tab bar is reachable, thumb-sized and does not overflow', async ({
  page,
}) => {
  await openDemo(page);
  await page.goto('/');
  const tabs = page.getByRole('navigation', { name: 'Main navigation' });
  const links = tabs.getByRole('link');
  await expect(links).toHaveCount(5);
  await expect(tabs.getByRole('link', { name: 'Study & focus' })).toBeVisible();
  const viewport = page.viewportSize()!;
  for (const link of await links.all()) {
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
  expect(await noSideScroll(page)).toBe(true);
  await tabs.getByRole('link', { name: 'Study & focus' }).click();
  await expect(page).toHaveURL(/\/study$/);
  await expect(
    tabs.getByRole('link', { name: 'Study & focus' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('overview answers whether graduation is on time and what to protect', async ({
  page,
}) => {
  await openDemo(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'On track for semester 8.',
    }),
  ).toBeVisible();
  await expect(page.getByText('/ 144 credits')).toBeVisible();
  const protect = page.getByText('Protect Probability and Statistics');
  await expect(protect).toBeVisible();
  await expect(
    page.getByText('earliest modeled finish moves to semester 9', {
      exact: false,
    }),
  ).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/m-today.png', fullPage: true });
});

test('plan editor opens on the board with the recovery tools first', async ({
  page,
}) => {
  await openDemo(page);
  await expect(page.locator('.semester-board')).toBeVisible();
  const setback = await page.locator('.ins-setback').boundingBox();
  const board = await page.locator('.plan-workspace').boundingBox();
  expect(setback!.y).toBeLessThan(board!.y);
  expect(await noSideScroll(page)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/m-plan.png', fullPage: true });
});

test('study targets export to a calendar file with a reminder', async ({
  page,
}) => {
  await openDemo(page);
  await page.goto('/study');
  await page.getByLabel('Specific target').fill('Finish chapter 3 exercises');
  await page.getByLabel('Target date (optional)').fill('2026-12-01');
  await page.getByRole('button', { name: 'Add study target' }).click();
  await expect(page.getByText('Finish chapter 3 exercises')).toBeVisible();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Add open targets to my calendar (.ics)' })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('avenra-study.ics');
  const text = await (
    await import('node:fs/promises')
  ).readFile((await file.path())!, 'utf8');
  expect(text).toContain('BEGIN:VCALENDAR');
  expect(text).toContain('DTSTART;VALUE=DATE:20261201');
  expect(text).toContain('DTEND;VALUE=DATE:20261202');
  expect(text).toContain('Finish chapter 3 exercises');
  expect(text).toContain('BEGIN:VALARM');
  expect(text).toContain('TRIGGER:-PT5H');
});
