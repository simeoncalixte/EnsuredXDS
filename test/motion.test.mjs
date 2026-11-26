import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

test('motion primitives expose the complete sequence and controls in server HTML without JS', async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { default: Sequence } = await server.ssrLoadModule('/src/components/SequenceReveal.tsx');
    const html = renderToStaticMarkup(
      React.createElement(
        Sequence,
        { label: 'Example workflow' },
        React.createElement('span', null, 'AI draft'),
        React.createElement('span', null, 'Person confirms'),
      ),
    );
    assert.match(html, /<ol[^>]*aria-label="Example workflow"/);
    assert.match(html, /<li><span>AI draft<\/span><\/li>/);
    assert.match(html, /<li><span>Person confirms<\/span><\/li>/);
    assert.doesNotMatch(html, /hidden|opacity:0|display:none/);
    const { default: Controls } = await server.ssrLoadModule(
      '/src/components/PlaybackControls.tsx',
    );
    const controls = renderToStaticMarkup(
      React.createElement(Controls, {
        playing: true,
        onPlayPause() {},
        onReplay() {},
        onSkip() {},
        intro: true,
      }),
    );
    for (const label of ['Pause motion', 'Skip intro', 'Replay'])
      assert.ok(controls.includes(label));
    assert.match(controls, /role="status"[^>]*aria-live="polite"/);
    const reduced = renderToStaticMarkup(
      React.createElement(Controls, {
        playing: true,
        onPlayPause() {},
        onReplay() {},
        onPrev() {},
        onNext() {},
        step: 0,
        total: 3,
        reducedMotion: true,
      }),
    );
    assert.doesNotMatch(reduced, /Pause motion|Skip intro|Replay/);
    assert.match(reduced, /Previous step/);
    assert.match(reduced, /Next step/);
  } finally {
    await server.close();
  }
});
