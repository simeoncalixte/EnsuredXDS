import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

const withTextarea = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/Textarea.tsx'));
  } finally {
    await server.close();
  }
};

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

test('without showCount it renders a bare textarea (unchanged markup)', async () => {
  await withTextarea(async ({ default: Textarea }) => {
    const html = renderToStaticMarkup(
      React.createElement(Textarea, { maxLength: 500, 'aria-label': 'Notes' }),
    );
    assert.match(html, /^<textarea/);
    assert.match(html, /maxLength="500"/);
    assert.doesNotMatch(html, /role="status"/);
    assert.doesNotMatch(html, /aria-describedby/);
  });
});

test('showCount renders "n / max", links it with aria-describedby and keeps caller ids', async () => {
  await withTextarea(async ({ default: Textarea }) => {
    const html = renderToStaticMarkup(
      React.createElement(Textarea, {
        id: 'reason',
        maxLength: 500,
        showCount: true,
        value: 'Outside appetite',
        onChange: () => {},
        'aria-describedby': 'reason-hint',
      }),
    );
    assert.match(html, /aria-describedby="reason-hint reason-count"/);
    assert.match(html, /<p[^>]*id="reason-count"[^>]*>16 \/ 500<\/p>/);
    assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
    assert.ok(ids(html).has('reason-count'));
  });
});

test('at the limit the count says so in text, not colour only', async () => {
  await withTextarea(async ({ default: Textarea }) => {
    const html = renderToStaticMarkup(
      React.createElement(Textarea, {
        'aria-label': 'Reason',
        maxLength: 5,
        showCount: true,
        defaultValue: 'abcde',
      }),
    );
    assert.match(html, /data-at-limit="true"/);
    assert.match(html, /limit reached/);
  });
});

test('showCount without maxLength is ignored', async () => {
  await withTextarea(async ({ default: Textarea }) => {
    const html = renderToStaticMarkup(
      React.createElement(Textarea, { showCount: true, 'aria-label': 'Notes' }),
    );
    assert.match(html, /^<textarea/);
    assert.doesNotMatch(html, /-count/);
  });
});
