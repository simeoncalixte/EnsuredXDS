import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withBadge = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/Badge.tsx'));
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
// color-mix(in srgb, fg 12%, transparent) painted over the page background.
const tint = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

test('statusTone maps every system submission status and falls back to surface', () =>
  withBadge(({ statusTone, isSubmissionSystemStatus, SUBMISSION_SYSTEM_STATUSES }) => {
    assert.deepEqual(
      Object.fromEntries(SUBMISSION_SYSTEM_STATUSES.map((s) => [s, statusTone(s)])),
      {
        draft: 'neutral',
        submitted: 'info',
        modeling: 'info',
        priced: 'info',
        approved: 'primary',
        rejected: 'danger',
        quoted: 'primary',
        bound: 'success',
      },
    );
    assert.equal(statusTone(' Bound '), 'success');
    assert.equal(statusTone('QUOTED'), 'primary');
    for (const other of ['Awaiting loss runs', '', null, undefined, '__proto__', 'toString'])
      assert.equal(statusTone(other), 'surface', String(other));
    assert.equal(isSubmissionSystemStatus('Rejected'), true);
    assert.equal(isSubmissionSystemStatus('hasOwnProperty'), false);
    assert.equal(isSubmissionSystemStatus(42), false);
  }));

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

test('Badge archived variant renders visible text and a hidden icon', () =>
  withBadge(({ Badge }) => {
    const render = (props) => renderToStaticMarkup(React.createElement(Badge, props));

    const archived = render({ variant: 'archived' });
    assert.match(archived, /data-xds-variant="archived"/);
    assert.match(archived, /<svg[^>]*aria-hidden="true"/);
    assert.match(archived, />Archived<\/span>$/);
    assert.match(
      render({ variant: 'archived', children: 'Archived 20 Nov 2026' }),
      /Archived 20 Nov 2026/,
    );
    // an empty-string child falls back to the visible "Archived" label.
    assert.match(render({ variant: 'archived', children: '' }), />Archived<\/span>$/);
    // dot is ignored for archived: the icon is the only leading mark.
    assert.equal(render({ variant: 'archived', dot: true }).match(/aria-hidden="true"/g).length, 1);

    const bound = render({ variant: 'success', dot: true, children: 'Bound' });
    assert.match(bound, /data-xds-variant="success"/);
    assert.doesNotMatch(bound, /<svg/);
    assert.match(bound, /Bound/);
  }));

// AIN-362: statusPresentation() and the Badge emphasis / icon props.
const expectedPresentations = {
  draft: { tone: 'neutral', emphasis: 'outline' },
  submitted: { tone: 'info', emphasis: 'outline' },
  modeling: { tone: 'info', emphasis: 'outline' },
  priced: { tone: 'info', emphasis: 'outline' },
  approved: { tone: 'success', emphasis: 'tint', icon: 'check' },
  rejected: { tone: 'danger', emphasis: 'tint', icon: 'cross' },
  quoted: { tone: 'warning', emphasis: 'tint', icon: 'arrowUpRight' },
  bound: { tone: 'success', emphasis: 'solid', icon: 'dot' },
};

test('statusPresentation maps every system status; tone matches statusTone except approved and quoted', () =>
  withBadge(({ statusPresentation, statusTone, SUBMISSION_SYSTEM_STATUSES }) => {
    assert.deepEqual(
      Object.fromEntries(SUBMISSION_SYSTEM_STATUSES.map((s) => [s, statusPresentation(s)])),
      expectedPresentations,
    );
    // Revised AC2 (PM 11154): the only tone differences from statusTone().
    const exceptions = { approved: 'success', quoted: 'warning' };
    for (const s of SUBMISSION_SYSTEM_STATUSES)
      assert.equal(statusPresentation(s).tone, exceptions[s] ?? statusTone(s), s);
    // statusTone() itself is unchanged.
    assert.equal(statusTone('approved'), 'primary');
    assert.equal(statusTone('quoted'), 'primary');
    for (const other of ['Awaiting loss runs', '', null, undefined, '__proto__', ' BOUND '])
      assert.equal(statusPresentation(other).tone, statusTone(other), String(other));
    assert.equal(statusPresentation(' Approved ').tone, 'success');
    assert.deepEqual(statusPresentation('Broker follow-up'), {
      tone: 'surface',
      emphasis: 'outline',
    });
    assert.deepEqual(statusPresentation(' Bound '), expectedPresentations.bound);
    // Approved vs declined and bound vs submitted never differ by hue alone.
    const p = statusPresentation;
    assert.notEqual(p('approved').icon, p('rejected').icon);
    assert.notEqual(p('bound').emphasis, p('submitted').emphasis);
    assert.ok(p('bound').icon);
  }));

