import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

test('modal: alertdialog naming, description, busy and error states; closed renders nothing', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { default: Modal } = await server.ssrLoadModule('/src/components/Modal.tsx');
    const render = (props) =>
      renderToStaticMarkup(
        React.createElement(Modal, { open: true, title: 'Supersede quote?', ...props }),
      );

    assert.equal(render({ open: false }), '');

    const plain = render({});
    assert.match(plain, /role="dialog"/);
    assert.match(plain, /aria-modal="true"/);
    const labelledBy = plain.match(/aria-labelledby="([^"]+)"/)?.[1];
    assert.ok(labelledBy, 'dialog is labelled by its title');
    assert.match(plain, new RegExp(`<h3 id="${labelledBy.replace(/[:]/g, '\\:')}"`));
    assert.doesNotMatch(plain, /aria-describedby|aria-busy|role="alert"/);

    const alert = render({ role: 'alertdialog', describedBy: 'consequence', submitting: true });
    assert.match(alert, /role="alertdialog"/);
    assert.match(alert, /aria-describedby="consequence"/);
    assert.match(alert, /aria-busy="true"/);
    assert.match(alert, /aria-label="Close"[^>]*disabled=""|disabled=""[^>]*aria-label="Close"/);

    const withError = render({ role: 'alertdialog', error: 'Quote is unchanged.' });
    assert.match(withError, /role="alert"[^>]*>Quote is unchanged\./);
    assert.doesNotMatch(render({ error: '' }), /role="alert"/);

    const unnamed = render({ title: undefined, ariaLabel: 'Confirm bind' });
    assert.match(unnamed, /aria-label="Confirm bind"/);
    assert.doesNotMatch(unnamed, /aria-labelledby/);
  } finally {
    await server.close();
  }
});
