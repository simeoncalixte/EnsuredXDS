import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

const moduleUrl = new URL('../dist/formatDateOnly.js', import.meta.url).href;
const cases = ['2027-01-01', '2026-12-31', '2028-02-29', '2027-07-15'];

// Run in a child process so the time zone is applied before any date code loads.
const formatIn = (tz) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { formatDateOnly } = await import(${JSON.stringify(moduleUrl)});
         process.stdout.write(JSON.stringify(${JSON.stringify(cases)}.map(formatDateOnly)));`,
      ],
      { env: { ...process.env, TZ: tz }, cwd: fileURLToPath(new URL('..', import.meta.url)) },
    ).toString(),
  );

test('formatDateOnly shows the same calendar day in every time zone', () => {
  const expected = ['01 Jan 2027', '31 Dec 2026', '29 Feb 2028', '15 Jul 2027'];
  for (const tz of ['America/Los_Angeles', 'Asia/Tokyo', 'UTC', 'Pacific/Kiritimati']) {
    assert.deepEqual(formatIn(tz), expected, tz);
  }
});

test('formatDateOnly rejects values that are not a real YYYY-MM-DD day', async () => {
  const { formatDateOnly, isDateOnly } = await import(moduleUrl);
  for (const bad of [
    null,
    undefined,
    '',
    '2027-02-29',
    '2027-13-01',
    '2027-00-10',
    '2027-04-31',
    '2027-1-1',
    '2027-01-01T00:00:00Z',
    ' 2027-01-01',
  ]) {
    assert.equal(formatDateOnly(bad), null, String(bad));
  }
  assert.equal(isDateOnly('2000-02-29'), true);
  assert.equal(isDateOnly('1900-02-29'), false);
  assert.equal(isDateOnly(20270101), false);
});

test('KeyValueList renders dl/dt/dd, date-only values, empty placeholders and a skeleton', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { KeyValueList } = await server.ssrLoadModule('/src/components/KeyValueList.tsx');
    const render = (props) => renderToStaticMarkup(React.createElement(KeyValueList, props));

    const html = render({
      columns: 3,
      items: [
        { label: 'Reference', value: 'SUB-10482', type: 'mono' },
        { label: 'Effective date', value: '2027-01-01', type: 'date-only' },
        { label: 'Expiry date', value: '2027-02-30', type: 'date-only' },
        { label: 'Underwriter', value: null },
      ],
    });
    assert.match(html, /^<dl[^>]*data-xds="key-value-list"/);
    assert.equal(html.match(/<dt/g).length, 4);
    assert.equal(html.match(/<dd/g).length, 4);
    assert.match(html, /<time datetime="2027-01-01">01 Jan 2027<\/time>/);
    assert.match(html, /2027-02-30/);
    assert.doesNotMatch(html, /<time datetime="2027-02-30"/);
    assert.match(html, /aria-hidden="true">—<\/span>/);
    assert.match(html, /Not set/);

    const loading = render({ items: [], loading: true, skeletonCount: 3 });
    assert.match(loading, /aria-busy="true"/);
    assert.match(loading, /Loading details/);
    assert.doesNotMatch(loading, /<dl|<dd/);

    assert.match(render({ items: [] }), /No details to show\./);
  } finally {
    await server.close();
  }
});
