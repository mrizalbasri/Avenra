import { expect, test } from '@playwright/test';
import { apiOrigin, webOrigin } from './services';

test('browser calls the independent API directly and SSR preserves the same workspace', async ({
  page,
}) => {
  await page.goto('/');
  const workspace = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'avenra-workspace',
  )!;
  const bootstrap = page.waitForResponse(
    `${apiOrigin}/api/v1/workspace/bootstrap`,
  );
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  const response = await bootstrap;
  expect(response.ok()).toBe(true);
  expect(response.request().headers()['x-workspace-id']).toBe(workspace.value);
  expect(response.headers()['access-control-allow-origin']).toBe(webOrigin);
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
  await expect(
    page.getByRole('heading', { name: 'My study plan', exact: true }),
  ).toBeVisible();
  // A full document request exercises SSR, not only client-side navigation.
  const html = await page.request.get(page.url());
  expect(html.ok()).toBe(true);
  expect(await html.text()).toContain('My study plan');
  expect((await page.request.get('/api/workspace')).status()).toBe(404);
});

test('existing HttpOnly demo cookies migrate without losing their workspace', async ({
  page,
}) => {
  const workspaceId = crypto.randomUUID();
  const response = await page.request.post(
    `${apiOrigin}/api/v1/workspace/bootstrap`,
    { headers: { 'X-Workspace-ID': workspaceId } },
  );
  expect(response.ok()).toBe(true);
  const workspace = await response.json();
  await page.context().addCookies([
    {
      name: 'avenra-workspace',
      value: workspaceId,
      url: webOrigin,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
  await page.goto(`/plans/${workspace.plans[0].id}`);
  await expect(
    page.getByRole('heading', { name: 'My study plan', exact: true }),
  ).toBeVisible();
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === 'avenra-workspace',
  )!;
  expect(cookie.value).toBe(workspaceId);
  expect(cookie.httpOnly).toBe(false);
  // Canvas nodes confirm client hydration before using an SSR-rendered control.
  await expect(
    page.locator('.svelte-flow__node[data-id="IF2201"]'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Semester board', exact: true })
    .click();
  await page
    .getByLabel('Move IF2201 to semester', { exact: true })
    .selectOption('3');
  await page.getByRole('button', { name: 'Save & validate' }).click();
  await expect(
    page.getByText('Plan saved and checked', { exact: false }),
  ).toBeVisible();
});

test('an invalid workspace switch does not replace the selected workspace', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
  const original = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'avenra-workspace',
  )!.value;
  await page.evaluate(() => {
    const remembered = JSON.parse(
      localStorage.getItem('avenra-workspaces') ?? '[]',
    );
    remembered.push({ id: 'missing-workspace', name: 'Missing workspace' });
    localStorage.setItem('avenra-workspaces', JSON.stringify(remembered));
  });
  await page.reload();
  await page
    .getByRole('combobox', { name: 'Switch workspace' })
    .selectOption('missing-workspace');
  await expect(page.getByRole('alert')).toHaveText('Workspace not found.');
  expect(
    (await page.context().cookies()).find(
      (cookie) => cookie.name === 'avenra-workspace',
    )!.value,
  ).toBe(original);
});
