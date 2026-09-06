# EnsuredXDS — shared UI library

`@ensured/xds` is the common React design system for EnsuredUI and future microfrontends. It owns reusable components, charts, theme providers, design tokens, CSS and their Storybook stories. I
## Develop

```sh
npm ci
npm run build
npm run storybook
```

`npm ci` also builds the package through its prepare script. Storybook runs on port 6006. `npm run dev` watches TypeScript and rebuilds JavaScript/declarations; run `npm run build` after changing CSS. Build Storybook with `npm run build-storybook`.

## Consume

The parent repository pins this project as a sibling submodule. EnsuredUI declares `"@ensured/xds": "file:../EnsuredXDS"`, resolving the compiled package through its public exports. It has no source alias back into this project.

```tsx
import { XdsThemeProvider, Button } from '@ensured/xds'
import '@ensured/xds/colors.css'
import '@ensured/xds/styles.css'

export function App() {
  return <XdsThemeProvider><Button>Continue</Button></XdsThemeProvider>
}
```

Component subpaths such as `@ensured/xds/components/Button`, and `@ensured/xds/theme`, `@ensured/xds/colors`, `@ensured/xds/tokens` are also supported. JavaScript and TypeScript declarations are emitted to `dist`. React, React DOM, styled-components, React Router and Recharts are peer dependencies, so the consuming application provides them. Router-aware navigation components require the host's router.

A consumer outside the parent can install a versioned archive produced by `npm pack`. The package is currently private and is not published to an npm registry. A private registry can replace the local dependency with a pinned version when independent deployment is introduced.

For future runtime composition, configure React, React DOM, styled-components, React Router **and `@ensured/xds`** as shared singletons; mount the theme provider in the host. Peer dependencies alone do not configure a federation runtime. This extraction creates the shared library; it does not add microfrontend routing, federation or independent deployment yet.

## Validation

```sh
npm test
npm run build-storybook
```

The package test installs the actual packed artifact into an isolated consumer and builds an application through the exported API. It also rejects source dependencies that escape the library directory. It uses the local npm cache; run `npm ci` first.

Typography uses Inter, Manrope and Material Symbols where available. The host owns font loading (or self-hosting); the library does not fetch fonts. Standalone Storybook loads them through its preview head.
