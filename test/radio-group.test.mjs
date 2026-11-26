import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withRadioGroup = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/RadioGroup.tsx'));
  } finally {
    await server.close();
  }
};

const options = [
  { value: 'approve', label: 'Approve', description: 'Moves SUB-8401 to Approved.' },
  { value: 'decline', label: 'Decline' },
];

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const describedByIds = (html) =>
  [...html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)].flatMap((m) => m[1].split(' '));

test('fieldset + legend with native radios and no default selection', async () => {
  await withRadioGroup(async ({ default: RadioGroup }) => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, { name: 'decision', legend: 'Decision', options }),
    );
    assert.match(html, /<fieldset[^>]*>\s*<legend[^>]*>Decision<\/legend>/);
    assert.equal((html.match(/type="radio"/g) ?? []).length, 2);
    assert.equal((html.match(/name="decision"/g) ?? []).length, 2);
    assert.doesNotMatch(html, /checked=""/);
    assert.doesNotMatch(html, /role="radiogroup"/);
  });
});

test('controlled value checks exactly one radio; null checks none', async () => {
  await withRadioGroup(async ({ default: RadioGroup }) => {
    const chosen = renderToStaticMarkup(
      React.createElement(RadioGroup, {
        name: 'decision',
        legend: 'Decision',
        options,
        value: 'decline',
        onChange: () => {},
      }),
    );
    assert.equal((chosen.match(/checked=""/g) ?? []).length, 1);
    assert.match(chosen, /<input[^>]*checked=""[^>]*value="decline"/);
    const none = renderToStaticMarkup(
      React.createElement(RadioGroup, {
        name: 'decision',
        legend: 'Decision',
        options,
        value: null,
        onChange: () => {},
      }),
    );
    assert.doesNotMatch(none, /checked=""/);
  });
});

test('every aria-describedby and aria-labelledby points to a real id', async () => {
  await withRadioGroup(async ({ default: RadioGroup }) => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, {
        name: 'decision',
        legend: 'Decision',
        hint: 'Choose one.',
        error: 'Choose Approve or Decline.',
        required: true,
        options,
      }),
    );
    const present = ids(html);
    const refs = describedByIds(html);
    assert.ok(refs.length >= 3);
    for (const ref of refs) assert.ok(present.has(ref), `missing id ${ref}`);
    assert.match(html, /Error: <\/span>Choose Approve or Decline\./);
    assert.match(html, /\(required\)/);
    assert.equal((html.match(/required=""/g) ?? []).length, 2);
    // the option without a description has no aria-describedby
    assert.match(html, /value="decline"(?![^>]*aria-describedby)[^>]*>/);
  });
});

test('disabled option keeps its reason linked; disabled group disables the fieldset', async () => {
  await withRadioGroup(async ({ default: RadioGroup }) => {
    const html = renderToStaticMarkup(
      React.createElement(RadioGroup, {
        name: 'decision',
        legend: 'Decision',
        options: [
          {
            value: 'approve',
            label: 'Approve',
            description: 'Not priced yet. Price SUB-8401 before approving.',
            disabled: true,
          },
          { value: 'decline', label: 'Decline' },
        ],
      }),
    );
    assert.equal((html.match(/disabled=""/g) ?? []).length, 1);
    const approve = html.match(/<input[^>]*value="approve"[^>]*>/)[0];
    assert.match(approve, /disabled=""/);
    const reasonId = approve.match(/aria-describedby="([^"]+)"/)[1];
    assert.match(html, new RegExp(`id="${reasonId}"[^>]*>Not priced yet\\.`));
    assert.match(html, /Not priced yet\. Price SUB-8401 before approving\./);
    const group = renderToStaticMarkup(
      React.createElement(RadioGroup, { name: 'd', legend: 'D', options, disabled: true }),
    );
    assert.match(group, /<fieldset[^>]*disabled=""/);
  });
});
