import { expect, test, type Page } from '@playwright/test';
import { apiOrigin } from './services';
import { aboutYou, next, pasteTable, programRules } from './wizard';

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'My study plan', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
  return page.url().split('/').at(-1)!;
}

test('moves courses, undoes edits, validates and persists the semester plan', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openDemo(page);
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  const move = page.getByLabel('Move IF2201 to semester', { exact: true });
  await move.selectOption('3');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(move).toHaveValue('4');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(move).toHaveValue('3');
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('Complete IF2101 before taking IF2201.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  await expect(move).toHaveValue('3');
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/semester-board.png',
    fullPage: true,
  });
});

test('generates recovery options, saves an independent plan, compares and exports a fresh snapshot', async ({
  page,
}) => {
  const id = await openDemo(page);
  await page.getByRole('checkbox', { name: /^IF2101/ }).check();
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await expect(
    page.getByRole('heading', { name: 'Recovery alternatives' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Earlier completion', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Save as a separate plan' })
    .first()
    .click();
  await expect(page).not.toHaveURL(new RegExp(`/plans/${id}$`));
  await expect(
    page.getByRole('heading', {
      name: 'My study plan | Earlier completion',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Passport', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Academic Decision Passport',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Plan revision 1 | Profile revision 1'),
  ).toBeVisible();
  await expect(page.getByText('Scenario setbacks: IF2101.')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/decision-passport.png',
    fullPage: true,
  });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('link', { name: 'Compare plans', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Course-by-course differences' }),
  ).toBeVisible();
});

test('persists study targets and restores a focus timer after reload', async ({
  page,
}) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Study & focus', exact: true }).click();
  await page
    .getByLabel('Specific target')
    .fill('Solve five linked-list exercises');
  await page.getByRole('button', { name: 'Add study target' }).click();
  await expect(
    page.getByText('Solve five linked-list exercises', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('checkbox', {
      name: 'Solve five linked-list exercises',
      exact: false,
    })
    .check();
  await page.getByLabel('Focus minutes').fill('1');
  await page.getByLabel('Focus minutes').blur();
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const remaining = await page.getByRole('timer').textContent();
  await page.reload();
  await expect(
    page.getByText('Restored in a paused state.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(remaining!);
  await page.getByLabel('What did you learn?').fill('Practiced list traversal');
  await page.getByRole('button', { name: 'Finish & save session' }).click();
  await expect(
    page.getByText('Practiced list traversal', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Practiced list traversal', { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/study-space.png',
    fullPage: true,
  });
});

test('imports a personal curriculum and keeps the original workspace separate', async ({
  page,
}) => {
  const originalId = await openDemo(page);
  // The switcher's "import another curriculum" opens the wizard.
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'Switch workspace' })
    .selectOption({ label: '+ Import another curriculum' });
  await expect(page).toHaveURL(/\/start$/);
  await aboutYou(page, 'Student B', '1');
  await pasteTable(
    page,
    'code,name,credits,recommended_term,prerequisites,offered_terms\nIF001,Introduction,3,1,,both\nIF002,Advanced topic,3,2,IF001,both',
  );
  await programRules(page, false);
  // Two courses cannot reach the 144-credit default, so the form warns until it is cleared.
  await expect(
    page.getByText('add up to 6 credits, fewer than the 144 graduation', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByLabel('Credits needed to graduate (optional)').fill('');
  await next(page).click();
  await page.getByRole('button', { name: 'Create my workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.identity strong')).toHaveText('Student B');
  await page.goto('/profile');
  await expect(
    page.getByText('IF001 | 3 credits | Semester 1', { exact: true }),
  ).toBeVisible();
  const workspaceId = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'avenra-workspace',
  )!.value;
  const denied = await page.request.get(
    `${apiOrigin}/api/v1/plans/${originalId}`,
    { headers: { 'X-Workspace-ID': workspaceId } },
  );
  expect(denied.status()).toBe(404);
  const selector = page.getByRole('combobox', { name: 'Switch workspace' });
  const oldId = await selector
    .locator('option')
    .filter({ hasText: 'Alex | Demo student' })
    .getAttribute('value');
  await selector.selectOption(oldId!);
  await expect(page.locator('.identity strong')).toHaveText(
    'Alex | Demo student',
  );
  await page.goto(`/plans/${originalId}`);
  await expect(
    page.getByRole('heading', { name: 'My study plan', exact: true }),
  ).toBeVisible();
});

test('canvas drag changes the assigned semester and mobile pages fit the viewport', async ({
  page,
}) => {
  const id = await openDemo(page);
  const node = page.locator('.svelte-flow__node[data-id="IF2201"]');
  await expect(node).toBeVisible();
  const box = await node.boundingBox();
  const previous = page.locator('.svelte-flow__node[data-id="IF2101"]');
  const dest = await previous.boundingBox();
  if (!box || !dest) throw new Error('Canvas cards not rendered');
  await node.click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(dest.x + dest.width / 2, box.y + box.height / 2, {
    steps: 16,
  });
  await page.mouse.up();
  await expect(
    page.getByRole('combobox', { name: 'Assigned semester', exact: true }),
  ).toHaveValue('3');
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/planning-canvas.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/',
    '/plans',
    `/plans/${id}`,
    '/compare',
    '/study',
    '/profile',
    '/curriculum',
    '/methodology',
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/workspace-mobile.png',
    fullPage: true,
  });
});

test('keeps a failed save recoverable after reload', async ({ page }) => {
  await openDemo(page);
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  await page
    .getByLabel('Move IF2201 to semester', { exact: true })
    .selectOption('3');
  await page.route('**/api/v1/plans/*', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Temporary API outage. Retry when connected.',
          }),
        })
      : route.continue(),
  );
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(page.getByRole('alert')).toContainText('Temporary API outage');
  await expect(
    page.getByText('Rev 1 | Unsaved changes', { exact: false }),
  ).toBeVisible();
  await page.unroute('**/api/v1/plans/*');
  page.once('dialog', (dialog) => dialog.accept());
  await page.reload();
  await page
    .getByRole('button', { name: 'Restore draft', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  await expect(
    page.getByLabel('Move IF2201 to semester', { exact: true }),
  ).toHaveValue('3');
});

test('explains an impossible plan and applies the smallest fix', async ({
  page,
}) => {
  await openDemo(page);
  await page.getByLabel('Credit limit').fill('12');
  await page.getByLabel('Credit limit').blur();
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await expect(
    page.getByRole('heading', { name: 'Why no plan fits' }),
  ).toBeVisible();
  await expect(
    page.getByText('You still need 105 credits', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Raise your own credit limit to 18 credits.' })
    .click();
  await expect(page.getByLabel('Credit limit')).toHaveValue('18');
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await expect(
    page.getByRole('heading', { name: 'Earlier completion', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({
    path: 'test-results/recovery-alternatives.png',
    fullPage: true,
  });
});
