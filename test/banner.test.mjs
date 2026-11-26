import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withBanner = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/Banner.tsx'));
  } finally {
    await server.close();
  }
};

const rgb = (hex) =>
  hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255);
const luminance = (channels) => {
  const l = channels.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return l[0] * 0.2126 + l[1] * 0.7152 + l[2] * 0.0722;
};
const contrast = (a, b) => {
  const x = luminance(rgb(a)),
    y = luminance(rgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

test('banner is a polite, named status with the tone in text, never colour alone', async () => {
  await withBanner(async ({ default: Banner }) => {
    const render = (props) => renderToStaticMarkup(React.createElement(Banner, props));
    const prefixes = { info: 'Information', warning: 'Warning', neutral: 'Notice' };
    for (const [tone, prefix] of Object.entries(prefixes)) {
      const html = render({ tone, title: 'Figures on this page are illustrative' });
      assert.match(html, /role="status"/);
      assert.doesNotMatch(html, /role="alert"|aria-live="assertive"/);
      assert.match(html, new RegExp(`${prefix}: </span>Figures on this page are illustrative`));
      assert.match(html, new RegExp(`data-tone="${tone}"`));
      const labelledBy = html.match(/aria-labelledby="([^"]+)"/)[1];
      assert.match(html, new RegExp(`id="${labelledBy}"`));
      assert.match(html, /<svg[^>]*aria-hidden="true"/);
    }
    // Default tone is info; body-only banners have no dangling aria-labelledby.
    const bodyOnly = render({ children: 'Premiums shown are examples.' });
    assert.match(bodyOnly, /data-tone="info"/);
    assert.match(bodyOnly, /Information: /);
    assert.doesNotMatch(bodyOnly, /aria-labelledby/);
    assert.match(render({ tone: 'warning', title: 'T', toneLabel: 'Expiring' }), /Expiring: /);
  });
});

test('dismiss button is named, and open=false renders nothing', async () => {
  await withBanner(async ({ default: Banner }) => {
    const render = (props) => renderToStaticMarkup(React.createElement(Banner, props));
    assert.doesNotMatch(render({ title: 'Read-only view' }), /<button/);
    assert.match(
      render({ title: 'Read-only view', dismissible: true }),
      /<button[^>]*type="button"[^>]*aria-label="Dismiss notice: Read-only view"/,
    );
    assert.match(render({ dismissible: true }), /aria-label="Dismiss notice"/);
    assert.match(
      render({ title: 'T', dismissible: true, dismissLabel: 'Hide illustrative notice' }),
      /aria-label="Hide illustrative notice"/,
    );
    assert.equal(render({ title: 'Read-only view', open: false }), '');
    assert.match(
      render({ title: 'T', action: React.createElement('a', { href: '#locations' }, 'Review') }),
      /<a href="#locations">Review<\/a>/,
    );
  });
});

test('banner text and tone icons meet WCAG 2.2 AA contrast on surfaceContainerLow', () => {
  for (const [name, theme] of Object.entries(xdsThemes)) {
    const c = theme.colors;
    const bg = c.surfaceContainerLow;
    assert.ok(contrast(c.onSurface, bg) >= 4.5, `${name} title`);
    assert.ok(contrast(c.onSurfaceVariant, bg) >= 4.5, `${name} body`);
    for (const icon of [c.info, c.warning, c.onSurfaceVariant])
      assert.ok(contrast(icon, bg) >= 3, `${name} icon ${icon}`);
  }
});
