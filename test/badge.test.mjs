import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';
import {
  statusTone,
  isSubmissionSystemStatus,
  SUBMISSION_SYSTEM_STATUSES,
} from '../dist/components/Badge.js';

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
// color-mix(in srgb, fg 12%, transparent) painted over the page background.
const tint = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

test('statusTone maps every system submission status and falls back to surface', () => {
  assert.deepEqual(Object.fromEntries(SUBMISSION_SYSTEM_STATUSES.map((s) => [s, statusTone(s)])), {
    draft: 'neutral',
    submitted: 'info',
    modeling: 'info',
    priced: 'info',
    approved: 'primary',
    rejected: 'danger',
    quoted: 'primary',
    bound: 'success',
  });
  assert.equal(statusTone(' Bound '), 'success');
  assert.equal(statusTone('QUOTED'), 'primary');
  for (const other of ['Awaiting loss runs', '', null, undefined, '__proto__', 'toString'])
    assert.equal(statusTone(other), 'surface', String(other));
  assert.equal(isSubmissionSystemStatus('Rejected'), true);
  assert.equal(isSubmissionSystemStatus('hasOwnProperty'), false);
  assert.equal(isSubmissionSystemStatus(42), false);
});

test('status and archived badge text meets 4.5:1 in light and dark themes', () => {
  const backgrounds = [
    'background',
    'surface',
    'surfacePanel',
    'surfaceContainer',
    'surfaceRaised',
  ];
  // Tinted tones: text colour on a 12% tint of the same colour (see Badge variantThemes).
  const tinted = { primary: 'primarySoft', info: 'info', success: 'success', danger: 'danger' };
  for (const theme of Object.values(xdsThemes)) {
    const c = theme.colors;
    for (const bg of backgrounds) {
      for (const [tone, fg] of Object.entries(tinted)) {
        const tintBase = tone === 'primary' ? 'primary' : fg;
        const ratio = contrast(rgb(c[fg]), tint(rgb(c[tintBase]), rgb(c[bg]), 0.12));
        assert.ok(ratio >= 4.5, `${theme.name} ${tone} on ${bg}: ${ratio.toFixed(2)}`);
      }
    }
    // neutral, surface and archived share onSurfaceVariant on surfaceContainerHigh.
    const solid = contrast(rgb(c.onSurfaceVariant), rgb(c.surfaceContainerHigh));
    assert.ok(solid >= 4.5, `${theme.name} neutral/surface/archived: ${solid.toFixed(2)}`);
  }
});

test('Badge archived variant renders visible text and a hidden icon', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { Badge } = await server.ssrLoadModule('/src/components/Badge.tsx');
    const render = (props) => renderToStaticMarkup(React.createElement(Badge, props));

    const archived = render({ variant: 'archived' });
    assert.match(archived, /data-xds-variant="archived"/);
    assert.match(archived, /<svg[^>]*aria-hidden="true"/);
    assert.match(archived, />Archived<\/span>$/);
    assert.match(
      render({ variant: 'archived', children: 'Archived 20 Nov 2026' }),
      /Archived 20 Nov 2026/,
    );
    // dot is ignored for archived: the icon is the only leading mark.
    assert.equal(render({ variant: 'archived', dot: true }).match(/aria-hidden="true"/g).length, 1);

    const bound = render({ variant: 'success', dot: true, children: 'Bound' });
    assert.match(bound, /data-xds-variant="success"/);
    assert.doesNotMatch(bound, /<svg/);
    assert.match(bound, /Bound/);
  } finally {
    await server.close();
  }
});
