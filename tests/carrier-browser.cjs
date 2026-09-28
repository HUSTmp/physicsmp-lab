const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto(pathToFileURL(path.resolve('programs/舰载机起飞.html')).href);
 await page.waitForFunction(()=>document.querySelector('[data-field="prediction"]').textContent.length>0);
 assert.equal(await page.locator('#render-error').isVisible(),false);
 async function seek(t){await page.locator('#time').evaluate((e,t)=>{e.value=t;e.dispatchEvent(new Event('input'))},t)}
 async function values(id,field){return page.locator('#hud-'+id+' [data-field="'+field+'"]').textContent()}
 assert.equal(await values('catapult','rel-speed'),'10.00');
 await seek(9);
 assert.match(await values('catapult','status'),/已达标/);assert.match(await values('moving','status'),/已达标/);
 assert.equal(await values('catapult','run-time'),'6.67');assert.equal(await values('moving','run-time'),'8.16');
 assert.equal(await values('catapult','distance'),'200.00');assert.equal(await values('moving','world-speed'),'50.00');
 await page.locator('#carrier-speed').evaluate(e=>{e.value=1.01;e.dispatchEvent(new Event('input'))});await seek(9);assert.match(await values('moving','status'),/未达标/);
 await page.locator('[data-preset="none"]').click();await seek(9);assert.match(await values('catapult','status'),/未达标/);assert.match(await values('moving','status'),/未达标/);
 await page.locator('[data-preset="equal"]').click();await seek(9);assert.match(await values('catapult','status'),/未达标/);assert.match(await values('moving','status'),/已达标/);
 await page.locator('[data-preset="threshold"]').click();await page.locator('#play').click();await page.waitForTimeout(350);await page.locator('#play').click();let paused=await page.locator('#time').inputValue();await page.waitForTimeout(150);assert.equal(await page.locator('#time').inputValue(),paused);
 await page.locator('#reset').click();await page.locator('#step').click();assert.equal(await page.locator('#time-value').textContent(),'0.50 s');
 await seek(4);
 assert.equal(await page.locator('#carrier-distance').textContent(),'4.04 m');
 assert.match(await page.locator('#moving-view-label').textContent(),/×6.0/);
 const movingSpeed=await values('moving','world-speed');
 await page.locator('#enhance-motion').uncheck();
 assert.match(await page.locator('#moving-view-label').textContent(),/真实平移比例/);
 assert.equal(await values('moving','world-speed'),movingSpeed);
 assert.equal(await page.locator('#time-value').textContent(),'4.00 s');
 await page.locator('#enhance-motion').check();
 assert.equal(await page.locator('math msqrt').count(),4);
 await page.locator('[data-preset="none"]').click();await seek(4);
 assert.equal(await page.locator('#carrier-distance').textContent(),'0.00 m');
 await page.locator('[data-preset="threshold"]').click();await seek(4);
 await page.screenshot({path:'outputs/舰载机起飞-桌面.png',fullPage:true});
 await page.locator('.formula-stack').screenshot({path:'outputs/舰载机起飞-公式.png'});
 for(const width of [390,768,1024]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width)}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'outputs/舰载机起飞-手机.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1050});await page.locator('#fullscreen').click();assert.ok(await page.evaluate(()=>!!document.fullscreenElement));await page.locator('#fullscreen').click();
 await seek(100);assert.match(await page.locator('#play').textContent(),/重新/);await page.locator('#play').click();assert.ok(Number(await page.locator('#time').inputValue())<1);
 await page.goto(pathToFileURL(path.resolve('index.html')).href);assert.equal(await page.locator('a[href="programs/舰载机起飞.html"]').count(),1);await page.locator('a[href="programs/舰载机起飞.html"]').click();await page.waitForFunction(()=>document.querySelector('[data-field="prediction"]').textContent.length>0);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('PASS: offline WebGL, thresholds, presets, seeking, pause, step, replay, fullscreen, 390/768/1024 layouts, homepage navigation.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
