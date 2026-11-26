import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

// Load the component source through Vite SSR (as the other component tests do), so
// styled-components resolves the same way it does in a bundler.
const withKanban = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/KanbanBoard.tsx'));
  } finally {
    await server.close();
  }
};

const stages = [
  { key: 'new', label: 'New' },
  {
    key: 'decision',
    label: 'Decision',
    tag: 'Decision',
    subheading: 'Referred, Approved, Declined',
    dropPreview: 'Drop to choose a decision: Approve or Decline',
  },
];
const items = [
  { id: 'SUB-8401', stageKey: 'new' },
  { id: 'SUB-8402', stageKey: 'new' },
];

test('KanbanBoard lanes have labelled headings with counts, tags and sub-headings', () =>
  withKanban(({ KanbanBoard }) => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanBoard, {
        stages,
        items,
        onMoveItem: () => {},
        ariaLabel: 'Underwriting board',
        renderCard: (item) => React.createElement('a', { href: `/s/${item.id}` }, item.id),
      }),
    );
    assert.match(html, /role="list"[^>]*aria-label="Underwriting board"/);
    // Each lane is labelled by its heading (h3 by default); the count is read as text.
    const lanes = html.match(/role="listitem"[^>]*aria-labelledby="([^"]+)"/g);
    assert.equal(lanes.length, 2);
    for (const lane of lanes) {
      const id = lane.match(/aria-labelledby="([^"]+)"/)[1];
      assert.match(html, new RegExp(`<h3[^>]*id="${id.replace(/[:]/g, '\\:')}"`));
    }
    assert.match(
      html,
      /<h3[^>]*><span>New<\/span><span aria-hidden="true"[^>]*>2<\/span><span[^>]*> \(2 items\)<\/span><\/h3>/,
    );
    assert.match(html, /> \(0 items\)</);
    assert.match(html, /data-xds-variant="neutral"[^>]*>Decision</);
    assert.match(html, /<p[^>]*>Referred, Approved, Declined<\/p>/);
    // Cards are list items; the board adds no interactive wrapper or role around them.
    assert.equal(html.match(/<li /g).length, 2);
    assert.doesNotMatch(html, /role="button"|tabindex=/);
    assert.equal(html.match(/<a /g).length, 2);
    assert.doesNotMatch(html, /aria-label="\d+ items"/);
    assert.match(html, />Drop cards here</);
  }));

test('KanbanBoard headingLevel, draggable=false and emptyLabel', () =>
  withKanban(({ KanbanBoard }) => {
    const html = renderToStaticMarkup(
      React.createElement(KanbanBoard, {
        stages,
        items,
        onMoveItem: () => {},
        draggable: false,
        headingLevel: 2,
        renderCard: (item) => item.id,
      }),
    );
    assert.equal(html.match(/<h2/g).length, 2);
    assert.doesNotMatch(html, /draggable="true"/);
    assert.match(html, />No items</);
    const custom = renderToStaticMarkup(
      React.createElement(KanbanBoard, {
        stages,
        items: [],
        onMoveItem: () => {},
        emptyLabel: 'No submissions in this stage',
        renderCard: (item) => item.id,
      }),
    );
    assert.equal(custom.match(/>No submissions in this stage</g).length, 2);
  }));

test('KanbanBoard renderCard context: requestMove honours onMoveRequest vetoes', () =>
  withKanban(async ({ KanbanBoard }) => {
    const contexts = {};
    const moves = [];
    const answers = { decision: false };
    const render = (onMoveRequest) =>
      renderToStaticMarkup(
        React.createElement(KanbanBoard, {
          stages,
          items,
          onMoveItem: (id, to) => moves.push([id, to]),
          onMoveRequest,
          renderCard: (item, context) => {
            contexts[item.id] = context;
            return item.id;
          },
        }),
      );
    render((id, to) => Promise.resolve(answers[to]));
    assert.equal(contexts['SUB-8401'].movePending, false);
    // Vetoed: the card stays put.
    assert.equal(await contexts['SUB-8401'].requestMove('decision'), false);
    assert.deepEqual(moves, []);
    // Same lane and unknown lanes never call the hook.
    assert.equal(await contexts['SUB-8401'].requestMove('new'), false);
    assert.equal(await contexts['SUB-8401'].requestMove('nope'), false);
    // A rejected promise is a veto.
    render(() => Promise.reject(new Error('cancelled')));
    assert.equal(await contexts['SUB-8402'].requestMove('decision'), false);
    assert.deepEqual(moves, []);
    // Allowed: applied through onMoveItem.
    answers.decision = true;
    render((id, to) => answers[to]);
    assert.equal(await contexts['SUB-8402'].requestMove('decision'), true);
    // No hook: moves straight away.
    render(undefined);
    assert.equal(await contexts['SUB-8401'].requestMove('decision'), true);
    assert.deepEqual(moves, [
      ['SUB-8402', 'decision'],
      ['SUB-8401', 'decision'],
    ]);
  }));
