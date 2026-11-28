import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

const load = async (fn) => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    await fn(server);
  } finally {
    await server.close();
  }
};
const count = (html, re) => (html.match(re) ?? []).length;

test('AIN-322 PlannedList: labelled list rows, count in heading, no role, live region or button', async () => {
  await load(async (server) => {
    const { default: PlannedList } = await server.ssrLoadModule('/src/components/PlannedList.tsx');
    const render = (props) => renderToStaticMarkup(React.createElement(PlannedList, props));
    const items = [
      { title: 'Bound premium', summary: 'Premium bound by line.', when: 'Binding is enabled.' },
      { title: 'Loss ratio', summary: 'Incurred over earned.', when: 'Claims are connected.' },
    ];
    const html = render({ heading: 'Planned panels', items, headingLevel: 3 });
    assert.match(html, /<h3 [^>]*id="([^"]+)"[^>]*>Planned panels \(2\)<\/h3>/);
    const id = html.match(/<h3 [^>]*id="([^"]+)"/)[1];
    assert.match(html, new RegExp(`<ul [^>]*aria-labelledby="${id}"`));
    assert.equal(count(html, /<li /g), 2);
    assert.equal(count(html, /Appears once: /g), 2);
    assert.equal(count(html, /Will show: /g), 2);
    assert.doesNotMatch(html, /role="(alert|status)"|aria-live|<button/);
    assert.equal(render({ heading: 'Planned panels', items: [] }), '');
    assert.match(
      render({ heading: 'Planned panels', items: [], emptyMessage: 'All live.' }),
      /All live\./,
    );
  });
});

test('AIN-322 ResultsPanel and ResultMetricCard: announce defaults, error reference and admin details, zero vs unavailable', async () => {
  await load(async (server) => {
    const { default: Panel } = await server.ssrLoadModule('/src/components/ResultsPanel.tsx');
    const { default: Metric } = await server.ssrLoadModule('/src/components/ResultMetricCard.tsx');
    const panel = (props) =>
      renderToStaticMarkup(React.createElement(Panel, { title: 'Premium', ...props }));
    const metric = (props) =>
      renderToStaticMarkup(React.createElement(Metric, { label: 'Premium', ...props }));

    // Unavailable is silent by default; announce opts back in.
    const unavailable = panel({ state: 'unavailable', basis: 'Not measured yet.' });
    assert.doesNotMatch(unavailable, /role="(alert|status)"/);
    assert.match(unavailable, /Not measured yet\./);
    assert.match(panel({ state: 'unavailable', announce: true }), /role="status"/);
    assert.match(panel({ state: 'loading' }), /role="status"/);

    // Error: exactly one alert, Try again, reference without "quote", collapsed details.
    const error = panel({
      state: 'error',
      onRetry: () => {},
      reference: 'req_123',
      adminDetails: React.createElement('span', null, 'HTTP 503'),
    });
    assert.equal(count(error, /role="alert"/g), 1);
    assert.match(
      error,
      /We couldn&#x27;t load this panel\. The other panels aren&#x27;t affected\./,
    );
    assert.match(error, />Try again</);
    assert.doesNotMatch(error, />Retry</);
    assert.match(error, /Reference: <code>req_123<\/code>/);
    assert.doesNotMatch(error, /quote/i);
    assert.match(error, /<details[^>]*><summary>Technical details \(admins only\)<\/summary>/);
    assert.doesNotMatch(error, /<details[^>]*open/);
    assert.doesNotMatch(panel({ state: 'error', announce: false }), /role="alert"/);
    assert.match(panel({ headingLevel: 3 }), /<h3 /);

    // value 0 renders 0; null renders unavailable plus basis, never 0.
    const zero = metric({ value: 0, basis: 'Last 30 days' });
    assert.match(zero, />0</);
    assert.doesNotMatch(zero, /not available/);
    assert.match(metric({ value: '0' }), />0</);
    const missing = metric({ value: null, basis: 'Appears once claims are connected.' });
    assert.match(missing, /Data is not available/);
    assert.match(missing, /Appears once claims are connected\./);
    assert.doesNotMatch(missing, />0</);
    assert.doesNotMatch(missing, /role="(alert|status)"/);
  });
});
