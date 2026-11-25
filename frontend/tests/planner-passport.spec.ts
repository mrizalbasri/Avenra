import { expect, test, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
  return page.url().split('/').at(-1)!;
}

test('plan editor shows live draft findings, keeps locked semesters during recovery, and manages primary/deleted plans', async ({
  page,
}) => {
  const firstId = await openDemo(page);
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();

  // Extending Last semester to 9 makes the draft dirty while all listed rules pass.
  await page.getByLabel('Last semester', { exact: true }).fill('9');
  await page.getByLabel('Last semester', { exact: true }).blur();
  await expect(page.getByText('Live draft check')).toBeVisible();
  await expect(
    page.getByText('All listed rules pass in this draft preview.'),
  ).toBeVisible();

  const moveIf2201 = page.getByLabel('Move IF2201 to semester', {
    exact: true,
  });
  await moveIf2201.selectOption('3');
  await expect(
    page.getByText('Complete IF2101 before taking IF2201.'),
  ).toBeVisible();
  await expect(
    page.getByText('IF2201 is offered only in even semesters, not semester 3.'),
  ).toBeVisible();
  await moveIf2201.selectOption('4');
  await expect(
    page.getByText('All listed rules pass in this draft preview.'),
  ).toBeVisible();

  // Lock IF3204 in semester 8, simulate failing IF2101, and generate recovery alternatives.
  const moveIf3204 = page.getByLabel('Move IF3204 to semester', {
    exact: true,
  });
  await moveIf3204.selectOption('8');
  await page.getByRole('button', { name: /IF3204.*Technopreneurship/ }).click();
  await page.getByLabel('Lock in semester 8 during recovery').check();
  await page.getByRole('checkbox', { name: /^IF2101/ }).check();

  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await expect(
    page.getByRole('heading', { name: 'Recovery alternatives' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Save as a separate plan' })
    .first()
    .click();
  await expect(page).not.toHaveURL(new RegExp(`/plans/${firstId}$`));
  const recoveryId = page.url().split('/').at(-1)!;

  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  await expect(
    page.getByLabel('Move IF3204 to semester', { exact: true }),
  ).toHaveValue('8');
  await page.getByRole('button', { name: /IF3204.*Technopreneurship/ }).click();
  await expect(
    page.getByLabel('Lock in semester 8 during recovery'),
  ).toBeChecked();

  // Set recovery plan as Primary on Overview, create a spare plan, then delete it.
  await page.getByRole('link', { name: 'Study plans', exact: true }).click();
  await expect(page).toHaveURL(/\/plans$/);
  await page.getByRole('button', { name: 'Set as primary' }).first().click();
  await expect(
    page.getByText('is now your primary plan on Overview.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(
    page.locator(`a.button.primary[href="/plans/${recoveryId}"]`),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Study plans', exact: true }).click();
  await page.getByLabel('New plan name').fill('Spare draft');
  await page.getByRole('button', { name: 'Create plan' }).click();
  await expect(
    page.getByRole('heading', { name: 'Spare draft', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Study plans', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Spare draft' }).click();
  await expect(page.getByText('Plan deleted.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Spare draft' })).toHaveCount(0);
});

test('passport notes, comparison copy/print, Indonesian translation, and 390 px layout work cleanly', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __copiedText?: string }).__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { __copiedText?: string }).__copiedText = text;
        },
      },
      configurable: true,
    });
  });

  const firstId = await openDemo(page);
  await page.getByRole('checkbox', { name: /^IF2101/ }).check();
  await page.getByRole('button', { name: 'Generate alternatives' }).click();
  await page
    .getByRole('button', { name: 'Save as a separate plan' })
    .first()
    .click();
  await expect(page).not.toHaveURL(new RegExp(`/plans/${firstId}$`));

  // Passport notes persist across reload and render inside the printable passport.
  await page.getByRole('link', { name: 'Passport', exact: true }).click();
  await expect(page).toHaveURL(/\/passport$/);
  await page
    .getByLabel('Your notes or questions for your advisor (optional)')
    .fill('Can I keep IF3204 in semester 8 during my internship?');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Student notes for advisor' }),
  ).toBeVisible();
  await expect(
    page.locator('.passport').getByText('Can I keep IF3204 in semester 8'),
  ).toBeVisible();

  // Compare notes, clipboard copy, print mode, mobile 390px, and Indonesian labels.
  await page.getByRole('link', { name: 'Compare plans', exact: true }).click();
  await page
    .getByLabel('Your notes or questions for your advisor (optional)')
    .fill('Prefer balanced workload for internship.');
  await page.getByRole('button', { name: 'Copy comparison summary' }).click();
  await expect(page.getByText('Comparison summary copied.')).toBeVisible();
  const copied = await page.evaluate(
    () => (window as unknown as { __copiedText?: string }).__copiedText ?? '',
  );
  expect(copied).toContain('Academic Plan Comparison');
  expect(copied).toContain('Prefer balanced workload for internship.');

  await page.emulateMedia({ media: 'print' });
  await expect(
    page.getByRole('heading', { name: 'Academic Plan Comparison' }),
  ).toBeVisible();
  await expect(page.locator('.compare-selectors')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page
    .locator('.app-topbar')
    .getByRole('group', { name: 'Language' })
    .getByRole('button', { name: 'ID' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Salin ringkasan perbandingan' }),
  ).toBeVisible();
  const rawKey =
    /\b(landing|nav|overview|plans?|study|profile|curriculum|method|errorpage|ws|finding|diag|suggest|solve|alt|advisor|assume|error|compare|passport|node|req|offer|common|rule|cap|status|lang)\.(?!json)[A-Za-z_]+/;
  expect(
    (await page.locator('body').innerText()).match(rawKey)?.[0],
  ).toBeUndefined();
});

