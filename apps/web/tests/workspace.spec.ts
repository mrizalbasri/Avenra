import { expect, test } from '@playwright/test';

test('loads API data and restores a saved moved card after reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('API connected', { exact: true })).toBeVisible();
  const node = page.locator('.svelte-flow__node[data-id="CS101"]');
  await expect(node).toBeVisible();
  const box = await node.boundingBox();
  if (!box) throw new Error('Course node is missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 65,
    box.y + box.height / 2 + 35,
    { steps: 12 },
  );
  await page.mouse.up();
  await page.getByRole('button', { name: 'Save layout' }).click();
  await expect(
    page.getByText('Layout saved in this browser.', { exact: false }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    localStorage.getItem('avenra-demo-layout-v1'),
  );
  expect(JSON.parse(saved!).CS101.x).not.toBe(0);
  await page.reload();
  await expect(node).toBeVisible();
  await page.getByRole('button', { name: 'Save layout' }).click();
  expect(
    await page.evaluate(() => localStorage.getItem('avenra-demo-layout-v1')),
  ).toBe(saved);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: 'test-results/workspace-desktop.png',
    fullPage: true,
  });
});

test('mobile workspace fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.locator('.svelte-flow__node[data-id="CS101"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your path, in perspective.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/workspace-mobile.png',
    fullPage: true,
  });
});
