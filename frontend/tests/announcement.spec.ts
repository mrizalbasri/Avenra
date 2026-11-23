import { expect, test } from '@playwright/test';

const daysFromNowIso = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-CA');
};

test('pasting a class announcement creates a confirmed task with start plan, focus launch, Overview nudge, and .ics', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\//);

  await page.getByRole('link', { name: 'Study & focus' }).click();
  await expect(page).toHaveURL(/\/study$/);

  await page.getByRole('button', { name: 'Paste announcement' }).click();
  const due = daysFromNowIso(4);
  const announcement = `[Announcement] IF2101 Data Structures: implement BST traversal in Python.
- Submit PDF report and source code on LMS
- Individual submission
Due: ${due} at 23:59`;
  await page
    .getByLabel('Class announcement or chat message')
    .fill(announcement);
  await page.getByRole('button', { name: 'Extract & review' }).click();

  // Review & confirm step: extracted fields are editable before saving.
  await expect(
    page.getByRole('heading', { name: 'Confirm task & start plan' }),
  ).toBeVisible();
  await expect(page.getByLabel('Target date (optional)')).toHaveValue(due);
  await expect(page.getByLabel('First tiny step (optional)')).not.toHaveValue(
    '',
  );
  // Move planned start date to today so Overview surfaces "Start today".
  const today = daysFromNowIso(0);
  await page.getByLabel('Planned start date (optional)').fill(today);

  await page.getByRole('button', { name: 'Confirm & add task' }).click();
  await expect(page.getByText('Study target added.')).toBeVisible();
  await expect(page.getByText(/IF2101 Data Structures/)).toBeVisible();
  await expect(
    page.getByText('Submit PDF report and source code on LMS'),
  ).toBeVisible();

  // Export .ics includes both the planned start event and due date event.
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Add open targets to my calendar (.ics)' })
    .click();
  const file = await download;
  const ics = (
    await (
      await import('node:fs/promises')
    ).readFile((await file.path())!, 'utf8')
  ).replace(/\r\n /g, '');
  expect(ics).toContain('SUMMARY:Start: IF2101 |');
  expect(ics).toContain('First step:');

  // Clicking "Start now" loads the task's first step straight into the Focus Space timer.
  await page.getByRole('button', { name: 'Start now' }).first().click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByLabel('What did you learn?')).not.toHaveValue('');

  // Overview shows the "Start today" nudge with the first concrete step.
  await page.getByRole('link', { name: 'Overview' }).click();
  await expect(
    page.getByText(/Start today: .*IF2101 Data Structures/),
  ).toBeVisible();
  await expect(page.getByText(/First step:/)).toBeVisible();
});
