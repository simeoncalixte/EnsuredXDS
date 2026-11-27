import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { xdsThemes } from '../dist/palette.js';

// Load the component source through Vite SSR (as the other component tests do).
const withChecklist = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/OnboardingChecklist.tsx'));
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
  const x = luminance(rgb(a)),
    y = luminance(rgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const conditions = [
  {
    id: 'a',
    title: 'Subjectivities cleared',
    status: 'met',
    detail: 'Cleared 27 Nov 2026, 14:05 ET',
  },
  {
    id: 'b',
    title: 'Signed application received',
    status: 'not-met',
    href: '#documents',
    linkLabel: 'Go to documents',
  },
  { id: 'c', title: 'Within your binding authority', status: 'bypassed' },
];

test('readiness variant: named list, text status, summary id, link, and no progress or dismiss', async () => {
  await withChecklist(async ({ default: OnboardingChecklist }) => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingChecklist, {
        variant: 'readiness',
        title: 'Ready to bind',
        ariaLabel: 'Ready to bind checklist',
        summary: '1 of 3 conditions not met.',
        summaryId: 'bind-summary',
        steps: conditions,
        onDismiss: () => {},
      }),
    );
    assert.match(html, /<ul[^>]*aria-label="Ready to bind checklist"/);
    assert.match(html, /<p[^>]*id="bind-summary"[^>]*>1 of 3 conditions not met\.<\/p>/);
    assert.equal((html.match(/<li/g) ?? []).length, 3);
    assert.match(html, /Met: <\/span>Subjectivities cleared/);
    assert.match(html, /Not met · <\/span>Signed application received/);
    assert.match(html, /Bypassed · <\/span>Within your binding authority/);
    assert.match(html, /<a[^>]*href="#documents"[^>]*>Go to documents<\/a>/);
    // Every icon is decorative; the status text carries the meaning.
    assert.equal((html.match(/aria-hidden="true"[^>]*>[✓✕–]</g) ?? []).length, 3);
    assert.doesNotMatch(html, /role="progressbar"/);
    assert.doesNotMatch(html, /Dismiss/);
  });
});

test('readiness variant maps onboarding statuses, and onboarding maps readiness statuses', async () => {
  await withChecklist(async ({ toReadinessStatus, toOnboardingStatus }) => {
    assert.deepEqual(
      ['complete', 'current', 'todo', 'met', 'not-met', 'bypassed'].map(toReadinessStatus),
      ['met', 'not-met', 'not-met', 'met', 'not-met', 'bypassed'],
    );
    assert.deepEqual(
      ['complete', 'current', 'todo', 'met', 'not-met', 'bypassed'].map(toOnboardingStatus),
      ['complete', 'current', 'todo', 'complete', 'todo', 'complete'],
    );
  });
});

test('readiness loading renders aria-hidden skeleton rows and no summary id', async () => {
  await withChecklist(async ({ default: OnboardingChecklist }) => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingChecklist, {
        variant: 'readiness',
        summary: 'x',
        summaryId: 'bind-summary',
        loading: true,
        loadingRows: 4,
        steps: conditions,
      }),
    );
    assert.match(html, /<ul aria-hidden="true" data-loading="true"/);
    assert.equal((html.match(/<li/g) ?? []).length, 4);
    assert.doesNotMatch(html, /id="bind-summary"/);
    assert.doesNotMatch(html, /Subjectivities cleared/);
  });
});

test('readiness empty state and list falls back to the title as its name', async () => {
  await withChecklist(async ({ default: OnboardingChecklist }) => {
    const empty = renderToStaticMarkup(
      React.createElement(OnboardingChecklist, {
        variant: 'readiness',
        steps: [],
        emptyMessage: 'No bind conditions apply.',
      }),
    );
    assert.match(empty, /No bind conditions apply\./);
    assert.doesNotMatch(empty, /<ul/);

    const named = renderToStaticMarkup(
      React.createElement(OnboardingChecklist, { variant: 'readiness', steps: conditions }),
    );
    const titleId = named.match(/<h3[^>]*id="([^"]+)"/)[1];
    assert.match(named, new RegExp(`<ul[^>]*aria-labelledby="${titleId}"`));
  });
});

test('onboarding variant is unchanged: progress bar, dismiss, Next up badge', async () => {
  await withChecklist(async ({ default: OnboardingChecklist }) => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingChecklist, {
        steps: [
          { id: 'a', title: 'Define your appetite', status: 'complete' },
          { id: 'b', title: 'Connect a channel', status: 'current' },
        ],
        onDismiss: () => {},
      }),
    );
    assert.match(html, /role="progressbar"/);
    assert.match(html, /1 of 2 complete/);
    assert.match(html, /aria-label="Dismiss onboarding checklist"/);
    assert.match(html, /Next up/);
  });
});

test('readiness status colours meet WCAG contrast on the card surface in both themes', () => {
  for (const [name, theme] of Object.entries(xdsThemes)) {
    const c = theme.colors;
    const card = c.surfaceContainerHigh;
    // Text: "Not met ·" (danger), detail and "Bypassed ·" (on-surface-variant): 4.5:1.
    assert.ok(contrast(c.danger, card) >= 4.5, `${name}: danger text ${contrast(c.danger, card)}`);
    assert.ok(
      contrast(c.onSurfaceVariant, card) >= 4.5,
      `${name}: detail text ${contrast(c.onSurfaceVariant, card)}`,
    );
    // Icons (non-text graphics): 3:1 against the card, glyph on the met fill 4.5:1.
    assert.ok(contrast(c.secondary, card) >= 3, `${name}: met fill ${contrast(c.secondary, card)}`);
    assert.ok(
      contrast(c.surface, c.secondary) >= 4.5,
      `${name}: met glyph ${contrast(c.surface, c.secondary)}`,
    );
  }
});
