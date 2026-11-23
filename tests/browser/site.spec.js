const { test, expect } = require('@playwright/test');

const routes = [
  '/',
  '/explore.html',
  '/search.html',
  '/what-is-all-this.html',
  '/am-i-connected.html',
  '/i-am-that.html',
  '/what-is-truth.html',
  '/what-is-bliss.html',
  '/classical-languages.html',
  '/classical-languages/translator.html',
  '/ancient-indian-tools.html',
  '/ancient-world-tools.html',
  '/library/index.html',
  '/calendar/'
];

test('homepage renders without horizontal overflow or failed local assets', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(dimensions.document, 'horizontal overflow on homepage').toBeLessThanOrEqual(dimensions.viewport + 1);
  const brokenImages = await page.locator('img').evaluateAll(images =>
    images.filter(img => img.getAttribute('src') && img.complete && img.naturalWidth === 0)
      .map(img => img.currentSrc || img.src)
  );
  expect(brokenImages, 'broken or unloaded homepage images').toEqual([]);
  expect(pageErrors, 'uncaught JavaScript errors').toEqual([]);
});

for (const route of routes) {
  test(`route loads: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response, `no document response for ${route}`).not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
  });
}

test('all rendered image elements on key pages resolve', async ({ page }) => {
  for (const route of ['/', '/ancient-indian-tools.html', '/ancient-world-tools.html', '/classical-languages.html']) {
    await page.goto(route);
    const images = page.locator('img[src]');
    const imageCount = await images.count();

    // Lazy-loaded gallery images must be brought into view before their
    // load state can be judged. Otherwise a valid loading="lazy" image can
    // still have naturalWidth === 0 simply because it has not been requested.
    for (let index = 0; index < imageCount; index++) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(
        () => image.evaluate(img => img.complete && img.naturalWidth > 0),
        { message: `image failed to load: ${await image.getAttribute('src')}`, timeout: 15000 }
      ).toBe(true);
    }
    const broken = await images.evaluateAll(elements =>
      elements.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src)
    );
    expect(broken, `broken images on ${route}`).toEqual([]);
  }
});


const atlasRoutes = [
  '/classical-languages.html',
  '/classical-languages-hi.html',
  '/classical-languages-ta.html',
  '/classical-languages-es.html',
  ...['assamese','bengali','kannada','malayalam','marathi','odia','pali','prakrit','sanskrit','tamil','telugu']
    .flatMap(name => ['', '-hi', '-ta', '-es'].map(suffix => `/classical-languages/${name}${suffix}.html`)),
  ...['', '-hi', '-ta', '-es'].map(suffix => `/classical-languages/connections${suffix}.html`),
  ...['', '-hi', '-ta', '-es'].map(suffix => `/classical-languages/translator${suffix}.html`)
];

test('all 56 Classical Languages Atlas routes load with four-way language navigation', async ({ page }) => {
  expect(atlasRoutes).toHaveLength(56);
  for (const route of atlasRoutes) {
    const response = await page.goto(route);
    expect(response, `no response for Atlas route ${route}`).not.toBeNull();
    expect(response.status(), `HTTP status for Atlas route ${route}`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('a.lang-btn')).toHaveCount(4);
    await expect(page.locator('a.lang-btn.active')).toHaveCount(1);
    await expect(page.locator('a.home')).toHaveCount(1);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, `missing document language on ${route}`).toBeTruthy();
  }
});

test('homepage dropdowns open exclusively and close with Escape or outside click', async ({ page }) => {
  await page.goto('/');
  const menus = page.locator('.home-nav details');
  await expect(menus).toHaveCount(6);
  await menus.nth(0).locator('summary').click();
  await expect(menus.nth(0)).toHaveAttribute('open', '');
  await menus.nth(1).locator('summary').click();
  await expect(menus.nth(1)).toHaveAttribute('open', '');
  await expect(menus.nth(0)).not.toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(menus.nth(1)).not.toHaveAttribute('open', '');
  await menus.nth(2).locator('summary').click();
  await page.locator('.home-intro').click();
  await expect(menus.nth(2)).not.toHaveAttribute('open', '');
});

test('homepage search submits to the local search page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Run the full sitemap-indexing interaction once on desktop Chromium');
  await page.goto('/');
  await page.locator('.home-search input[name="q"]').fill('astronomy');
  await page.locator('.home-search button[type="submit"]').click();
  await expect(page).toHaveURL(/\/search\.html\?q=astronomy/);
  await expect(page.locator('#site-search-query')).toHaveValue('astronomy');
  await expect(page.locator('#search-status')).toContainText(/found across|indexing website pages|Preparing the site search index/i, { timeout: 120000 });
  await expect(page.locator('#search-results')).not.toBeEmpty({ timeout: 120000 });
});

test('core question pages expose all four language controls', async ({ page }) => {
  for (const route of ['/what-is-all-this.html','/am-i-connected.html','/i-am-that.html','/what-is-truth.html','/what-is-bliss.html']) {
    await page.goto(route);
    const buttons = page.locator('[data-lang]');
    await expect(buttons).toHaveCount(4);
    for (const lang of ['en','hi','ta','es']) {
      await expect(page.locator(`[data-lang="${lang}"]`)).toHaveCount(1);
    }
  }
});
