import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

const luminance = (hex) => {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const text = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

test('FinancialValue renders each truthfulness state and never shows zero for unknown values', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { FinancialValue } = await server.ssrLoadModule('/src/components/FinancialValue.tsx');
    const render = (props) =>
      renderToStaticMarkup(
        React.createElement(FinancialValue, { locale: 'en-US', currency: 'USD', ...props }),
      );
    const visible = (html) => text(html.replace(/<span[^>]*role="tooltip"[^>]*>.*?<\/span>/s, ''));

    const verified = render({ amount: '4200000', state: 'verified', source: 'Ledger' });
    assert.match(visible(verified), /^USD\s4,200,000$/);
    assert.match(verified, /role="tooltip"[^>]*>Verified\. Source: Ledger\.</);
    assert.match(verified, /tabindex="0"/);
    assert.match(verified, /aria-describedby=/);

    assert.match(visible(render({ amount: '1250000', state: 'pending' })), /Pending/);
    assert.match(
      visible(render({ amount: '980000', state: 'estimated' })),
      /^≈\s*USD\s980,000 Estimate$/,
    );
    const example = render({ amount: '4200000', state: 'illustrative', scale: 'compact' });
    assert.match(visible(example), /^\$4\.2M USD Example$/);
    assert.match(example, /Full value: USD\s4,200,000\./);

    for (const props of [
      { amount: null, state: 'unavailable' },
      { amount: '0', state: 'unavailable' },
      { amount: null, state: 'verified' },
      { amount: null, state: 'pending' },
      { amount: null, state: 'estimated' },
      { amount: null, state: 'illustrative' },
      { amount: 'abc', state: 'verified' },
    ]) {
      const html = render(props);
      assert.equal(visible(html), 'Not available', JSON.stringify(props));
      assert.match(html, /data-state="unavailable"/);
      assert.doesNotMatch(visible(html), /0|—/);
    }
    assert.doesNotMatch(render({ amount: null, state: 'unavailable' }), /tabindex/);
    assert.match(
      render({ amount: null, state: 'unavailable', reason: 'No reconciled data yet.' }),
      /role="tooltip"[^>]*>No reconciled data yet\.</,
    );

    const mixed = render({ amount: null, state: 'mixed-currency', onViewByCurrency: () => {} });
    assert.match(visible(mixed), /^Multiple currencies View by currency$/);
    assert.doesNotMatch(
      visible(render({ amount: null, state: 'mixed-currency' })),
      /View by currency/,
    );

    const loading = render({ amount: '4200000', state: 'loading' });
    assert.match(loading, /aria-busy="true"/);
    assert.equal(visible(loading), '');

    const negative = render({ amount: '-12500.5', state: 'verified' });
    assert.match(visible(negative), /−/);
    assert.match(negative, /data-negative="true"/);
    assert.match(visible(render({ amount: '12.5', state: 'verified' })), /USD\s12\.50/);
    assert.match(
      visible(render({ amount: '0.125', currency: null, state: 'verified' })),
      /^0\.125$/,
    );
    assert.match(visible(render({ amount: '0', state: 'verified' })), /^USD\s0$/);

    assert.match(
      visible(render({ amount: '1', state: 'verified', asOf: '2026-01-05T09:30:00Z' })),
      /As of 5 Jan 2026, 09:30 UTC \(stale\)$/,
    );
    assert.doesNotMatch(
      visible(render({ amount: '1', state: 'verified', asOf: new Date().toISOString() })),
      /stale/,
    );
    assert.match(
      render({ amount: '1', state: 'verified', align: 'end' }),
      /data-xds="financial-value"/,
    );
  } finally {
    await server.close();
  }
});

test('FinancialValue text and focus colors meet contrast in light and dark themes', () => {
  const backgrounds = [
    'background',
    'surface',
    'surfacePanel',
    'surfaceContainer',
    'surfaceContainerLow',
  ];
  // Text roles used by the component: value, muted value/caption/pending chip,
  // negative value, estimate chip, example chip and stale caption.
  const textRoles = ['textPrimary', 'textSecondary', 'danger', 'info', 'warning'];
  for (const theme of Object.values(xdsThemes)) {
    const c = theme.colors;
    for (const bg of backgrounds) {
      for (const fg of textRoles) {
        const ratio = contrast(c[fg], c[bg]);
        assert.ok(ratio >= 4.5, `${theme.name} ${fg}/${bg}: ${ratio.toFixed(2)}`);
      }
      const focus = contrast(c.primary, c[bg]);
      assert.ok(focus >= 3, `${theme.name} focus/${bg}: ${focus.toFixed(2)}`);
    }
    const tooltip = contrast(c.onSurface, c.surfaceRaised);
    assert.ok(tooltip >= 4.5, `${theme.name} tooltip: ${tooltip.toFixed(2)}`);
  }
});
