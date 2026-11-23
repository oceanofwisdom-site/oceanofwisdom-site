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
