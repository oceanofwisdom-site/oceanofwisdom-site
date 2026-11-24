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

test('homepage has one accessible language selector and routes chosen language to translation', async ({ page }) => {
  const externalRequests = [];
  page.on('request', request => {
    if (new URL(request.url()).hostname === 'translate.google.com') externalRequests.push(request.url());
  });
  await page.goto('/');
  const selector = page.locator('#home-translate-language');
  await expect(page.locator('.home-language-switch')).toHaveCount(1);
  await expect(page.locator('.home-translate-control > span:first-child')).toHaveText(/Translate/);
  await expect(selector).toBeAttached();
  await expect(selector.locator('option')).toHaveCount(109);
  await expect(selector.locator('option[value]:not([value=""])')).toHaveCount(108);
  expect(await selector.locator('option[value="hi"]').count()).toBe(1);
  expect(await selector.locator('option[value="ta"]').count()).toBe(1);
  expect(await selector.locator('option[value="es"]').count()).toBe(1);
  expect(externalRequests, 'translation provider must not load before visitor opts in').toEqual([]);
  await page.route('https://translate.google.com/**', route => route.fulfill({
    status: 200, contentType: 'text/html', body: '<title>Translation hand-off test</title>'
  }));
  await selector.selectOption('hi');
  await expect(page).toHaveURL(/www-oceanofwisdom-site\.translate\.goog/);
  const target = new URL(page.url());
  expect(target.searchParams.get('_x_tr_sl')).toBe('en');
  expect(target.searchParams.get('_x_tr_tl')).toBe('hi');
  expect(target.searchParams.get('_x_tr_hl')).toBe('en');
  expect(target.searchParams.get('_x_tr_pto')).toBe('wapp');
});


test('Google Translate proxy serves the live homepage in Hindi', async ({ page }) => {
  const url = 'https://www-oceanofwisdom-site.translate.goog/?_x_tr_sl=en&_x_tr_tl=hi&_x_tr_hl=en&_x_tr_pto=wapp';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response, 'Google Translate proxy should return a document').not.toBeNull();
  expect(response.status(), 'Google Translate proxy HTTP response').toBeLessThan(400);
  await expect(page.locator('main')).not.toBeEmpty();
  await page.waitForFunction(() => /[\u0900-\u097F]/.test(document.querySelector('main')?.innerText || ''), { timeout: 20000 });
  const bodyText = await page.locator('main').innerText();
  expect(bodyText.length, 'translated page should contain readable content').toBeGreaterThan(100);
  expect(bodyText, 'translated homepage should contain Devanagari output').toMatch(/[\u0900-\u097F]/);
});

test('Google Translate proxy serves the live homepage in Tamil', async ({ page }) => {
  const url = 'https://www-oceanofwisdom-site.translate.goog/?_x_tr_sl=en&_x_tr_tl=ta&_x_tr_hl=en&_x_tr_pto=wapp';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response, 'Google Translate proxy should return a document').not.toBeNull();
  expect(response.status(), 'Tamil proxy HTTP response').toBeLessThan(400);
  await expect(page.locator('main')).not.toBeEmpty();
  await page.waitForFunction(() => /[\u0B80-\u0BFF]/.test(document.querySelector('main')?.innerText || ''), { timeout: 20000 });
  const bodyText = await page.locator('main').innerText();
  expect(bodyText.length, 'Tamil homepage should contain readable content').toBeGreaterThan(100);
  expect(bodyText, 'Tamil homepage should contain Tamil-script output').toMatch(/[\u0B80-\u0BFF]/);
  console.log('Tamil homepage sample:', bodyText.slice(0, 1400));
});

test('Google Translate proxy serves the live homepage in Spanish', async ({ page }) => {
  const url = 'https://www-oceanofwisdom-site.translate.goog/?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=en&_x_tr_pto=wapp';
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response, 'Google Translate proxy should return a document').not.toBeNull();
  expect(response.status(), 'Spanish proxy HTTP response').toBeLessThan(400);
  await expect(page.locator('main')).not.toBeEmpty();
  await page.waitForFunction(() => /¿|¡|á|é|í|ó|ú|ñ|quién|qué|cómo|explorar|sabiduría|herramientas|conocimiento/i.test(document.querySelector('main')?.innerText || ''), { timeout: 20000 });
  const bodyText = await page.locator('main').innerText();
  expect(bodyText.length, 'Spanish homepage should contain readable content').toBeGreaterThan(100);
  expect(bodyText, 'Spanish homepage should contain Spanish translation markers').toMatch(/¿|¡|á|é|í|ó|ú|ñ|quién|qué|cómo|explorar|sabiduría|herramientas|conocimiento/i);
  console.log('Spanish homepage sample:', bodyText.slice(0, 1400));
});

