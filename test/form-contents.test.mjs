import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withFormContents = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/FormContents.tsx'));
  } finally {
    await server.close();
  }
};

const items = [
  { id: 'insured', label: 'Insured', href: '#insured', status: { kind: 'complete' } },
  {
    id: 'locations',
    label: 'Locations',
    href: '#locations',
    status: { kind: 'issues', count: 1 },
    children: [
      {
        id: 'loc-1',
        label: 'Warehouse',
        href: '#loc-1',
        status: { kind: 'issues', count: 2 },
        children: [{ id: 'too-deep', label: 'Too deep', href: '#too-deep' }],
      },
    ],
  },
  {
    id: 'attachments',
    label: 'Attachments',
    href: '#attachments',
    status: { kind: 'text', text: 'Optional' },
  },
];

const groups = [
  {
    id: 'changes',
    title: 'Changes in this edit',
    summaryLabel: { one: 'change', other: 'changes' },
    items: [{ id: 'c1', label: 'Deductible', detail: 'USD 25,000.00 → USD 50,000.00', href: '#d' }],
  },
  { id: 'none', title: 'Not in this form', items: [] },
];

const render = (FormContents, props) =>
  renderToStaticMarkup(
    React.createElement(FormContents, {
      label: 'Form contents',
      heading: 'Contents · form v2',
      items,
      ...props,
    }),
  );

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const refs = (html) =>
  [...html.matchAll(/aria-(?:controls|labelledby|describedby)="([^"]+)"/g)].flatMap((m) =>
    m[1].split(' '),
  );

test('nav landmark with label, heading and ordered lists, two levels at most', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, {});
    assert.match(html, /<nav[^>]*aria-label="Form contents"/);
    assert.match(html, /<h2[^>]*>Contents · form v2<\/h2>/);
    assert.equal((html.match(/<ol/g) ?? []).length, 2);
    assert.match(html, /href="#loc-1"/);
    assert.doesNotMatch(html, /Too deep/);
  });
});

test('aria-current="location" only on the current item', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, { currentId: 'locations' });
    assert.equal((html.match(/aria-current="location"/g) ?? []).length, 1);
    assert.match(
      html,
      /<a[^>]*href="#locations"[^>]*aria-current="location"|<a[^>]*aria-current="location"[^>]*href="#locations"/,
    );
  });
});

test('status is text with an aria-hidden glyph, singular and plural', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, {});
    assert.match(html, /<span aria-hidden="true">✓ <\/span>Complete/);
    assert.match(html, /<span aria-hidden="true">● <\/span>1 issue</);
    assert.match(html, /2 issues/);
    assert.match(html, /Optional/);
  });
});

test('groups show their count, empty groups are hidden, ids referenced exist', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, { groups, id: 'fc' });
    assert.match(html, /Changes in this edit · 1/);
    assert.doesNotMatch(html, /Not in this form/);
    const known = ids(html);
    for (const ref of refs(html)) assert.ok(known.has(ref), `missing id ${ref}`);
  });
});

test('compact toggle summary counts sections, issues and summarised groups', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, { groups, compact: true });
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /Contents · 3 sections · 3 issues · 1 change</);
  });
});

test('loading draws skeleton items with aria-busy and no links', async () => {
  await withFormContents(async ({ default: FormContents }) => {
    const html = render(FormContents, { loading: true });
    assert.match(html, /<ol[^>]*aria-busy="true"/);
    assert.match(html, /Loading contents/);
    assert.doesNotMatch(html, /<a /);
  });
});