test('shareable curriculum template exports cleanly without personal data and imports in /start', async ({
  page,
}) => {
  await openDemo(page);
  await page
    .getByRole('link', { name: 'Academic profile', exact: true })
    .click();

  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export curriculum template (.json)' })
    .click();
  const download = await downloadPromise;
  const templatePath = (await download.path())!;
  expect(download.suggestedFilename()).toContain('avenra-curriculum-');
  const templateJson = JSON.parse(
    await (await import('node:fs/promises')).readFile(templatePath, 'utf8'),
  );
  expect(templateJson.schema_version).toBe(1);
  expect(templateJson.kind).toBe('avenra_curriculum');
  expect('profile' in templateJson).toBe(false);
  expect('plans' in templateJson).toBe(false);
  expect(templateJson.curriculum.courses.length).toBeGreaterThan(5);

  await page.goto('/start');
  await page.getByLabel('Student alias').fill('Template User');
  await page.getByLabel('Current semester').fill('1');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page
    .locator('label.file-label input[type="file"]')
    .setInputFiles(templatePath);
  await expect(
    page.getByText(
      'Curriculum template loaded. Review the courses and rules below.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Create my workspace' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.identity strong')).toHaveText('Template User');
});

test('focus timer supports goal-only sessions and persists across reload', async ({
  page,
}) => {
  await openDemo(page);
  await page
    .getByRole('link', { name: 'Academic profile', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByLabel('Goal title, goal 1').fill('BEM');
  await page.getByLabel('Kind, goal 1').selectOption('organisation');
  await page.getByLabel('Start semester, goal 1').fill('3');
  await page.getByLabel('End semester, goal 1').fill('4');
  await page.getByLabel('Hours / week, goal 1').fill('6');
  await page.getByRole('button', { name: 'Save academic profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page.getByRole('link', { name: 'Study & focus', exact: true }).click();
  await page.getByLabel('Focus target').selectOption({ label: 'BEM' });
  await page.getByLabel('Focus minutes').fill('1');
  await page.getByLabel('Focus minutes').blur();
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByLabel('What did you learn?').fill('Outlined BEM workplan');
  await page.getByRole('button', { name: 'Finish & save session' }).click();
  await expect(page.getByText('Outlined BEM workplan')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Outlined BEM workplan')).toBeVisible();
  await expect(
    page.locator('.session-row strong', { hasText: 'BEM' }),
  ).toBeVisible();
});