const requestedLanguageChecks = [
  { name: 'Spanish', code: 'es', pattern: /\b(un punto de encuentro|descubra|sabiduría|conocimiento)\b/i },
  { name: 'Portuguese', code: 'pt', pattern: /\b(um ponto de encontro|descubra|sabedoria|conhecimento)\b/i },
  { name: 'Dutch', code: 'nl', pattern: /\b(een ontmoetingsplek|ontdek|kennis|geschiedenis)\b/i },
  { name: 'French', code: 'fr', pattern: /\b(un lieu de rencontre|découvrez|connaissance|sagesse)\b/i },
  { name: 'German', code: 'de', pattern: /\b(ein ort der begegnung|entdecken sie|wissen|weisheit)\b/i },
  { name: 'Italian', code: 'it', pattern: /\b(un punto d'incontro|scoprite|conoscenza|saggezza)\b/i },
  { name: 'Russian', code: 'ru', pattern: /[\u0400-\u04FF]/ },
  { name: 'Japanese', code: 'ja', pattern: /[\u3040-\u30FF\u4E00-\u9FFF]/ },
  { name: 'Korean', code: 'ko', pattern: /[\uAC00-\uD7AF]/ },
  { name: 'Mandarin (Simplified Chinese)', code: 'zh-CN', pattern: /[\u4E00-\u9FFF]/ },
  { name: 'Thai', code: 'th', pattern: /[\u0E00-\u0E7F]/ },
  { name: 'Malay', code: 'ms', pattern: /\b(titik pertemuan|terokai|pengetahuan|sejarah)\b/i },
  { name: 'Indonesian', code: 'id', pattern: /\b(tempat bertemu|jelajahi|pengetahuan|sejarah)\b/i },
  { name: 'Slovenian', code: 'sl', pattern: /\b(kraj srečevanja|odkrijte|znanje|zgodovinski)\b/i },
  { name: 'Urdu', code: 'ur', pattern: /[\u0600-\u06FF]/ },
  { name: 'Dari (Afghanistan)', code: 'fa', pattern: /[\u0600-\u06FF]/ },
  { name: 'Pashto (Afghanistan)', code: 'ps', pattern: /[\u0600-\u06FF]/ },
  { name: 'Arabic', code: 'ar', pattern: /[\u0600-\u06FF]/ },
  { name: 'Hebrew', code: 'he', pattern: /[\u0590-\u05FF]/ },
  { name: 'Hungarian', code: 'hu', pattern: /\b(találkozóhely|fedezze fel|tudás|történelmi)\b/i },
  { name: 'Turkish', code: 'tr', pattern: /\b(buluşma noktası|keşfedin|bilgi|tarihsel)\b/i },
  { name: 'Chinese (Traditional)', code: 'zh-TW', pattern: /[\u4E00-\u9FFF]/ }
];

for (const language of requestedLanguageChecks) {
  test(`Google Translate proxy serves the live homepage in ${language.name}`, async ({ page }) => {
    const url = `https://www-oceanofwisdom-site.translate.goog/?_x_tr_sl=en&_x_tr_tl=${encodeURIComponent(language.code)}&_x_tr_hl=en&_x_tr_pto=wapp`;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(response, `${language.name} proxy should return a document`).not.toBeNull();
    expect(response.status(), `${language.name} proxy HTTP response`).toBeLessThan(400);
    await expect(page.locator('main')).not.toBeEmpty();
    await page.waitForFunction(({ source, flags }) => new RegExp(source, flags).test(document.querySelector('main')?.innerText || ''), { source: language.pattern.source, flags: language.pattern.flags }, { timeout: 30000 }).catch(async () => {
      const sample = await page.locator('main').innerText();
      throw new Error(`${language.name}: target-language marker not detected in main content. Sample: ${sample.slice(0, 700)}`);
    });
    const mainText = await page.locator('main').innerText();
    expect(mainText.length, `${language.name} homepage should contain readable main content`).toBeGreaterThan(100);
    expect(mainText, `${language.name} main content should show target-language output`).toMatch(language.pattern);
    console.log(`${language.name} homepage sample:`, mainText.slice(0, 350));
  });
}
