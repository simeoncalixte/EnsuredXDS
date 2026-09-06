

// @ts-ignore
import '../src/colors.css'
import '../src/styles.css'
import './preview.css'
// @ts-ignore

import React from 'react'
import { withRouter } from 'storybook-addon-remix-react-router'
import { XdsThemeProvider } from '../src/theme'

const withXdsTheme = (Story: any) => (
  <XdsThemeProvider>
    <Story />
  </XdsThemeProvider>
)

const withLocationPathControl = (Story: any, context: any) => {
  const locationPath = context.args?.locationPath

  if (typeof locationPath === 'string' && locationPath.trim().length > 0) {
    const reactRouter = context.parameters.reactRouter ?? {}
    const currentLocation = typeof reactRouter.location === 'object' && reactRouter.location !== null ? reactRouter.location : {}

    context.parameters.reactRouter = {
      ...reactRouter,
      location: {
        ...currentLocation,
        path: locationPath,
      },
    }
  }

  return (withRouter as any)(Story, context)
}

export const decorators = [withXdsTheme, withLocationPathControl]

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  }
}
