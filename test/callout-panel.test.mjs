import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withCalloutPanel = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/CalloutPanel.tsx'));
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

const items = {
  is: ['A shortlist of markets whose appetite fits', 'A versioned record'],
  isnt: ['An insurer, carrier or broker'],
};

test('callout panel is a named region with two real, named lists and decorative icons', async () => {
  await withCalloutPanel(async ({ default: CalloutPanel }) => {
    const html = renderToStaticMarkup(
      React.createElement(CalloutPanel, { title: "What the platform is and isn't", items }),
    );
    const regionLabel = html.match(/<section[^>]*aria-labelledby="([^"]+)"/)[1];
    assert.match(
      html,
      new RegExp(`<h2[^>]*id="${regionLabel}"[^>]*>What the platform is and isn&#x27;t</h2>`),
    );
    const listLabels = [...html.matchAll(/<ul[^>]*aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(listLabels.length, 2);
    for (const id of listLabels) assert.match(html, new RegExp(`<h3[^>]*id="${id}"`));
    assert.match(html, />What it is<\/h3>/);
    assert.match(html, />What it isn&#x27;t<\/h3>/);
    assert.equal((html.match(/<li/g) ?? []).length, 3);
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    assert.equal(svgs.length, 3);
    for (const svg of svgs) assert.match(svg, /aria-hidden="true"/);
  });
});

test('heading level, custom labels and empty columns', async () => {
  await withCalloutPanel(async ({ default: CalloutPanel }) => {
    const render = (props) => renderToStaticMarkup(React.createElement(CalloutPanel, props));
    const nested = render({
      title: 'Facultative placement',
      items,
      headingLevel: 3,
      isLabel: 'Covered',
      isntLabel: 'Excluded',
    });
    assert.match(nested, /<h3[^>]*>Facultative placement<\/h3>/);
    assert.match(nested, /<h4[^>]*>Covered<\/h4>/);
    assert.match(nested, /<h4[^>]*>Excluded<\/h4>/);
    assert.doesNotMatch(nested, /<h2/);

    const empty = render({ title: 'T', items: { is: ['One'], isnt: [] } });
    assert.equal((empty.match(/<ul/g) ?? []).length, 1);
    assert.match(empty, /Nothing listed yet/);
    assert.match(
      render({ title: 'T', items: { is: [], isnt: [] }, emptyLabel: 'None recorded' }),
      /None recorded/,
    );
  });
});

test('callout panel text and icons meet WCAG 2.2 AA contrast on surfaceContainerLow', () => {
  for (const [name, theme] of Object.entries(xdsThemes)) {
    const c = theme.colors;
    const bg = c.surfaceContainerLow;
    assert.ok(contrast(c.onSurface, bg) >= 4.5, `${name} text`);
    assert.ok(contrast(c.onSurfaceVariant, bg) >= 4.5, `${name} empty label`);
    for (const icon of [c.success, c.onSurfaceVariant])
      assert.ok(contrast(icon, bg) >= 3, `${name} icon ${icon}`);
  }
});
