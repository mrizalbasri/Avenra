import { expect, test } from '@playwright/test';

const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('en-CA');
};

test('a goal task with no course filters cleanly, appears on Overview, and exports to .ics', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\//);

  // Add a BEM goal in Profile (via SPA nav so the page is hydrated).
  await page.getByRole('link', { name: 'Academic profile' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 1').fill('BEM');
  await page.getByLabel('Kind, goal 1').selectOption('organisation');
  await page.getByLabel('Start semester, goal 1').fill('3');
  await page.getByLabel('End semester, goal 1').fill('4');
  await page.getByLabel('Hours / week, goal 1').fill('8');
  await page.getByRole('button', { name: 'Save academic profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page.getByRole('link', { name: 'Study & focus' }).click();
  await expect(page).toHaveURL(/\/study$/);
  // Add one course task first.
  await page.getByLabel('Specific target').fill('Review graph traversal');
  await page.getByRole('button', { name: 'Add study target' }).click();
  await expect(page.getByText('Review graph traversal')).toBeVisible();

  // Add a goal-only task due tomorrow.
  const due = tomorrowIso();
  await page.getByLabel('Course or goal').selectOption({ label: 'BEM' });
  await page.getByLabel('Specific target').fill('BEM event proposal');
  await page.getByLabel('Target date (optional)').fill(due);
  await page.getByRole('button', { name: 'Add study target' }).click();
  await expect(page.getByText('BEM event proposal')).toBeVisible();
  await expect(page.getByText(`BEM | Due ${due}`)).toBeVisible();

  // Filter by BEM goal: shows BEM task, hides course task.
  await page.getByLabel('Filter by goal').selectOption({ label: 'BEM' });
  await expect(page.getByText('BEM event proposal')).toBeVisible();
  await expect(page.getByText('Review graph traversal')).toHaveCount(0);

  // Export .ics includes the goal task.
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Add open targets to my calendar (.ics)' })
    .click();
  const file = await download;
  const text = await (
    await import('node:fs/promises')
  ).readFile((await file.path())!, 'utf8');
  expect(text).toContain('BEM | BEM event proposal');
  expect(text).toContain('Goal target for BEM.');

  // Overview attention list shows the due goal task cleanly.
  await page.goto('/');
  await expect(page.getByText('Due soon: BEM event proposal')).toBeVisible();
  await expect(page.getByText(`Goal BEM | due ${due}`)).toBeVisible();
});
