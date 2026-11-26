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
    const p = resolve(root, '.' + new URL(req.url, 'http://local').pathname);
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
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
