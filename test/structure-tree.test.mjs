import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import Ajv from 'ajv';

const withTree = async (fn) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    return await fn(await server.ssrLoadModule('/src/components/StructureTree.tsx'));
  } finally {
    await server.close();
  }
};

const nodes = [
  {
    id: 'locations',
    kind: 'section',
    label: 'Locations',
    kindLabel: 'List 1–50',
    repeatable: true,
    children: [
      {
        id: 'buildings',
        kind: 'subsection',
        label: 'Buildings',
        kindLabel: 'Table',
        children: [
          {
            id: 'tiv',
            kind: 'component',
            label: 'Total insured value',
            locked: { reason: 'rating' },
          },
          { id: 'sprinklers', kind: 'component', label: 'Sprinklers', markers: ['ai'] },
        ],
      },
    ],
  },
  { id: 'loss-history', kind: 'section', label: 'Loss history', markers: ['new'] },
];

const ids = (html) => new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
const refs = (html) =>
  [
    ...html.matchAll(/aria-(?:labelledby|describedby|controls|activedescendant)="([^"]+)"/g),
  ].flatMap((m) => m[1].split(' '));
const noop = () => {};
const editable = {
  onAddChild: noop,
  onMove: noop,
  onReorder: noop,
  onRemove: noop,
  onRename: noop,
};

test('renders a WAI-ARIA tree with levels, positions and one tab stop', async () => {
  await withTree(async ({ default: StructureTree }) => {
    const html = renderToStaticMarkup(
      React.createElement(StructureTree, { label: 'Property shape', nodes, ...editable }),
    );
    assert.match(html, /role="tree"[^>]*aria-label="Property shape"/);
    assert.equal((html.match(/role="treeitem"/g) ?? []).length, 5);
    assert.equal((html.match(/role="group"/g) ?? []).length, 3); // 2 nested groups + toolbar
    assert.match(html, /aria-level="3"[^>]*aria-posinset="1"[^>]*aria-setsize="2"/);
    assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
    // Only nodes with children carry aria-expanded.
    assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 2);
    for (const ref of refs(html)) assert.ok(ids(html).has(ref), `dangling reference ${ref}`);
  });
});

test('locked, repeatable and marker states are text, not colour alone', async () => {
  await withTree(async ({ default: StructureTree }) => {
    const html = renderToStaticMarkup(
      React.createElement(StructureTree, { label: 'Property shape', nodes, ...editable }),
    );
    assert.match(html, /Locked: <!-- -->rating|Locked: rating/);
    assert.match(html, />AI proposed</);
    assert.match(html, />New</);
    assert.match(html, />List 1–50</);
    assert.match(html, /<svg[^>]*aria-hidden="true"/);
  });
});

test('add controls stay focusable with a real reason when disabled', async () => {
  await withTree(async ({ default: StructureTree }) => {
    const html = renderToStaticMarkup(
      React.createElement(StructureTree, {
        label: 'Property shape',
        nodes,
        selectedId: 'buildings',
        maxDepth: 2,
        ...editable,
      }),
    );
    const sub = html.match(/<button[^>]*>Add sub-section<\/button>/)[0];
    assert.match(sub, /aria-disabled="true"/);
    assert.doesNotMatch(sub, / disabled=""/);
    const reasonId = sub.match(/aria-describedby="([^"]+)"/)[1];
    assert.match(
      html,
      new RegExp(`id="${reasonId}"[^>]*>Level limit reached: sections can nest 2 levels\\.<`),
    );
    const component = html.match(/<button[^>]*>Add component<\/button>/)[0];
    assert.doesNotMatch(component, /aria-disabled/);
    for (const ref of refs(html)) assert.ok(ids(html).has(ref), `dangling reference ${ref}`);
  });
});

test('a locked selection disables Move and Remove with the lock reason', async () => {
  await withTree(async ({ default: StructureTree }) => {
    const html = renderToStaticMarkup(
      React.createElement(StructureTree, {
        label: 'Property shape',
        nodes,
        selectedId: 'tiv',
        ...editable,
      }),
    );
    for (const name of ['Move…', 'Remove']) {
      const button = html.match(new RegExp(`<button[^>]*>${name}</button>`))[0];
      assert.match(button, /aria-disabled="true"/);
    }
    assert.match(html, />Total insured value is locked: rating\.</);
  });
});

test('read-only, empty and loading states', async () => {
  await withTree(async ({ default: StructureTree }) => {
    const readOnly = renderToStaticMarkup(
      React.createElement(StructureTree, { label: 'Shape', nodes, readOnly: true, ...editable }),
    );
    assert.doesNotMatch(readOnly, /<button/);
    assert.match(readOnly, /role="tree"/);

    const empty = renderToStaticMarkup(
      React.createElement(StructureTree, { label: 'Shape', nodes: [], ...editable }),
    );
    assert.doesNotMatch(empty, /role="tree"/);
    assert.match(empty, /No sections yet\. Add a section to start the shape\./);
    assert.match(empty, />Add section</);

    const loading = renderToStaticMarkup(
      React.createElement(StructureTree, { label: 'Shape', nodes, loading: true }),
    );
    assert.match(loading, /aria-hidden="true" data-part="skeleton"/);
    assert.match(loading, /role="status"[^>]*>Loading <!-- -->Shape|Loading Shape/);
    assert.doesNotMatch(loading, /role="tree"/);
  });
});

test('the registry dataSchema accepts nested nodes and rejects bad ones', () => {
  const registry = JSON.parse(
    readFileSync(new URL('../schema/component-registry.json', import.meta.url), 'utf8'),
  );
  const entry = registry.components.find((c) => c.id === 'xds.structure-tree');
  const validate = new Ajv({ strict: false }).compile(entry.dataSchema);
  assert.equal(validate(nodes), true);
  assert.equal(validate([{ id: 'x', kind: 'folder', label: 'X' }]), false);
  assert.equal(validate([{ id: 'x', kind: 'section', label: 'X', locked: true }]), false);
  assert.equal(
    validate([
      { id: 'x', kind: 'section', label: 'X', children: [{ id: 'y', kind: 'component' }] },
    ]),
    false,
  );
});
