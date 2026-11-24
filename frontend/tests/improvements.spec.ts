import { expect, test, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
}

test('study supports inline task editing, manual details, and task deletion', async ({
  page,
}) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Study & focus', exact: true }).click();
  await expect(page).toHaveURL(/\/study$/);

  await page.getByLabel('Specific target').fill('Draft algorithm notes');
  await page.getByText('Add key details & checklist (optional)').click();
  await page
    .getByLabel('Key details & requirements (one per line)')
    .fill('Include BFS example');
  await page.getByRole('button', { name: 'Add study target' }).click();
  await expect(page.getByText('Draft algorithm notes')).toBeVisible();
  await expect(page.getByText('Include BFS example')).toBeVisible();

  await page
    .getByRole('button', { name: 'Edit target Draft algorithm notes' })
    .click();
  const editCard = page.locator('.task-edit-form');
  await editCard.getByLabel('Specific target').fill('Finalize algorithm notes');
  await editCard
    .getByLabel('First tiny step (optional)')
    .fill('Open diagram file');
  await editCard.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Study target updated.')).toBeVisible();
  await expect(page.getByText('Finalize algorithm notes')).toBeVisible();
  await expect(page.getByText('First step: Open diagram file')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Delete target Finalize algorithm notes' })
    .click();
  await expect(page.getByText('Study target deleted.')).toBeVisible();
  await expect(page.getByText('Finalize algorithm notes')).toHaveCount(0);
});

test('plan editor auto-saves before generating, Compare shows semester workload and diff filter, Passport shows mission/goals and copies summary', async ({
  page,
}) => {
  await openDemo(page);

  // Add mission, budget, and goal on Profile first using the grouped checklist & search.
  await page
    .getByRole('link', { name: 'Academic profile', exact: true })
    .click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel('Filter courses by code or name').fill('IF2101');
  await expect(page.getByText('IF2101 | 4 credits | Semester 3')).toBeVisible();
  await page.getByLabel('Filter courses by code or name').fill('');

  await page
    .getByLabel('Your mission (optional)')
    .fill('Graduate on time with practical internship experience.');
  await page.getByLabel('Weekly hours available (optional)').fill('68');
  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 1').fill('Internship');
  await page.getByLabel('Kind, goal 1').selectOption('internship');
  await page.getByLabel('Start semester, goal 1').fill('6');
  await page.getByLabel('End semester, goal 1').fill('6');
  await page.getByLabel('Hours / week, goal 1').fill('12');
  await page.getByRole('button', { name: 'Save academic profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  // Open plan editor, trigger a setback WITHOUT clicking Save first, then click Generate alternatives directly.
  await page.getByRole('link', { name: 'Study plans', exact: true }).click();
  await page.getByRole('link', { name: 'Open plan' }).first().click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);

  await page.getByRole('checkbox', { name: /^IF2101/ }).check();
  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await expect(
    page.getByRole('heading', { name: 'Recovery alternatives' }),
  ).toBeVisible();

  await page
    .getByRole('button', { name: 'Save as a separate plan' })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: /My study plan \|/ }),
  ).toBeVisible();

  // Passport shows Mission/Goals/Weekly hours and has Copy advisor summary.
  await page.getByRole('link', { name: 'Passport', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Mission, commitments & weekly time' }),
  ).toBeVisible();
  await expect(
    page.getByText('Graduate on time with practical internship experience.'),
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Weekly hours' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Copy advisor summary' }),
  ).toBeVisible();

  // Compare shows semester workload table and "Show differences only" toggle.
  await page.getByRole('link', { name: 'Compare plans', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Semester workload comparison' }),
  ).toBeVisible();
  const totalRowsBefore = await page
    .locator('section')
    .filter({ hasText: 'Course-by-course differences' })
    .locator('tbody tr')
    .count();
  await page.getByLabel('Show differences only').check();
  const totalRowsAfter = await page
    .locator('section')
    .filter({ hasText: 'Course-by-course differences' })
    .locator('tbody tr')
    .count();
  expect(totalRowsAfter).toBeLessThan(totalRowsBefore);
  expect(totalRowsAfter).toBeGreaterThan(0);
});

test('workspace JSON export, restore into a new workspace, and delete work end to end', async ({
  page,
}) => {
  await openDemo(page);
  await page
    .getByRole('link', { name: 'Academic profile', exact: true })
    .click();
  await page.getByLabel('Student alias').fill('Rizal Backup');
  await page.getByRole('button', { name: 'Save academic profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace (.json)' }).click();
  const download = await downloadPromise;
  const backupPath = (await download.path())!;
  expect(download.suggestedFilename()).toContain('avenra-rizal-backup.json');

  // Restore into a new workspace via the file input.
  await page
    .locator('label.file-button input[type="file"]')
    .setInputFiles(backupPath);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.identity strong')).toHaveText('Rizal Backup');

  // Delete the restored workspace cleanly.
  await page
    .getByRole('link', { name: 'Academic profile', exact: true })
    .click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete this workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('button', { name: 'Open demo workspace' }).first(),
  ).toBeVisible();
});
