# EnsuredXDS — shared UI library

`@ensured/xds` is the common React design system for EnsuredUI and future microfrontends. It owns reusable components, charts, theme providers, design tokens, CSS and their Storybook stories.

## Develop

```sh
npm ci
npm run build
npm run storybook
```

`npm ci` also builds the package through its prepare script. Storybook runs on port 6006. `npm run dev` watches TypeScript and rebuilds JavaScript/declarations; run `npm run build` after changing CSS. Build Storybook with `npm run build-storybook`.

## Consume

The parent repository pins this project as a sibling submodule. Consumers declare `"@ensured/xds": "npm:@simeoncalixte/ensured-xds@0.1.0"` and install the registry artifact from their lockfile. Sibling source/build aliases, package mounts and npm links are not supported.

```tsx
import { XdsThemeProvider, Button } from '@ensured/xds';
import '@ensured/xds/colors.css';
import '@ensured/xds/styles.css';

export function App() {
  return (
    <XdsThemeProvider>
      <Button>Continue</Button>
    </XdsThemeProvider>
  );
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

### Schema component registry

`@ensured/xds/schema/component-registry.json` exposes form controls and UI section
components, versions, field types, descriptions, and public component exports.
The generated manifest includes the entire registry. The older API, workbench,
and pipeline shared `xds-components.json` catalogs contain only the IDs in
`schema/form-catalog-components.json`, which have existing workbench adapters.
Use `npm run sync:schema-registry` to update those three copies and
`npm run check:schema-registry` to verify parity. Add a workbench adapter before
adding an ID to that legacy catalog allowlist. Registering a component in the
generated manifest makes its definition available to `UiRefiner`; it does not
implement runtime rendering or data binding for it.

### Generate prop schemas from TypeScript

```sh
npm run generate:component-manifest
# Also copy the result into the sibling pipeline shared package:
npm run generate:component-manifest -- --sync
# Check both generated copies without writing:
npm run generate:component-manifest -- --sync --check
npm run test:component-manifest
```

`scripts/component-manifest.mjs` exports `createPropsExtractor(tsconfigPath)`
and `generateComponentManifest({ tsconfigPath, componentsDirectory, registry })`.
The extractor returns a function accepting a source file and export name
(default: `default`). It uses the TypeScript compiler without importing or
executing the React components. It handles inherited props, primitives, literal
unions, null, arrays, nested objects, and string-keyed records. Optional props
remain optional; supported required props appear in JSON Schema `required`.

The generator enriches all 53 registered components and writes
`schema/component-manifest.generated.json`. IDs, versions, descriptions,
bindings, and data schemas still come from the reviewed registry. Existing
`propsSchema` constraints are retained through `allOf`; TypeScript cannot infer
business rules such as maximum text length. An `exportName` registry entry can
select a named component export. New component approval remains explicit.

Coverage includes inputs, buttons, cards, dialogs, collapsible sections, headings, named
typography exports, validation/status displays, form steps/tabs, grids, tables,
charts, documents, checklists, and activity displays. New entries use `kind` to
distinguish `field`, `action`, `layout`, `display`, and `navigation`; the existing
subject-owned coverage editor remains `composite`. Empty `fieldTypes` means the
component is not mapped to a scalar field type (uploads also need a dedicated
binding). Application shell navigation (`Navigation`, `SideNavBar`, its
`SideBarNav` alias, `ScrollableNavigation`) and `ThemeToggle` are excluded.

`excludedProps` reports callbacks, renderer-owned props (`value`, `children`,
`ref`, styles, etc.), and unsupported types. The renderer must supply any
required excluded props. Unconstrained `any`/`unknown`, recursive objects,
tuples, class instances, and non-JSON union branches need explicit handling;
the generator does not silently weaken them. Component prop unions are emitted
as separate `anyOf` schemas, preserving each branch's requirements and allowed
properties; excluded props include a zero-based `branch` index. Generic data
props remain excluded when their type cannot be resolved. Styled typography
uses its concrete base signature rather than its polymorphic overload;
`as` and `forwardedAs` remain renderer-owned. Other overloaded signatures are
rejected. React node props (including section titles typed as `ReactNode`) and
objects containing callbacks still require renderer-supplied content. Runtime
default values are not extracted. Serializable HTML props are included, but
serializability alone is not approval to expose every prop to an agent.

The generated file is separate from the existing `xds-components.json` contract.
After `--sync`, a pipeline service can load the generated catalog with:

```ts
import manifest from '@ensured/pipeline-shared/formCatalog/xds-components.generated.json';
const components = manifest.components;
```

Pass the relevant component schemas to the agent and validate its selected props
with AJV. Keep `excludedProps` for diagnostics rather than adding them to prompts.
Build the shared package after syncing when consuming its published `dist` files;
the workspace Jest mappings already resolve the JSON from source.

## Filtered results components

Use `ResultsToolbar`, `ResultsPanel`, `ResultMetricCard`, and `AllocationList` for filtered dashboards. They use XDS color, typography, spacing and radius tokens and compose existing Badge, Button and ProgressBar controls. They are exported from the package root and component subpaths and registered in the generated component manifest.

Dashboard component props, item types, result states, filters, and loss-ratio snapshots are defined in `src/components/UnderwritingDashboard.types.ts` and exported from the package root. Component modules re-export their existing type names for compatibility. The overview fixture is checked against `UnderwritingDashboardData`; this presentation model is not a backend API schema.

Review `Results/Underwriting dashboard` in Storybook for the responsive composition and the individual `Results/*` stories for all data states. Story values are illustrative fixtures, not live financial results. The preview's filter action toggles a sample selection; the application owns the real drawer and query state.

Pass formatted values and explicit business meaning from the application. Null metric values render unavailable; zero remains a valid result. Loading, empty, unavailable and error states hide stale values, comparisons and health badges. Comparison direction and favorable/unfavorable tone are independent. Coverage specifies populated records out of matching records. Targets require a positive denominator. Allocation shares require an explicit basis and do not infer whether overlapping categories sum to 100 percent.

Backend aggregation, effective revision selection, financial calculations and live dashboard adoption are separate integration work. These components do not fetch data or infer underwriting decisions.

### Catastrophe and treaty sections

`NatCatRiskBanner` displays a scenario title, gross exposure, retained exposure, treaty count, monitoring status and attachment buffer. GIS and stress-test buttons are controlled by callbacks; stress-test progress and errors are supplied by the application. Optional details support controlled or local disclosure state with accessible expanded/controls attributes. The component does not run models or infer retention.

`TreatyRenewalCard` displays broker/reference, status, target limit, indicative rate on line, explicit rate-change tone, expiry, syndicate participation and terms status. `TreatyRenewalWatchlist` composes cards in a responsive grid, derives the critical count from supplied flags, and accepts a formatted total and valuation basis. Totals are never calculated from display strings. Loading, empty, error and unavailable watchlists suppress stale totals and cards.

See the individual `Results/NatCatRiskBanner`, `Results/TreatyRenewalCard` and `Results/TreatyRenewalWatchlist` stories, or the combined `Results/Underwriting dashboard` preview. GIS, catastrophe models, treaty calculations and live API integration remain application responsibilities. All preview figures are illustrative fixtures.

### Submission pipeline results

`SubmissionPipelineOverview` composes `PipelineStageCard` with optional
`AppetiteDistribution`, `SlaVelocityPanel`, and `PriorityUnderwriterQueue` children.
The components use XDS tokens, badges, buttons, result states, and responsive grids.
See **Results / SubmissionPipelineOverview** and **Results / Underwriting dashboard**
in Storybook for the complete illustrative composition, including mobile and missing-data states.

Supply authoritative totals and formatted values from the application aggregation layer.
Stage totals are not automatically summed, capacity is distinct from insured exposure,
and SLA values are not calculated in the UI. Appetite percentages require mutually
exclusive categories; unknown or invalid shares suppress the chart, and totals below
100% retain an explicit unspecified remainder. Zero is a valid result.

`onOpenStage(stageId)` and `onOpenSubmission(submissionId)` let the consuming application
navigate or update its filters. These components perform no backend requests, LLM calls,
or modeling runs. Storybook data and callbacks are fixtures, not live integrations.

## Code quality

Run `npm run lint` for ESLint checks and `npm run lint:fix` for automatic fixes. Run `npm run format` to format XDS with Prettier, or `npm run format:check` to verify formatting. CI checks both before building. Generated artifacts and dependencies are excluded.

ESLint checks TypeScript, React hooks, stories, scripts, and tests. The existing extensible DataTable, KanbanBoard, and RequestedCoverageEditor APIs retain their explicit `any` types for compatibility; the other recommended rules still apply to those files. Node 22.13 or newer is required by the lint tooling.

## Digital Vermilion palette and ownership

`src/palette.ts` is the canonical source for Obsidian, Vermilion, Paper, Powder Blue, Stone, Gunmetal, Salmon, Blue Haze, Pewter and Off White. It also owns the accessible light/dark semantic roles and derived chart ramps. The approved ten base values remain available as `colors.palette`; use `colors.primary`, `colors.text.primary`, `colors.surfacePanel`, etc. for UI roles. Foregrounds must match their fill (`onPrimary`, `onPrimaryContainer`, `onSecondaryContainer`). Vermilion/blue shades and tints provide readable text in each mode; raw brand swatches are not interchangeable with semantic text colors.

`npm run build` generates `src/colors.css` and `dist/colors.css` from this same contract. Consumers import `@ensured/xds/colors.css` and the host mounts `XdsThemeProvider`. The workspace's `theme:sync` copies the generated stylesheet to static/standalone applications; `theme:check` detects stale copies and local product color literals. Do not edit generated copies or define a second palette in a page.

Use XDS Button, Input, Select and Textarea for controls. `Select bare` preserves a native select element without its optional chevron wrapper when a page owns the layout. Native props, refs, validation and submitted payloads are preserved. Domain pages own composition and application state, not another set of control primitives or colors.

Canvas, WebGL, map expressions, and saved signature images require literal colors: use XDS raw palette/dataViz exports rather than CSS variables. `categoryColor(key, themeName)` returns a stable readable category color for the requested theme. Third-party vendor marks retain their centrally defined brand colors. Stored signatures and generated document formats are not retroactively recolored.

Verification: `node --test test/palette.test.mjs` checks exact base values, generated CSS and semantic contrast. Story `xds-palette-workflow--theme-and-form` exercises both themes, persistence, input refs, validation, keyboard submit/payload, disabled states, status fills and heatmap rendering; the workspace `scripts/verify-palette-stories.mjs` also checks actual browser hover and captures previews.
