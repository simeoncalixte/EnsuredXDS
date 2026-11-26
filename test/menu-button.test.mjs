import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withMenuButton = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/MenuButton.tsx'));
  } finally {
    await server.close();
  }
};

const items = [
  { id: 'open', label: 'Open submission' },
  { id: 'refer', label: 'Refer to senior underwriter', hint: 'Above your binding authority' },
  { type: 'separator' },
  {
    type: 'group',
    label: 'Documents',
    items: [{ id: 'archive', label: 'Archive', disabled: true, hint: 'Bound' }],
  },
];
const radioGroup = {
  label: 'Move to a status',
  value: 'triage',
  sections: [
    { label: 'Intake', options: [{ value: 'draft', label: 'Draft' }] },
    {
      label: 'Underwriting',
      options: [
        { value: 'triage', label: 'Triage' },
        { value: 'approved', label: 'Approved', disabled: true, hint: 'Not priced yet.' },
      ],
    },
  ],
  onChange: () => {},
};

const ids = (html) => new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
const refs = (html) =>
  [...html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)].flatMap((m) =>
    m[1].split(' '),
  );

test('closed trigger is a named menu button with no menu in the DOM', async () => {
  await withMenuButton(async ({ default: MenuButton }) => {
    const html = renderToStaticMarkup(
      React.createElement(MenuButton, { label: 'More actions for SUB-8405', items }),
    );
    assert.match(html, /<button[^>]*type="button"/);
    assert.match(html, /aria-label="More actions for SUB-8405"/);
    assert.match(html, /aria-haspopup="menu"/);
    assert.match(html, /aria-expanded="false"/);
    assert.doesNotMatch(html, /role="menu"|aria-controls/);
    assert.match(html, /<svg[^>]*aria-hidden="true"/);
  });
});

test('open menu has items, groups, radios and only real id references', async () => {
  await withMenuButton(async ({ default: MenuButton }) => {
    const html = renderToStaticMarkup(
      React.createElement(MenuButton, {
        label: 'More actions for SUB-8405',
        items,
        radioGroup,
        defaultOpen: true,
      }),
    );
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /role="menu"/);
    assert.equal((html.match(/role="menuitem"/g) ?? []).length, 3);
    assert.equal((html.match(/role="menuitemradio"/g) ?? []).length, 3);
    assert.equal((html.match(/role="separator"/g) ?? []).length, 2);
    assert.equal((html.match(/role="group"/g) ?? []).length, 4);
    assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
    assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 2);
    assert.match(html, />Current</);
    assert.match(html, />Not priced yet\.</);
    // Items are not in the tab order; focus is roving.
    assert.doesNotMatch(html, /role="menuitem(?:radio)?"[^>]*tabindex="0"/);
    const known = ids(html);
    for (const ref of refs(html)) assert.ok(known.has(ref), `dangling reference ${ref}`);
  });
});

test('disabled trigger never opens, and visible trigger text is rendered', async () => {
  await withMenuButton(async ({ default: MenuButton }) => {
    const html = renderToStaticMarkup(
      React.createElement(MenuButton, {
        label: 'Move SUB-8405 to another status',
        triggerText: 'Move',
        items,
        disabled: true,
        defaultOpen: true,
      }),
    );
    assert.match(html, /disabled=""/);
    assert.match(html, /<span>Move<\/span>/);
    assert.doesNotMatch(html, /role="menu"/);
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

test('menu text meets WCAG 2.2 AA contrast on its surface and on the focused row', () => {
  for (const [name, theme] of Object.entries(xdsThemes)) {
    const c = theme.colors;
    for (const bg of [c.surfaceContainer, c.surfaceContainerHigh]) {
      assert.ok(contrast(c.onSurface, bg) >= 4.5, `${name} label on ${bg}`);
      assert.ok(contrast(c.onSurfaceVariant, bg) >= 4.5, `${name} hint on ${bg}`);
      assert.ok(contrast(c.primary, bg) >= 3, `${name} check icon on ${bg}`);
    }
  }
});
