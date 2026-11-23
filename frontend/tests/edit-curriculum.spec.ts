import { expect, test } from '@playwright/test';
import { aboutYou, next, pasteTable, programRules, row } from './wizard';

test('adding a forgotten prerequisite on Profile immediately flags the plan in the editor', async ({
  page,
}) => {
  const table = [
    row('code', 'name', 'credits', 'recommended_term', 'prerequisites'),
    row('IF101', 'Programming', '3', '1', ''),
    row('IF201', 'Databases', '3', '3', 'IF101'),
    row('IF202', 'Systems', '3', '3', 'IF101'),
  ].join('\n');

  await aboutYou(page, 'Nadia', '3');
  await pasteTable(page, table);
  await programRules(page);
  await next(page).click();
  await page
    .getByRole('button', { name: 'Mark semesters 1 to 2 as passed' })
    .click();
  await page.getByRole('button', { name: 'Create my workspace' }).click();
  await expect(page).toHaveURL(/\/$/);

  // Open Profile via SPA navigation, expand Edit courses, and add IF201 as prerequisite of IF202.
  await page.getByRole('link', { name: 'Academic profile' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.locator('.edit-courses-summary').click();
  await page.getByLabel('Prerequisites, row 3').fill('IF101;IF201');
  await page.getByRole('button', { name: 'Save curriculum' }).click();
  await expect(
    page.getByText(
      'Curriculum saved. All plans now use your updated courses and rules.',
    ),
  ).toBeVisible();

  // Open the plan: both IF201 and IF202 are in semester 3, so the editor flags the prerequisite immediately.
  await page.getByRole('link', { name: 'Study plans' }).click();
  await page.getByRole('link', { name: /My study plan/ }).click();
  await expect(page).toHaveURL(/\/plans\//);
  await expect(
    page.getByText('Complete IF201 before taking IF202.'),
  ).toBeVisible();
});
