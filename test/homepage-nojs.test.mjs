import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
test('homepage primitives render the full readable story, SVG and native details without JavaScript', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { renderNoJs } = await server.ssrLoadModule('/test/fixtures/homepageNoJs.tsx');
    const { body, styles } = renderNoJs();
    for (const text of [
      'Example homepage without JavaScript',
      'A person confirms the AI draft',
      'The carrier binds approved version 2',
      'Example US origin',
      'Read example details',
      'Example source document, page 2. Confirmed by the broker.',
    ])
      assert.ok(body.includes(text), text);
    assert.match(body, /<svg/);
    assert.match(body, /<details><summary>Read example details/);
    assert.doesNotMatch(body, /<script/);
    assert.match(styles, /data-styled/);
    const css =
      readFileSync(new URL('../dist/colors.css', import.meta.url), 'utf8') +
      readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
    const directory = new URL('../output/', import.meta.url);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      new URL('homepage-nojs.html', directory),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No-JS homepage fixture</title><style>${css}</style>${styles}</head><body>${body}</body></html>`,
    );
  } finally {
    await server.close();
  }
});