// AC2b (PM 11154): approved and quoted never share declined's tone or fill, in either theme.
test('approved and quoted resolve to different tones and computed fills from declined', () =>
  withBadge(({ statusPresentation }) => {
    // Tint fill token for each tone, mirroring variantThemes in Badge.tsx.
    const tintBase = { success: 'success', warning: 'warning', danger: 'danger' };
    const declined = statusPresentation('rejected');
    for (const status of ['approved', 'quoted']) {
      const p = statusPresentation(status);
      assert.equal(p.emphasis, declined.emphasis, `${status} is tinted like declined`);
      assert.notEqual(p.tone, declined.tone, `${status} tone`);
      for (const theme of Object.values(xdsThemes)) {
        const c = theme.colors;
        const fill = (tone) => tint(rgb(c[tintBase[tone]]), rgb(c.surface), 0.12);
        const a = fill(p.tone).map((v) => Math.round(v * 255));
        const b = fill(declined.tone).map((v) => Math.round(v * 255));
        assert.notDeepEqual(a, b, `${theme.name} ${status} vs declined fill`);
        // and the tinted text stays at 4.5:1 on its own fill.
        for (const bg of [
          'background',
          'surface',
          'surfacePanel',
          'surfaceContainer',
          'surfaceRaised',
        ]) {
          const ratio = contrast(rgb(c[p.tone]), tint(rgb(c[p.tone]), rgb(c[bg]), 0.12));
          assert.ok(ratio >= 4.5, `${theme.name} ${status} tint on ${bg}: ${ratio.toFixed(2)}`);
        }
      }
    }
  }));

test('outline and solid badge text meets 4.5:1 in light and dark themes', () => {
  const backgrounds = [
    'background',
    'surface',
    'surfacePanel',
    'surfaceContainer',
    'surfaceRaised',
  ];
  // Must mirror variantInk / solidThemes in Badge.tsx.
  const ink = {
    primary: 'primarySoft',
    secondary: 'secondary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'onSurfaceVariant',
  };
  const solid = {
    primary: ['primary', 'onPrimary'],
    secondary: ['secondary', 'textInverse'],
    success: ['success', 'textInverse'],
    warning: ['warning', 'textInverse'],
    danger: ['danger', 'textInverse'],
    info: ['info', 'textInverse'],
    neutral: ['onSurface', 'surface'],
  };
  for (const theme of Object.values(xdsThemes)) {
    const c = theme.colors;
    for (const bg of backgrounds)
      for (const [tone, fg] of Object.entries(ink)) {
        const ratio = contrast(rgb(c[fg]), rgb(c[bg]));
        assert.ok(ratio >= 4.5, `${theme.name} outline ${tone} on ${bg}: ${ratio.toFixed(2)}`);
      }
    for (const [tone, [fill, fg]] of Object.entries(solid)) {
      const ratio = contrast(rgb(c[fg]), rgb(c[fill]));
      assert.ok(ratio >= 4.5, `${theme.name} solid ${tone}: ${ratio.toFixed(2)}`);
    }
  }
});

test('Badge emphasis and icon props render; omitting them keeps the default markup', () =>
  withBadge(({ Badge }) => {
    const render = (props) => renderToStaticMarkup(React.createElement(Badge, props));
    const plain = render({ variant: 'success', children: 'Bound' });
    assert.doesNotMatch(plain, /data-xds-emphasis/);
    assert.doesNotMatch(plain, /data-xds-icon/);

    const bound = render({ variant: 'success', emphasis: 'solid', icon: 'dot', children: 'Bound' });
    assert.match(bound, /data-xds-emphasis="solid"/);
    assert.match(bound, /<span[^>]*aria-hidden="true"[^>]*data-xds-icon="dot"/);
    assert.match(bound, /Bound<\/span>$/);

    for (const icon of ['check', 'cross', 'arrowUpRight']) {
      const html = render({ variant: 'primary', emphasis: 'tint', icon, children: 'X' });
      assert.match(html, new RegExp(`<svg[^>]*aria-hidden="true"[^>]*data-xds-icon="${icon}"`));
    }
    // icon wins over dot; archived keeps its own icon.
    assert.equal(
      render({ variant: 'danger', icon: 'cross', dot: true }).match(/aria-hidden="true"/g).length,
      1,
    );
    assert.doesNotMatch(render({ variant: 'archived', icon: 'check' }), /data-xds-icon/);
  }));
