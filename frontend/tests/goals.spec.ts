import { expect, test } from '@playwright/test';
import {
  aboutYou,
  next,
  noSideScroll,
  pasteTable,
  programRules,
} from './wizard';

test('onboarding step 4 sets weekly time and goals, shown on Overview and plan editor', async ({
  page,
}) => {
  await page.goto('/start');
  await page.getByLabel('Student alias').fill('Dina');
  await page.getByLabel('Current semester').fill('3');
  await page
    .getByLabel('Your mission (optional)')
    .fill('Graduate on time while leading BEM.');
  await next(page).click();

  await pasteTable(page);
  await programRules(page);
  await next(page).click();

  await page
    .getByRole('button', { name: 'Mark semesters 1 to 2 as passed' })
    .click();
  await next(page).click();

  await expect(
    page.getByRole('heading', { name: 'Weekly time & goals (optional)' }),
  ).toBeVisible();
  await page.getByLabel('Weekly hours available (optional)').fill('30');
  await expect(
    page.getByText('30 h/week | up to 10 credits/semester before goal hours.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 1').fill('BEM');
  await page.getByLabel('Kind, goal 1').selectOption('organisation');
  await page.getByLabel('Start semester, goal 1').fill('3');
  await page.getByLabel('End semester, goal 1').fill('3');
  await page.getByLabel('Hours / week, goal 1').fill('10');

  await page.getByRole('button', { name: 'Create my workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByText('Graduate on time while leading BEM.'),
  ).toBeVisible();
  await expect(page.getByText('BEM', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Organisation | Semester 3 | 10 h/week'),
  ).toBeVisible();

  // Semester 3 has 8 credits = 22.7 h + 10 h BEM = 32.7 h > 30 h available.
  await expect(
    page.getByText('Semester 3 needs 32.7 h of 30 h available'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Review plan' }).first().click();
  await expect(page).toHaveURL(/\/plans\//);
  // Canvas shows the semester hour totals.
  await expect(page.getByText('32.7 / 30 h (22.7 + 10 h)')).toBeVisible();
  // Board view also shows the semester hour totals.
  await page.getByRole('button', { name: 'Semester board' }).click();
  await expect(page.getByText('32.7 / 30 h (22.7 + 10 h)')).toBeVisible();
});

test('editing mission, goals, and weekly budget on Profile updates Overview and flags semester 6 overload', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\//);

  await page.goto('/profile');
  await page
    .getByLabel('Your mission (optional)')
    .fill('Finish on time and complete an industry internship.');
  await page.getByLabel('Weekly hours available (optional)').fill('45');

  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 1').fill('BEM');
  await page.getByLabel('Kind, goal 1').selectOption('organisation');
  await page.getByLabel('Start semester, goal 1').fill('3');
  await page.getByLabel('End semester, goal 1').fill('3');
  await page.getByLabel('Hours / week, goal 1').fill('6');

  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 2').fill('Internship');
  await page.getByLabel('Kind, goal 2').selectOption('internship');
  await page.getByLabel('Start semester, goal 2').fill('6');
  await page.getByLabel('End semester, goal 2').fill('6');
  await page.getByLabel('Hours / week, goal 2').fill('20');

  await page.getByRole('button', { name: 'Save academic profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page.goto('/');
  await expect(
    page.getByText('Finish on time and complete an industry internship.'),
  ).toBeVisible();
  await expect(
    page.getByText('Organisation | Semester 3 | 6 h/week'),
  ).toBeVisible();
  await expect(
    page.getByText(/Semester 6 needs \d+(\.\d)? h of 45 h available/),
  ).toBeVisible();
});

test('onboarding step 4 is skippable and fits 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await aboutYou(page, 'Raka', '3');
  await pasteTable(page);
  await programRules(page);
  await next(page).click();
  await next(page).click();
  await expect(
    page.getByRole('heading', { name: 'Weekly time & goals (optional)' }),
  ).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  await page.getByRole('button', { name: 'Skip & create workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await noSideScroll(page)).toBe(true);
});
