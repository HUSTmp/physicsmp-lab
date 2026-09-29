const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [], network = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    await page.goto(pathToFileURL(path.resolve('programs/追及相遇.html')).href);
    const content = id => page.locator('#' + id).textContent();
    const input = (id, value) => page.locator('#' + id).evaluate((element, value) => { element.value = value; element.dispatchEvent(new Event('input')); }, value);
    assert.equal(await content('car-speed'), '0.00');
    await page.locator('#equal-event').click();
    assert.equal(await content('distance'), '6.00'); assert.equal(await content('car-speed'), '6.00');
    assert.match(await content('phase'), /距离最远/);
    await page.screenshot({ path: 'outputs/追及相遇-桌面.png', fullPage: true });
    await page.locator('#catch-event').click();
    assert.equal(await content('distance'), '0.00'); assert.equal(await content('car-speed'), '12.00');
    const transforms = await page.locator('#car,#bike').evaluateAll(elements => elements.map(e => e.transform.baseVal.getItem(0).matrix.e));
    assert.equal(transforms[0], transforms[1]); assert.match(await content('car-equation'), /24.00 m/);
    await input('time', 5); assert.equal(await content('distance'), '7.50'); assert.equal(await content('leader'), '汽车');
    assert.match(await content('gap-equation'), /− 37.50 = -7.50/);
    await page.locator('#speed').selectOption('2');
    await input('time', 1.9); await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#phase').textContent.includes('距离最远') && document.querySelector('#play').getAttribute('aria-pressed') === 'false');
    assert.equal(await content('time-value'), '2.00 s'); assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#phase').textContent.includes('再次相遇') && document.querySelector('#play').getAttribute('aria-pressed') === 'false');
    assert.equal(await content('time-value'), '4.00 s');
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#play').textContent.includes('重新播放'));
    assert.equal(await content('time-value'), '5.00 s');
    await page.locator('#play').click(); await page.waitForTimeout(120); await page.locator('#play').click();
    const paused = await content('time-value'); await page.waitForTimeout(100); assert.equal(await content('time-value'), paused);
    await page.locator('#reset').click(); await page.locator('#step').click(); assert.equal(await content('time-value'), '0.10 s');
    await page.locator('#auto-pause').uncheck(); await input('time', 1.95); await page.locator('#play').click();
    await page.waitForTimeout(250); await page.locator('#play').click(); assert.ok(Number(await page.locator('#time').inputValue()) > 2);
    for (const [a, u] of [[1, 12], [6, 2], [3.5, 7]]) {
      await input('acceleration', a); await input('bicycle-speed', u); assert.equal(await content('time-value'), '0.00 s');
      await page.locator('#equal-event').click(); assert.equal(await content('distance'), (u * u / (2 * a)).toFixed(2));
      await page.locator('#catch-event').click(); assert.equal(await content('distance'), '0.00'); assert.equal(await content('car-speed'), (2 * u).toFixed(2));
    }
    await page.locator('#original').click(); assert.equal(await content('parameter-mode'), '原题');
    await page.locator('#equal-event').click();
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow: ' + width);
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'outputs/追及相遇-手机.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.locator('#fullscreen').click();
    assert.ok(await page.evaluate(() => !!document.fullscreenElement)); await page.screenshot({ path: 'outputs/追及相遇-全屏.png', fullPage: true });
    await page.locator('#fullscreen').click();
    await page.goto(pathToFileURL(path.resolve('index.html')).href); await page.locator('a[href="programs/追及相遇.html"]').click();
    assert.equal(await content('time-value'), '0.00 s');
    assert.deepEqual(errors, []); assert.deepEqual(network, []);
    console.log('PASS: physics readouts, exact event pause/resume, overtime/replay, parameter boundaries, pause/step/seek, offline navigation, fullscreen and responsive layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
