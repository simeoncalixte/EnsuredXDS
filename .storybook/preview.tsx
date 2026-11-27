import type { Decorator } from '@storybook/react';

import '../src/colors.css';
import '../src/styles.css';
import './preview.css';

import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';
import { XdsThemeProvider } from '../src/theme';

const withXdsTheme: Decorator = (Story) => (
  <XdsThemeProvider>
    <Story />
  </XdsThemeProvider>
);

const withLocationPathControl: Decorator = (Story, context) => {
  const locationPath = context.args?.locationPath;

  if (typeof locationPath === 'string' && locationPath.trim().length > 0) {
    const reactRouter = context.parameters.reactRouter ?? {};
    const currentLocation =
      typeof reactRouter.location === 'object' && reactRouter.location !== null
        ? reactRouter.location
        : {};

    context.parameters.reactRouter = {
      ...reactRouter,
      location: {
        ...currentLocation,
        path: locationPath,
      },
    };
  }

  // The addon types withRouter as () => any; at runtime it is a decorator.
  return (withRouter as unknown as Decorator)(Story, context);
};

export const decorators = [withXdsTheme, withLocationPathControl];

export const parameters = {
  options: {
    storySort: {
      order: [
        'Foundations',
        'Form Elements',
        'Actions',
        'Filters',
        'Navigation',
        'Page Layout',
        'Location',
        'Icons',
        'Modals',
        'Data Display',
        'Feedback',
        'Workflow',
        'Insurance',
        'Page Compositions',
      ],
      method: 'alphabetical',
    },
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
