// Browser smoke test: drives the real UI end-to-end with Playwright.
// Title -> New Career -> NAMC 4S -> create team -> randomize logo -> start
// -> run a race weekend -> skip to result -> back to hub -> check standings.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.error(`  ❌ ${msg}`); }
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 900, height: 420 } }); // landscape phone
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  ok(await page.locator('.title-logo').isVisible(), 'title screen renders');

  await page.getByRole('button', { name: 'New Career' }).click();
  await page.locator('.choice-card', { hasText: 'North American Motocross' }).click();
  await page.locator('.choice-card', { hasText: 'Four-Stroke Championship' }).click();
  await page.locator('.choice-card', { hasText: 'Found your own team' }).click();

  await page.locator('input[type=text]').fill('Smoke Test Racing');
  await page.getByRole('button', { name: /Randomize/ }).click();
  ok(await page.locator('.logo-box svg').count() === 1, 'logo randomizer produced an SVG');

  await page.getByRole('button', { name: /Start Career/ }).click();
  await page.waitForSelector('.topbar');
  ok((await page.locator('.topbar b').textContent())?.includes('Smoke Test Racing'), 'hub shows player team');
  ok(await page.locator('.tabs button', { hasText: 'League Health' }).isVisible(), 'NAMC league health tab present');

  // Run a race weekend (this sims all 8 class fields + economy for round 1)
  await page.getByRole('button', { name: /Go Racing/ }).click();
  await page.waitForSelector('.tower-row', { timeout: 20000 });
  ok(await page.locator('.tower-row').count() >= 15, 'timing tower populated');

  await page.getByRole('button', { name: /Skip to result/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.waitForSelector('.tabs');

  await page.locator('.tabs button', { hasText: 'Standings' }).click();
  await page.waitForSelector('table.data tbody tr');
  const rows = await page.locator('table.data').first().locator('tbody tr').count();
  ok(rows >= 30, `standings table populated (${rows} rows)`);

  await page.locator('.tabs button', { hasText: 'League Health' }).click();
  ok((await page.locator('.content').textContent())?.includes('Revenue pool paid'), 'league health telemetry recorded');

  // save/continue cycle
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Continue Career' }).click();
  await page.waitForSelector('.topbar');
  ok((await page.locator('.season-chip').first().textContent())?.includes('NAMC'), 'save/continue works');

  ok(errors.length === 0, `no console/page errors (${errors.length})`);
  if (errors.length) console.error(errors.slice(0, 5));
} catch (err) {
  failures++;
  console.error('  💥 smoke test threw:', err);
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nSMOKE PASS' : `\nSMOKE FAIL (${failures})`);
process.exit(failures ? 1 : 0);
