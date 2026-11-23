import { expect, test, type Page } from '@playwright/test';
import { webOrigin } from './services';

async function openDemo(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Open demo workspace' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/plans\/[a-zA-Z0-9-]+$/);
}

test('defaults to English and marks the document language', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language choice persists across reloads on desktop', async ({ page }) => {
  await openDemo(page);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Study plans' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'On track for semester 8.' }),
  ).toBeVisible();

  await page
    .getByRole('group', { name: 'Language' })
    .first()
    .getByRole('button', { name: 'ID' })
    .click();
  const navId = page.getByRole('navigation', { name: 'Navigasi utama' });
  await expect(
    navId.getByRole('link', { name: 'Rencana studi' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sesuai jalur untuk semester 8.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  await page.reload();
  await expect(
    navId.getByRole('link', { name: 'Rencana studi' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Sesuai jalur untuk semester 8.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'id');

  await page
    .getByRole('group', { name: 'Bahasa' })
    .first()
    .getByRole('button', { name: 'EN' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'On track for semester 8.' }),
  ).toBeVisible();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('switcher is in the top bar and does not overflow', async ({ page }) => {
    await openDemo(page);
    await page.goto('/');
    const switcher = page
      .locator('.app-topbar')
      .getByRole('group', { name: 'Language' });
    await expect(switcher).toBeVisible();
    await switcher.getByRole('button', { name: 'ID' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Navigasi utama' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('navigation', { name: 'Navigasi utama' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test.describe('plan editor in Indonesian', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: 'avenra_locale', value: 'id', url: webOrigin },
    ]);
  });

  test('shows a prerequisite finding in Indonesian from its code and params', async ({
    page,
  }) => {
    await openDemo(page);
    await expect(
      page.getByRole('heading', { name: 'My study plan', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Papan semester', exact: true })
      .click();
    await page
      .getByLabel('Pindahkan IF2201 ke semester', { exact: true })
      .selectOption('3');
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('Selesaikan IF2101 sebelum mengambil IF2201.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'IF2201 hanya ditawarkan pada semester genap, bukan semester 3.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText('PRASYARAT', { exact: true }).first(),
    ).toBeVisible();
  });

  test('explains an impossible plan and offers alternatives in Indonesian', async ({
    page,
  }) => {
    await openDemo(page);
    await page.getByLabel('Batas SKS', { exact: true }).fill('12');
    await page.getByLabel('Batas SKS', { exact: true }).blur();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Buat alternatif' }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Mengapa tidak ada rencana yang muat',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Anda masih membutuhkan 105 SKS', { exact: false }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: 'Naikkan batas SKS Anda sendiri menjadi 18 SKS.',
      })
      .click();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByText('Rencana disimpan dan diperiksa', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Buat alternatif' }).click();
    await expect(
      page.getByRole('heading', { name: 'Selesai lebih awal', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Dibandingkan dengan Selesai lebih awal', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('button', { name: 'Simpan sebagai rencana terpisah' })
        .first(),
    ).toBeVisible();
  });

  test('translates a server error from its code', async ({ page }) => {
    await openDemo(page);
    await page.route('**/api/v1/plans/*', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: {
            code: 'PLAN_CONFLICT',
            message:
              'This plan changed in another tab. Reload before saving your draft.',
            params: {},
          },
        }),
      });
    });
    await page.getByLabel('Batas SKS', { exact: true }).fill('20');
    await page.getByLabel('Batas SKS', { exact: true }).blur();
    await page.getByRole('button', { name: 'Simpan & validasi' }).click();
    await expect(
      page.getByRole('alert').getByText('Rencana ini berubah di tab lain', {
        exact: false,
      }),
    ).toBeVisible();
  });

  test('opens the Decision Passport in Indonesian', async ({ page }) => {
    await openDemo(page);
    await page.getByRole('link', { name: 'Paspor', exact: true }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Paspor Keputusan Akademik',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Revisi rencana 1 | Revisi profil 1'),
    ).toBeVisible();
    await expect(
      page.getByText('Pertanyaan untuk dosen wali', { exact: true }),
    ).toBeVisible();
  });
});

