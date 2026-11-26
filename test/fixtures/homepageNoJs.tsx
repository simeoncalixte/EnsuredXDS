import React from 'react';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import ScrollFilm from '../../src/components/ScrollFilm.js';
import RiskGlobe from '../../src/components/RiskGlobe.js';
export function renderNoJs() {
  const sheet = new ServerStyleSheet();
  try {
    const body = renderToString(
      sheet.collectStyles(
        <ScrollFilm
          hero={<h1>Example homepage without JavaScript</h1>}
          shots={[
            {
              id: 'mechanics',
              title: 'A person confirms the AI draft',
              beats: [
                { label: 'Platform', content: <p>Example: AI structures a draft.</p> },
                { label: 'Broker', content: <p>The broker confirms the source-linked fields.</p> },
              ],
              detailLabel: 'Read example details',
              details: <p>Example source document, page 2. Confirmed by the broker.</p>,
            },
            {
              id: 'reserves',
              title: 'The carrier binds approved version 2',
              beats: [
                { label: 'Client', content: <p>The client approves D v2.</p> },
                { label: 'Carrier', content: <p>An authorized carrier underwriter binds D v2.</p> },
              ],
            },
          ]}
          renderVisual={(frame) => (
            <RiskGlobe
              {...frame}
              fallback
              markers={[
                {
                  id: 'sample',
                  label: 'Example US origin',
                  longitude: -80,
                  latitude: 26,
                  kind: 'origin',
                },
              ]}
            />
          )}
        />,
      ),
    );
    return { body, styles: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
}
