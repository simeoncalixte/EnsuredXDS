import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withDataTable = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/DataTable.tsx'));
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
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const rows = [
  { id: '10482', insured: 'Harborview Logistics LLC', ref: 'SUB-10482', updated: '23 Nov 2026' },
  { id: '10490', insured: null, ref: 'SUB-10490', updated: '22 Nov 2026', archived: true },
];
const columns = [
  {
    key: 'insured',
    header: 'Insured',
    render: (row) => row.insured ?? '—',
    href: (row) => `/underwriting/submissions/${row.id}`,
    linkLabel: (row) => (row.insured ? undefined : `Submission ${row.ref}, insured not set`),
    secondary: (row) => row.ref,
  },
  { key: 'updated', header: 'Last updated', sort: 'descending' },
];

test('DataTable fixed sort, link and two-line cells, muted rows and caption', () =>
  withDataTable(({ DataTable }) => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        data: rows,
        caption: 'Submissions, sorted by last updated, newest first',
        rowTone: (row) => (row.archived ? 'muted' : 'default'),
        rowKey: (row) => row.id,
      }),
    );
    assert.match(
      html,
      /<caption[^>]*>Submissions, sorted by last updated, newest first<\/caption>/,
    );
    // Fixed order: aria-sort on a non-interactive th, glyph hidden, no button anywhere.
    assert.match(
      html,
      /<th[^>]*scope="col"[^>]*aria-sort="descending"[^>]*>Last updated<span[^>]*aria-hidden="true"[^>]*>▼<\/span><\/th>/,
    );
    assert.equal(html.match(/aria-sort=/g).length, 1);
    assert.doesNotMatch(html, /<button/);
    // One link per row, on the chosen cell only; rows are not click targets.
    assert.equal(html.match(/<a /g).length, 2);
    assert.match(
      html,
      /<a [^>]*href="\/underwriting\/submissions\/10482"[^>]*>Harborview Logistics LLC<\/a>/,
    );
    assert.match(
      html,
      /<a [^>]*href="\/underwriting\/submissions\/10490"[^>]*aria-label="Submission SUB-10490, insured not set"/,
    );
    assert.match(html, />SUB-10482<\/span>/);
    assert.match(html, /<tr[^>]*data-xds-row-tone="default"/);
    assert.match(html, /<tr[^>]*data-xds-row-tone="muted"/);
    assert.doesNotMatch(html, /role="table"/);
  }));

test('DataTable onSort renders a header button; captionRef makes the caption focusable', () =>
  withDataTable(({ DataTable }) => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns: [{ ...columns[1], onSort: () => {} }],
        data: rows,
        caption: 'Submissions',
        captionHidden: true,
        captionRef: () => {},
      }),
    );
    assert.match(
      html,
      /<th[^>]*aria-sort="descending"[^>]*><button type="button"[^>]*>Last updated/,
    );
    assert.match(html, /<caption[^>]*tabindex="-1"[^>]*>Submissions<\/caption>/);
  }));

test('DataTable skeleton, text loading and stacked layout', () =>
  withDataTable(({ DataTable }) => {
    const skeleton = renderToStaticMarkup(
      React.createElement(DataTable, {
        columns,
        data: [],
        loading: true,
        skeletonRows: 8,
        loadingLabel: 'Loading submissions',
      }),
    );
    assert.match(skeleton, /<table[^>]*aria-busy="true"/);
    assert.equal(skeleton.match(/<tr[^>]*aria-hidden="true"/g).length, 8);
    assert.match(skeleton, /<caption[^>]*>Loading submissions<\/caption>/);
    assert.doesNotMatch(skeleton, /<a /);

    // Without skeletonRows the existing "Loading..." line is unchanged.
    const text = renderToStaticMarkup(
      React.createElement(DataTable, { columns, data: [], loading: true }),
    );
    assert.match(text, /role="status" aria-busy="true"[^>]*>Loading...<\/td>/);
    assert.doesNotMatch(text, /<table[^>]*aria-busy/);

    const stacked = renderToStaticMarkup(
      React.createElement(DataTable, { columns, data: rows, stacked: true }),
    );
    assert.match(stacked, /<table[^>]*role="table"/);
    assert.match(stacked, /<td[^>]*role="cell"[^>]*data-label="Insured"/);
    assert.match(stacked, /<th[^>]*role="columnheader"/);
  }));

test('DataTable legacy rows API is unchanged', () =>
  withDataTable(({ DataTable }) => {
    const html = renderToStaticMarkup(
      React.createElement(DataTable, {
        rows: [{ id: '#SY-1', tranche: 'Senior', value: '1.00', status: 'ACTIVE' }],
      }),
    );
    assert.match(html, /Contract ID/);
    assert.match(html, /#SY-1/);
    assert.doesNotMatch(html, /aria-sort|<caption|data-xds-row-tone/);
  }));

test('muted row and secondary-line text meet 4.5:1 in light and dark themes', () => {
  for (const theme of Object.values(xdsThemes)) {
    const c = theme.colors;
    for (const bg of [
      'background',
      'surface',
      'surfacePanel',
      'surfaceContainer',
      'surfaceRaised',
    ]) {
      const ratio = contrast(rgb(c.onSurfaceVariant), rgb(c[bg]));
      assert.ok(ratio >= 4.5, `${theme.name} onSurfaceVariant on ${bg}: ${ratio.toFixed(2)}`);
    }
  }
});

test('table is positioned so the hidden "Actions" header label cannot escape a scroll wrapper (AIN-361)', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { DataTable } = await server.ssrLoadModule('/src/components/DataTable.tsx');
    const { ServerStyleSheet } = await server.ssrLoadModule('styled-components');
    const sheet = new ServerStyleSheet();
    try {
      const html = renderToStaticMarkup(
        sheet.collectStyles(
          React.createElement(DataTable, {
            columns: [{ key: 'ref', header: 'Reference', render: (row) => row.ref }],
            data: [{ ref: 'SUB-10482' }],
            rowActions: () => React.createElement('button', { type: 'button' }, 'View'),
          }),
        ),
      );
      assert.match(html, /<span[^>]*>Actions<\/span>/);
      const tableClasses = html.match(/<table[^>]*class="([^"]+)"/)[1].split(/\s+/);
      const css = sheet.getStyleTags();
      const positioned = tableClasses.some((cls) =>
        new RegExp(`\\.${cls}\\{[^}]*position:relative`).test(css),
      );
      assert.ok(positioned, 'expected the <table> to have position: relative');
    } finally {
      sheet.seal();
    }
  } finally {
    await server.close();
  }
});
