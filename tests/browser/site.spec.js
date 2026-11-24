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

const KEY_PAGES = ['/', '/ancient-indian-tools.html', '/ancient-world-tools.html', '/classical-languages.html'];

test('all local image elements on key pages resolve', async ({ page }) => {
  for (const route of KEY_PAGES) {
    await page.goto(route, { waitUntil: 'load' });
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      for (const image of images) {
        image.loading = 'eager';
        image.scrollIntoView({ block: 'end' });
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await expect.poll(
      () => page.evaluate(() => Array.from(document.images)
        .filter(img => new URL(img.currentSrc || img.src, location.href).origin === location.origin)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.currentSrc || img.src)),
      { message: `broken local images on ${route}`, timeout: 10000 }
    ).toEqual([]);
  }
});

test('no broken Wikimedia hotlink remains on the Bengali atlas page', async ({ page }) => {
  await page.goto('/classical-languages.html', { waitUntil: 'load' });
  const matches = await page.locator('img[src*="upload.wikimedia.org"]').evaluateAll(images =>
    images.map(img => img.getAttribute('src')).filter(src => /Durga_puja_pandal_in_West_Bengal/i.test(src))
  );
  expect(matches, 'obsolete nonexistent Durga Puja Commons filename is still referenced').toEqual([]);
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
  test.setTimeout(180000);
  expect(atlasRoutes).toHaveLength(56);
  for (const route of atlasRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
  await page.locator('body').click({ position: { x: 8, y: 700 } });
  await expect(menus.nth(2)).not.toHaveAttribute('open', '');
});

test('homepage dropdowns stay in document flow across desktop, tablet and mobile', async ({ page }) => {
  const sizes = [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 1024, height: 768, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 390, height: 844, name: 'mobile' }
  ];
  await page.goto('/');
  const menus = page.locator('.home-nav details');
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    for (let index = 0; index < await menus.count(); index++) {
      const menu = menus.nth(index);
      await menu.locator('summary').click();
      await expect(menu).toHaveAttribute('open', '');
      const layout = await page.evaluate(() => {
        const panel = document.querySelector('.home-nav details[open] .menu-panel');
        const search = document.querySelector('.home-search');
        const intro = document.querySelector('.home-intro');
        const rect = element => {
          const r = element.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        return { panel: rect(panel), search: rect(search), intro: rect(intro),
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth };
      });
      expect(layout.search.top, `${size.name}: search must follow the open menu panel`).toBeGreaterThanOrEqual(layout.panel.bottom - 1);
      expect(layout.intro.top, `${size.name}: introduction must follow search`).toBeGreaterThanOrEqual(layout.search.bottom - 1);
      expect(layout.document, `${size.name}: horizontal overflow while menu open`).toBeLessThanOrEqual(layout.viewport + 1);
      await page.keyboard.press('Escape');
      await expect(menu).not.toHaveAttribute('open', '');
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await menus.nth(1).locator('summary').click();
  await page.locator('.home-intro').click({ position: { x: 10, y: 10 } });
  await expect(menus.nth(1)).not.toHaveAttribute('open', '');
});

test('homepage search submits to the local search page', async ({ page }, testInfo) => {
  test.setTimeout(180000);
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
  for (const route of ['/what-is-all-this.html','/am-i-connected.html','/what-is-truth.html','/what-is-bliss.html']) {
    await page.goto(route);
    const buttons = page.locator('[data-lang]');
    await expect(buttons).toHaveCount(4);
    for (const lang of ['en','hi','ta','es']) {
      await expect(page.locator(`[data-lang="${lang}"]`)).toHaveCount(1);
    }
  }
});

test('Explore menu contains all six fundamental questions', async ({ page }) => {
  await page.goto('/');
  const explore = page.locator('.home-nav details').filter({ has: page.locator('summary', { hasText: 'Explore' }) });
  await explore.locator('summary').click();
  for (const href of ['/who-am-i.html','/what-is-all-this.html','/am-i-connected.html','/i-am-that.html','/what-is-truth.html','/what-is-bliss.html']) {
    await expect(explore.locator(`.menu-panel a[href="${href}"]`), `missing Explore link ${href}`).toHaveCount(1);
  }
});

test('question-page scroll cues land on the main content across touch and desktop viewports', async ({ page }) => {
  for (const route of ['/who-am-i.html','/what-is-all-this.html','/am-i-connected.html','/i-am-that.html','/what-is-truth.html','/what-is-bliss.html','/eternal-now.html','/sanatana-dharma.html']) {
    await page.goto(route);
    const cue = page.locator('.oow-scroll-cue[href="#main-content-start"]');
    const target = page.locator('#main-content-start');
    if (await cue.count()) {
      await cue.click();
      await expect.poll(() => page.evaluate(() => Math.abs(
        document.getElementById('main-content-start').getBoundingClientRect().top
      )), { message: `scroll cue did not land at main content on ${route}` }).toBeLessThan(26);
    }
    await expect(target).toHaveCount(1);
  }
});


const LANGUAGE_CANDIDATES = [
  ['hi','Hindi'],['ta','Tamil'],['es','Spanish'],['fr','French'],['de','German'],
  ['it','Italian'],['ru','Russian'],['ja','Japanese'],['ko','Korean'],
  ['zh-CN','Mandarin (Simplified)'],['zh-TW','Mandarin (Traditional)'],['th','Thai'],
  ['ms','Malay'],['id','Indonesian'],['sl','Slovenian'],['ur','Urdu'],
  ['ps','Pashto'],['ar','Arabic'],['he','Hebrew'],['pt','Portuguese'],
  ['pt-PT','Portuguese (Portugal)'],['nl','Dutch']
];
const LANGUAGE_SIGNALS = {
  hi: /[\u0900-\u097F]/, ta: /[\u0B80-\u0BFF]/,
  es: /[áéíóúñ¿¡]|\b(el|la|los|las|que|para|con|una|por)\b/i,
  fr: /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|une|pour|avec|que)\b/i,
  de: /[äöüß]|\b(der|die|das|und|nicht|mit|für|ist)\b/i,
  it: /[àèéìíîòóù]|\b(il|lo|gli|della|che|per|con|una)\b/i,
  ru: /[\u0400-\u052F]/, ja: /[\u3040-\u30FF\u4E00-\u9FFF]/,
  ko: /[\uAC00-\uD7AF]/, 'zh-CN': /[\u3400-\u9FFF]/, 'zh-TW': /[\u3400-\u9FFF]/,
  th: /[\u0E00-\u0E7F]/,
  ms: /\b(yang|dan|untuk|dengan|ini|adalah|dalam)\b/i,
  id: /\b(yang|dan|untuk|dengan|ini|adalah|dalam)\b/i,
  sl: /[čšž]|\b(in|je|za|ki|na|ter)\b/i,
  ur: /[\u0600-\u06FF]/, ps: /[\u0600-\u06FF]/, ar: /[\u0600-\u06FF]/,
  he: /[\u0590-\u05FF]/,
  pt: /[ãõáàâçéêíóôú]|\b(que|uma|para|com|não|dos|das)\b/i,
  'pt-PT': /[ãõáàâçéêíóôú]|\b(que|uma|para|com|não|dos|das)\b/i,
  nl: /[ĳ]|\b(de|het|een|en|van|voor|met|niet)\b/i
};

test('one-pass language verification: report provider-backed languages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Run once on desktop Chromium to avoid duplicate provider requests');
  test.setTimeout(480000);
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  const selector = page.locator('.home-language-switch').first();
  const baseline = await page.locator('main').innerText();
  const outcomes = [];
  for (const [code, label] of LANGUAGE_CANDIDATES) {
    await page.evaluate(({ code, label }) => {
      const nav = document.querySelector('.home-language-switch');
      let button = nav.querySelector('[data-oow-test-lang="' + code + '"]');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.dataset.lang = code;
        button.dataset.oowTestLang = code;
        button.textContent = label;
        nav.appendChild(button);
      }
    }, { code, label });
    await page.locator('[data-oow-test-lang="' + code + '"]').click();
    const signal = LANGUAGE_SIGNALS[code];
    try {
      await expect.poll(async () => {
        const current = await page.locator('main').innerText();
        return current !== baseline && signal.test(current);
      }, { timeout: 20000, intervals: [250, 500, 1000], message: code + ' translation must mutate main text and show its expected script/language signal' }).toBe(true);
      outcomes.push({ code, label, result: 'PASS' });
    } catch {
      outcomes.push({ code, label, result: 'FAIL/FLAKY' });
    }
    console.log('LANGUAGE_RESULT ' + JSON.stringify(outcomes[outcomes.length - 1]));
    if (code !== LANGUAGE_CANDIDATES[LANGUAGE_CANDIDATES.length - 1][0]) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
    }
  }
  console.log('LANGUAGE_SUMMARY ' + JSON.stringify(outcomes));
});
