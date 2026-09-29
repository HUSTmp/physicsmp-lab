const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    fs.mkdirSync('outputs', { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    assert.equal(await page.locator('.featured-grid .experiment-card').count(), 4);
    assert.deepEqual(await page.locator('.featured-grid .card-button').evaluateAll(es => es.map(e => e.getAttribute('href'))), [
      'programs/追及相遇.html', 'programs/舰载机起飞.html', 'programs/匀变速直线运动.html', 'programs/机械能守恒动画.html'
    ]);
    assert.equal(await page.locator('.hero-stats b').first().textContent(), '06');
    const desktop = await page.locator('.featured-grid .experiment-card').evaluateAll(es => es.map(e => ({ x: e.offsetLeft, y: e.offsetTop })));
    assert.equal(desktop[0].y, desktop[1].y); assert.equal(desktop[2].y, desktop[3].y); assert.ok(desktop[2].y > desktop[0].y);
    await page.locator('#experiments').screenshot({ path: 'outputs/精选实验-桌面.png' });
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow at ' + width);
      const cards = await page.locator('.featured-grid .experiment-card').first().boundingBox(); assert.ok(cards.width > 0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#experiments').screenshot({ path: 'outputs/精选实验-手机.png' });
    await page.locator('.all-experiments a').click();
    assert.equal(await page.locator('.module-experiment-grid .experiment-card').count(), 6);
    assert.match(await page.locator('.module-summary').textContent(), /已上线 6 个实验/);
    const links = await page.locator('.module-experiment-grid .card-button').evaluateAll(es => es.map(e => e.getAttribute('href')));
    for (const link of links) assert.ok(fs.existsSync(path.resolve('modules', link)), link);
    await page.locator('a[href="../programs/追及相遇.html"]').click();
    await page.locator('#catch-event').click();
    assert.equal(await page.locator('#car-speed').textContent(), '12.00');
    assert.equal(await page.locator('#distance').textContent(), '0.00');
    assert.deepEqual(errors, []);
    console.log('PASS: four featured cards, desktop 2×2 grid, six-experiment catalogue, all catalogue links, mobile layouts and pursuit navigation.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
