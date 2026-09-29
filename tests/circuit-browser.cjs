const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  require('node:fs').mkdirSync('outputs', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    const read = id => page.locator('#' + id).textContent();
    const input = (id, value) => page.locator('#' + id).evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input')); }, value);
    await page.goto(pathToFileURL(path.resolve('programs/闭合电路内外电压.html')).href);
    assert.equal(await read('outer'), '4.00'); assert.equal(await read('inner'), '2.00');
    assert.equal(await page.locator('#level').isDisabled(), true);
    await input('external', 20); assert.equal(await read('outer'), '5.00'); assert.equal(await read('inner'), '1.00');
    await page.locator('#record').click();
    await page.locator('#mode-r').click(); assert.equal(await page.locator('#external').isDisabled(), true);
    await input('level', 20); assert.equal(await read('inner'), '2.00'); assert.equal(await read('outer'), '4.00');
    await page.locator('#record').click();
    const download = page.waitForEvent('download'); await page.locator('#export').click();
    const file = await download; assert.equal(file.suggestedFilename(), '内外电压实验记录.csv');
    const fs = require('node:fs'); const csv = fs.readFileSync(await file.path(), 'utf8'); assert.ok(csv.includes('5.00,1.00,6.00')); assert.equal(csv.trim().split('\n').length, 3);
    await page.locator('#switch').click(); assert.equal(await read('outer'), '6.00'); assert.equal(await read('inner'), '0.00'); assert.equal(await read('current'), '0.00'); assert.equal(await page.locator('#play').isDisabled(), true);
    await page.locator('#reset').click(); assert.equal(await read('outer'), '4.00'); assert.equal(await page.locator('#records-body tr').count(), 2);
    await page.locator('#play').click(); await page.waitForTimeout(250); await page.locator('#play').click();
    const paused = await read('outer'); await page.waitForTimeout(160); assert.equal(await read('outer'), paused);
    await page.locator('#play').click(); await page.waitForFunction(() => document.getElementById('demo-status').textContent.includes('完成'), { timeout: 12000 });
    assert.equal(await read('outer'), '5.00');
    await page.locator('#mode-r').click(); await page.locator('#play').click();
    await page.waitForFunction(() => document.getElementById('demo-status').textContent.includes('完成'), { timeout: 12000 });
    assert.equal(await read('inner'), '2.00');
    await page.locator('#reset').click();
    await page.screenshot({ path: 'outputs/内外电压-桌面.png', fullPage: true });
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow at ' + width);
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'outputs/内外电压-手机.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.locator('#fullscreen').click();
    assert.ok(await page.evaluate(() => !!document.fullscreenElement)); await page.screenshot({ path: 'outputs/内外电压-全屏.png', fullPage: true }); await page.locator('#fullscreen').click();
    await page.locator('#clear').click(); assert.equal(await page.locator('#export').isDisabled(), true);
    await page.goto(pathToFileURL(path.resolve('index.html')).href); await page.locator('a[href="modules/electromagnetism.html"]').click(); await page.locator('a[href="../programs/闭合电路内外电压.html"]').click(); assert.equal(await read('outer'), '4.00');
    assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    console.log('PASS: readings, controlled variables, sweeps, pause/resume, open circuit, records/CSV, reset, responsive layouts, fullscreen, offline navigation.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
