import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.argv[2] || 'storybook-static');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://local').pathname;
    if (pathname === '/nojs-film.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(await readFile(resolve('output/homepage-nojs.html')));
      return;
    }
    const p = resolve(root, '.' + pathname);
    if (!p.startsWith(root + '/')) throw Error();
    const data = await readFile(p);
    res.writeHead(200, { 'Content-Type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion,
    });
    const page = await context.newPage();
    await page.route('**/*', (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort(),
    );
    await page.goto(origin + '/iframe.html?id=xds-risk-globe--scroll-driven&viewMode=story');
    await page.locator('canvas[data-renderer-ready="true"]').waitFor();
    await page.waitForTimeout(800);
    const settle = async (y) => {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(100);
    };
    const pixels = () => page.locator('canvas').screenshot();
    await settle(0);
    const before = await pixels();
    await page.waitForTimeout(250);
    assert.ok(before.equals(await pixels()), 'stationary scroll changed pixels');
    await settle(450);
    const moved = await pixels();
    assert.ok(!before.equals(moved), 'scroll did not change rendered pixels');
    if (reducedMotion === 'reduce') {
      await settle(470);
      assert.ok(moved.equals(await pixels()), 'reduced motion moved inside one shot');
    }
    await settle(0);
    assert.ok(before.equals(await pixels()), 'reverse scroll did not restore same pixels');
    results.push({
      reducedMotion,
      stationary: true,
      scrollChangesPixels: true,
      reverseRestoresPixels: true,
      ...(reducedMotion === 'reduce' ? { staticWithinShot: true } : {}),
    });
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.route('**/*', (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort(),
    );
    await page.goto(origin + '/iframe.html?id=xds-risk-globe--theme-switch&viewMode=story');
    await page.locator('canvas[data-renderer-ready="true"]').waitFor();
    await page.waitForTimeout(600);
    const dark = await page.locator('canvas').screenshot();
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await page.waitForTimeout(100);
    assert.ok(
      !dark.equals(await page.locator('canvas').screenshot()),
      'theme did not update rendered pixels',
    );
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.waitForTimeout(100);
    assert.ok(
      dark.equals(await page.locator('canvas').screenshot()),
      'return to dark did not restore pixels',
    );
    results.push({ themeSwitch: true, darkRestoresPixels: true });
    await context.close();
  }
  for (const width of [1280, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.route('**/*', (route) =>
      route.request().url().startsWith(origin) ? route.continue() : route.abort(),
    );
    await page.goto(origin + '/nojs-film.html');
    assert.ok(
      await page.getByRole('heading', { name: 'Example homepage without JavaScript' }).isVisible(),
    );
    assert.ok(
      await page.getByRole('heading', { name: 'The carrier binds approved version 2' }).isVisible(),
    );
    await page.getByText('Read example details', { exact: true }).click();
    assert.ok(
      await page
        .getByText('Example source document, page 2. Confirmed by the broker.', { exact: true })
        .isVisible(),
    );
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: resolve(`output/nojs-film-${width}.png`), fullPage: true });
    results.push({
      javaScriptEnabled: false,
      width,
      fullStoryReadable: true,
      nativeDetails: true,
      noOverflow: true,
    });
    await context.close();
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