test.describe('every page in Indonesian', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: 'avenra_locale', value: 'id', url: webOrigin },
    ]);
  });

  // A raw message key such as "plan.save" means a translation is missing.
  const rawKey =
    /\b(nav|overview|plans?|study|profile|curriculum|method|errorpage|ws|finding|diag|suggest|solve|alt|advisor|assume|error|compare|passport|node|req|offer|common|rule|cap|status|lang)\.(?!json)[A-Za-z_]+/;

  async function expectNoRawKeys(page: Page) {
    const text = await page.locator('body').innerText();
    expect(text.match(rawKey)?.[0]).toBeUndefined();
  }

  test('translates Plans, Compare, Study, Profile and Methodology', async ({
    page,
  }) => {
    await openDemo(page);
    const pages: [string, string, string][] = [
      ['/', 'Sesuai jalur untuk semester 8.', 'Rencana studi'],
      ['/plans', 'Rencana Anda. Kemungkinan Anda.', 'Buat rencana'],
      ['/compare', 'Lihat untung ruginya dengan jelas.', 'Beri diri Anda'],
      ['/study', 'Beri rencana Anda sedikit fokus.', 'Ruang fokus'],
      ['/profile', 'Titik awal Anda.', 'Mata kuliah selesai'],
      [
        '/methodology',
        'Ketahui dasar penyusunan rencana Anda.',
        'Apa yang diperiksa',
      ],
      ['/start', 'Siapkan workspace Anda.', 'Tentang Anda'],
    ];
    for (const [path, heading, other] of pages) {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(other, { exact: false }).first(),
      ).toBeVisible();
      await expectNoRawKeys(page);
    }
    await expect(
      page.getByRole('combobox', { name: 'Ganti workspace' }),
    ).toBeVisible();
  });

  test('translates the error page, the plan editor and the passport', async ({
    page,
  }) => {
    await openDemo(page);
    await expectNoRawKeys(page);
    await page
      .getByRole('button', { name: 'Papan semester', exact: true })
      .click();
    await expectNoRawKeys(page);
    await page.getByRole('link', { name: 'Paspor', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Paspor Keputusan Akademik' }),
    ).toBeVisible();
    await expectNoRawKeys(page);
    await page.goto('/no-such-page');
    await expect(
      page.getByRole('heading', { name: 'Halaman itu tidak tersedia.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Kembali ke ringkasan' }),
    ).toBeVisible();
  });

  test('exports the calendar file with an Indonesian description', async ({
    page,
  }) => {
    await openDemo(page);
    await page.goto('/study');
    await page.getByLabel('Target spesifik').fill('Selesaikan latihan bab 3');
    await page.getByLabel('Tanggal target (opsional)').fill('2026-12-01');
    await page.getByRole('button', { name: 'Tambah target belajar' }).click();
    await expect(page.getByText('Selesaikan latihan bab 3')).toBeVisible();
    const download = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: 'Tambahkan target terbuka ke kalender saya (.ics)',
      })
      .click();
    const text = await (
      await import('node:fs/promises')
    ).readFile((await (await download).path())!, 'utf8');
    // Long lines are folded with CRLF + space (RFC 5545), so unfold before matching.
    const unfolded = text.replace(/\r\n /g, '');
    expect(unfolded).toContain('Target belajar untuk');
    expect(unfolded).toContain('Ditambahkan dari Avenra.');
    expect(text).toContain('BEGIN:VALARM');
  });

  test('reports a CSV import problem in Indonesian', async ({ page }) => {
    await page.goto('/start');
    await page.getByLabel('Alias mahasiswa').fill('Budi');
    await page.getByRole('button', { name: 'Lanjut' }).click();
    await page.getByLabel('Atau tempel isi CSV').fill('code,name\nIF1,Dasar');
    await expect(
      page.getByText('Kolom "SKS" tidak ditemukan', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Gunakan tabel ini' }),
    ).toBeDisabled();
  });
});
