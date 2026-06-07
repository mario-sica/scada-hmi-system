import { chromium } from './node_modules/playwright/index.js';

const SHOTS = '/tmp/scada-screenshots';
const BASE  = 'http://localhost:4200';

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page    = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(e.message));

// ── 1. SCADA dark ───────────────────────────────────────────────────────────
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/01-scada-dark.png` });

const theme  = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log('1. SCADA dark | data-theme:', theme, '| body-bg:', bodyBg);

const cardPad = await page.evaluate(() => {
  const el = document.querySelector('.machine-card');
  if (!el) return 'NOT FOUND';
  const s = getComputedStyle(el);
  return `L:${s.paddingLeft} R:${s.paddingRight} T:${s.paddingTop}`;
});
console.log('   .machine-card padding:', cardPad);

// ── 2. Theme toggle → light ─────────────────────────────────────────────────
await page.locator('.theme-toggle').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/02-scada-light.png` });
const themeL = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const bgL    = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log('2. Light | data-theme:', themeL, '| body-bg:', bgL);
await page.locator('.theme-toggle').click();
await page.waitForTimeout(300);

// ── 3. Dialog accesso M1 ────────────────────────────────────────────────────
await page.locator('.machine-card').first().click();
await page.waitForSelector('.p-dialog', { timeout: 4000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/03-dialog.png` });

const dlgPad = await page.evaluate(() => {
  const el = document.querySelector('.p-dialog-content');
  if (!el) return 'NOT FOUND';
  const s = getComputedStyle(el);
  return `L:${s.paddingLeft} R:${s.paddingRight} T:${s.paddingTop} B:${s.paddingBottom}`;
});
console.log('3. Dialog p-dialog-content padding:', dlgPad);

// ── 4. HMI M1 running ───────────────────────────────────────────────────────
await page.locator('#hmi-password').fill('1234');
await page.locator('button:has-text("Accedi")').click();
await page.waitForURL('**/hmi/M1', { timeout: 5000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/04-hmi-M1.png`, fullPage: true });

const m1Sensors = await page.evaluate(() =>
  [...document.querySelectorAll('.sensor-gauge')].map(g => ({
    l: g.querySelector('.sensor-gauge__label')?.textContent?.trim(),
    v: g.querySelector('.value-numeric')?.textContent?.trim(),
  }))
);
console.log('4. HMI M1 sensors:', m1Sensors);
console.log('   Negative RPM:', m1Sensors.find(s => s.l?.includes('elocit') && parseInt(s.v) < 0) ? 'YES (BUG)' : 'none (OK)');

// ── 5. HMI M2 stopped → sensori zero ────────────────────────────────────────
await page.goto(`${BASE}/scada`);
await page.waitForTimeout(1500);
await page.locator('.machine-card').nth(1).click();
await page.waitForSelector('.p-dialog', { timeout: 4000 });
await page.locator('#hmi-password').fill('2345');
await page.locator('button:has-text("Accedi")').click();
await page.waitForURL('**/hmi/M2', { timeout: 5000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/05-hmi-M2-stopped.png`, fullPage: true });

const m2Sensors = await page.evaluate(() =>
  [...document.querySelectorAll('.sensor-gauge')].map(g => ({
    l: g.querySelector('.sensor-gauge__label')?.textContent?.trim(),
    v: g.querySelector('.value-numeric')?.textContent?.trim(),
  }))
);
console.log('5. HMI M2 (stopped):', m2Sensors);
console.log('   Non-zero:', m2Sensors.filter(s => parseFloat(s.v) !== 0).length === 0 ? 'none (OK)' : m2Sensors.filter(s => parseFloat(s.v) !== 0));

// ── 6. SCADA + alarm banner ──────────────────────────────────────────────────
await page.goto(`${BASE}/scada`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SHOTS}/06-scada-alarms.png` });
const bannerVis = await page.locator('.alarm-banner').isVisible().catch(() => false);
const bannerTxt = await page.locator('.alarm-banner').textContent().catch(() => '');
console.log('6. Alarm banner:', bannerVis, '|', bannerTxt.trim().replace(/\s+/g,' ').slice(0, 80));

console.log('\nConsole errors:', errors.length ? errors : 'none');
await browser.close();
console.log('Done — screenshots in', SHOTS);
