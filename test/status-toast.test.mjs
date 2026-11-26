import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withToast = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/StatusToast.tsx'));
  } finally {
    await server.close();
  }
};

const statusCount = (html) => (html.match(/role="status"/g) ?? []).length;

test('empty toast still mounts one polite, atomic status region and no buttons', async () => {
  await withToast(async ({ default: StatusToast }) => {
    const html = renderToStaticMarkup(React.createElement(StatusToast, { message: null }));
    assert.equal(statusCount(html), 1);
    assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
    assert.doesNotMatch(html, /<button/);
    assert.match(html, /data-open="false"/);
  });
});

test('neutral toast with Undo: message in the region, one action button, no autofocus', async () => {
  await withToast(async ({ default: StatusToast }) => {
    const html = renderToStaticMarkup(
      React.createElement(StatusToast, {
        message: 'SUB-8401 moved from New to Triage.',
        action: { label: 'Undo', onAction: () => {} },
      }),
    );
    assert.equal(statusCount(html), 1);
    assert.match(html, /aria-atomic="true"[^>]*>SUB-8401 moved from New to Triage\.<\/p>/);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
    assert.match(html, /<button[^>]*type="button"[^>]*>Undo<\/button>/);
    assert.doesNotMatch(html, /autofocus|tabindex="-1"|Dismiss message/i);
    assert.doesNotMatch(html, /role="alert"/);
    assert.match(html, /<svg[^>]*aria-hidden="true"/);
  });
});

test('error toast has a hidden prefix and a named close button', async () => {
  await withToast(async ({ default: StatusToast }) => {
    const html = renderToStaticMarkup(
      React.createElement(StatusToast, {
        tone: 'error',
        message: 'Undo failed. SUB-8401 is still in Triage.',
      }),
    );
    assert.match(html, /data-tone="error"/);
    assert.match(html, />Error: <\/span>Undo failed\. SUB-8401 is still in Triage\.<\/p>/);
    assert.match(html, /<button[^>]*aria-label="Dismiss message"/);
    assert.equal((html.match(/<button/g) ?? []).length, 1);
  });
});

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

test('toast text, icons and button borders meet WCAG 2.2 AA in both themes', () => {
  for (const [name, theme] of Object.entries(xdsThemes)) {
    const c = theme.colors;
    // Neutral: text and the action's currentColor border on the toast surface (and its hover).
    for (const bg of [c.surfaceContainerHighest, c.surfaceContainerHigh]) {
      assert.ok(contrast(c.onSurface, bg) >= 4.5, `${name} neutral text on ${bg}`);
    }
    // Error: text, icon and button borders use onErrorContainer on errorContainer.
    assert.ok(
      contrast(c.onErrorContainer, c.errorContainer) >= 4.5,
      `${name} error text on errorContainer`,
    );
    assert.ok(
      contrast(c.onErrorContainer, c.surfaceContainerHigh) >= 4.5,
      `${name} error action text on its hover background`,
    );
  }
});
