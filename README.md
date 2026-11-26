# EnsuredXDS — shared UI library

[Storybook](https://simeoncalixte.github.io/EnsuredXDS/) · [Roadmap](ROADMAP.md) · [MIT license](LICENSE)

`@ensured/xds` is the common React design system for EnsuredUI and future microfrontends. It owns reusable components, charts, theme providers, design tokens, CSS and their Storybook stories.

Built with TypeScript, React, styled-components, Recharts and Storybook. It is
intended for developers building consistent forms, navigation and dashboards.
The component library renders data supplied by its host; the standalone Storybook
does not require an application backend or AI provider.

## Develop

Use Node.js 22.13 or newer. Clone this repository and run from its root:

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

A consumer outside the parent can install an archive produced by `npm pack`. Versioned packages are also published to GitHub Packages; registry installation requires package access as described in [PACKAGES.md](PACKAGES.md). Building the library and Storybook from source uses public npm dependencies and does not require a registry token.

For future runtime composition, configure React, React DOM, styled-components, React Router **and `@ensured/xds`** as shared singletons; mount the theme provider in the host. Peer dependencies alone do not configure a federation runtime. This extraction creates the shared library; it does not add microfrontend routing, federation or independent deployment yet.

## Validation

```sh
npm test
npm run build-storybook
```

The default tests run without sibling repositories. In the full application checkout,
`XDS_CHECK_SIBLING_CATALOG=1 npm test` also checks the downstream catalog copy.
Tests run sequentially because some npm versions rebuild during packing.

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

## Financial values

Every money amount, ratio or financial count in a product UI must be rendered with `FinancialValue`. Screens must not format money ad hoc. The component makes the figure's truthfulness explicit instead of leaving it to each page:

| `state`          | Renders                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| `verified`       | Formatted amount with ISO code, no chip                                       |
| `pending`        | Amount with an outlined **Pending** chip                                      |
| `estimated`      | `≈` prefix with an **Estimate** chip                                          |
| `illustrative`   | Muted amount with a warning-tone **Example** chip                             |
| `unavailable`    | "Not available" in the muted token, never `0`, `$0` or a bare dash            |
| `mixed-currency` | "Multiple currencies", plus "View by currency" when `onViewByCurrency` is set |
| `loading`        | A skeleton sized to the expected value, with `aria-busy="true"`               |

```tsx
import { FinancialValue } from '@ensured/xds';

<FinancialValue amount="4200000" currency="USD" state="verified" asOf={asOf} source="Ledger" />
<FinancialValue amount="4200000000" currency="USD" state="illustrative" scale="compact" />
<FinancialValue amount={null} currency="USD" state="unavailable" reason="No reconciled data yet." />
```

Pass `amount` as a decimal string (or `null` when unknown) and `currency` as an ISO 4217 code (or `null` for ratios and counts). Values are formatted with `Intl.NumberFormat` in the active locale (override with `locale`) and tabular numerals. A `null` or non-decimal amount with an amount-bearing state renders `unavailable` and warns in development. Use `scale="compact"` only in headline tiles (for example "$4.2M USD"); the full value moves into the description. Use `align="end"` in table columns. Negative values keep a minus sign and use the danger text token. `asOf` adds an "As of 20 Nov 2026, 14:05 UTC" caption, marked "(stale)" after 24 hours. The value becomes focusable when it has a description, which is shown as a tooltip on hover and focus (Escape dismisses it) and exposed through `aria-describedby`.

The component never sums or converts currencies and does not decide a figure's state. The application supplies the state from its data source. See **Data Display/FinancialValue** in Storybook for every state in light and dark themes at 390 px and 1440 px.

## Keyset pagination

Use `Pagination` (`xds.pagination`) for cursor (keyset) lists. It shows **Previous** and **Next** only, with no page numbers and no total, because keyset APIs have no cheap count.

```tsx
import { Pagination } from '@ensured/xds';

<Pagination
  hasPrevious={Boolean(previousCursor)}
  hasNext={Boolean(nextCursor)}
  onPrevious={goPrevious}
  onNext={goNext}
  loading={isFetching}
  pageSizeLabel="25 per page"
/>;
```

A button that cannot be used gets `aria-disabled="true"`, not `disabled`, so it stays in the tab order and its reason ("You're on the first page", "You're on the last page", or "Loading the page" while `loading`) is read through `aria-describedby`. Override the reasons, button text and landmark label with props. Targets are 44 × 44 px on touch pointers and below 1024 px. The application owns the cursors, moves focus after a page loads and announces the result in its own live region. See **Navigation/Pagination** in Storybook.

## Unsupported fields

When a submission shape node's `componentRef` can't be rendered, render `UnsupportedField` (`xds.unsupported-field`) instead of dropping the node. It always shows the stored value read-only, so submitted data is never lost.

```tsx
import { UnsupportedField } from '@ensured/xds';

<UnsupportedField
  label="Schedule of locations"
  path="insured.locations"
  componentRef="xds.location-schedule"
  reason="unknown-ref"
  value={storedValue}
/>;
```

`reason` is `unknown-ref` (not in the registry), `not-form-allowed` (registered but not allowed in forms) or `retired`. Each has default visible text, which `reasonText` overrides; the reason is never shown by colour alone. Scalars render as text, objects as key/value pairs, arrays of records as a table whose columns are the union of every row's keys (in a keyboard-scrollable region on narrow screens), and arrays of scalars as a list. Null, empty strings, empty arrays and empty objects show `emptyLabel` ("No value recorded"). Text longer than `truncateAt` characters (default 160) gets a "Show full value" toggle with `aria-expanded`. Numbers and decimal strings are shown exactly as stored, with no rounding or locale formatting. The group is named by `label` and described by the visible "Read-only" tag and reason text. See **Data Display/UnsupportedField** in Storybook.

## Menu buttons

Use `MenuButton` (`xds.menu-button`) for a per-row "More actions" menu, and as the keyboard and single-pointer alternative to dragging a card between underwriting stages (WCAG 2.5.7).

````tsx
import { MenuButton } from '@ensured/xds';

<MenuButton
  label="More actions for SUB-8405"
  items={[
    { id: 'open', label: 'Open submission', onSelect: openSubmission },
    { id: 'refer', label: 'Refer to senior underwriter', hint: 'Above your binding authority' },
    { type: 'separator' },
    {
      id: 'archive',
      label: 'Archive',
      disabled: true,
      hint: 'Bound submissions cannot be archived',
    },
  ]}
  radioGroup={{
    label: 'Move to a status',
    value: stage,
    sections: [
      {
        label: 'Underwriting',
        options: [
          { value: 'triage', label: 'Triage' },
          { value: 'referred', label: 'Referred', hint: 'asks to confirm' },
        ],
      },
      {
        label: 'Decision',
        options: [{ value: 'declined', label: 'Declined', hint: 'asks to confirm' }],
      },
    ],
    onChange: requestMove,

## Callout panels

Use `CalloutPanel` (`xds.callout-panel`) to set expectations side by side, such as "What the platform is and isn't" in the homepage trust section.

```tsx
import { CalloutPanel } from '@ensured/xds';

<CalloutPanel
  title="What the platform is and isn't"
  isLabel="What the platform is"
  isntLabel="What the platform isn't"
  items={{
    is: ['A shortlist of markets whose appetite fits, for a broker to approach'],
    isnt: ['An insurer, carrier or broker', 'A place where cover is bound automatically'],
  }}
/>;
````

It follows the WAI-ARIA APG menu-button pattern. The trigger is a native button with `aria-haspopup="menu"` and `aria-expanded`; it is icon-only unless you pass `triggerText` (keep that text inside `label`). Enter, Space or ArrowDown open the menu on the first item and ArrowUp on the last. In the menu, the arrow keys, Home, End and typeahead move focus, Enter or Space choose, Esc closes and returns focus to the trigger, and Tab closes it. A click outside closes it, and it flips to stay inside the viewport. `items` takes commands (`menuitem`), separators and labelled groups. `radioGroup` renders `menuitemradio`s (flat `options` or labelled `sections`); the option matching `value` is `aria-checked` and marked "Current" (`currentLabel`), and `onChange` is not called for it. `hint` text and the "Current" marker are linked with `aria-describedby`. Disabled commands and options stay focusable with `aria-disabled` and can't be chosen, so say why in `hint`. Choosing an item closes the menu and returns focus to the trigger before `onSelect`/`onChange` runs, so the caller can then open a confirmation (Modal `role="alertdialog"`). See **Navigation/MenuButton** in Storybook.

The panel is a `section` named by its `title`. Each column has a real heading (`isLabel`, default "What it is"; `isntLabel`, default "What it isn't") and a `ul` named by that heading, so the meaning never depends on the tick and cross icons (aria-hidden) or the accent colour. `headingLevel` (2, 3 or 4; default 2) sets the title level, and the column headings use the next level down. A column with no statements shows `emptyLabel` ("Nothing listed yet") instead of an empty list. Columns stack under 600 px, "is" first. See **Data Display/CalloutPanel** in Storybook.

## Banners

Use `Banner` (`xds.banner`) for a page-level notice, such as "Figures on this page are illustrative" or "This quote expires on 2 December 2026".

```tsx
import { Banner } from '@ensured/xds';

<Banner
  tone="info"
  title="Figures on this page are illustrative"
  dismissible
  onDismiss={focusHeading}
>
  Premiums, limits and loss ratios shown here are examples, not quotes or offers.
</Banner>;
```

`tone` is `info` (default), `warning` or `neutral`. Each tone has its own icon and a visually hidden prefix ("Information:", "Warning:", "Notice:", overridable with `toneLabel`), so it is never shown by colour alone. The banner is `role="status"` (polite) and is named by its `title`; it is never an `alert`, so use a Modal (alertdialog) or ValidationMessage for anything that must interrupt. `action` takes a link or tertiary Button and wraps below the text on narrow screens. `dismissible` adds a dismiss button named "Dismiss notice: {title}" (`dismissLabel` overrides it). Without `open` the banner hides itself after dismissal, and because the dismiss button unmounts, focus would fall to `<body>`. So prefer a controlled banner (`open` + `onDismiss`) and move focus in `onDismiss` to the nearest heading or the next control, as the **ControlledWithFocusReturn** story does. See **Feedback/Banner** in Storybook.

## Key-value lists and date-only values

Use `KeyValueList` (`xds.key-value-list`) for read-only details such as a submission or policy header. It renders a `dl` with one `dt`/`dd` pair per item, in 1, 2 or 3 columns (`columns={3}` shows 3 columns at 1024 px and up, 2 from 600 px and 1 below 600 px).

```tsx
import { KeyValueList, formatDateOnly } from '@ensured/xds';

<KeyValueList
  columns={3}
  loading={isLoading}
  items={[
    { label: 'Reference', value: 'SUB-10482', type: 'mono' },
    { label: 'Effective date', value: '2027-01-01', type: 'date-only' }, // 01 Jan 2027
    { label: 'Underwriter', value: null }, // —
  ]}
/>;

formatDateOnly('2027-01-01'); // '01 Jan 2027' in every time zone
```

Empty values (`null`, `undefined` or `''`) show "—", which is hidden from screen readers in favour of "Not set". `type: 'date-only'` formats a `YYYY-MM-DD` calendar day (effective, inception or expiry date) from the string itself and wraps it in `<time datetime>`. It never goes through `Date`, so the day never shifts west of UTC. An invalid day is shown as given, so the data stays visible. `formatDateOnly` returns `null` for missing or invalid input. While `loading`, a skeleton replaces the list, the wrapper gets `aria-busy` and "Loading details" is read. Values are plain strings or numbers: format money with `FinancialValue` and instants (for example "Last updated") in the application, passing the ISO instant as `dateTime`. See **Data Display/KeyValueList** in Storybook.

## Data tables: sort, links and row tones

`DataTable` (`xds.data-table`) keeps its legacy `rows` API unchanged. The generic `columns`/`data` API adds, all optional:

```tsx
<DataTable
  columns={[
    {
      key: 'insured',
      header: 'Insured',
      href: (row) => `/underwriting/submissions/${row.id}`,
      linkLabel: (row) => (row.insured ? undefined : `Submission ${row.ref}, insured not set`),
      secondary: (row) => row.ref,
    },
    { key: 'updated', header: 'Last updated', sort: 'descending' },
  ]}
  data={rows}
  caption="Submissions, sorted by last updated, newest first"
  rowTone={(row) => (row.archived ? 'muted' : 'default')}
  rowKey={(row) => row.id}
  loading={loading}
  skeletonRows={8}
  loadingLabel="Loading submissions"
  stacked
/>
```

- `sort` sets `aria-sort` and a hidden ▼/▲ glyph on a non-interactive `th`, for a fixed order. Add `onSort` only when the user can change the sort; the header then renders a `<button>` inside the `th`.
- `href` makes that cell's value the row's single link. Rows are never click targets. Pass `linkAs` (a router link component) to render it instead of `<a>`; it receives `href` and `to`.
- `secondary` adds a second line in the mono label face, for example a submission or policy reference.
- `rowTone` `muted` uses `onSurfaceVariant` text, which is at least 4.5:1 in both themes. Pair it with visible text such as an Archived badge.
- `caption` (with `captionHidden` to hide it visually) names the table. `captionRef` is a callback ref that also gives the caption `tabIndex={-1}`, so the app can move focus to it after a page loads.
- `skeletonRows` shows a table-shaped skeleton while `loading`, sets `aria-busy` and reads `loadingLabel`. Without it, the existing "Loading..." line is shown.
- `stacked` shows each row as a card with field labels below 600 px. Column `label` sets the field label when `header` isn't a string.

See **Data Display/DataTable** in Storybook.

## Kanban boards: confirm before a move, card controls

`KanbanBoard` never wraps `renderCard` output in an interactive element, so cards can hold links, buttons and menus. Each lane is a list item labelled by its heading (`headingLevel`, default 3), which includes the count ("Triage (2 items)").

- `onMoveRequest(itemId, toStageKey)` runs before every move. Return or resolve `false` to veto it (for example when the underwriter cancels a confirmation); a rejected promise is also a veto. Without it, moves apply at once, as before.
- `renderCard(item, { requestMove, movePending })`: call `requestMove(stageKey)` from the card's button or menu so keyboard and single-pointer users can move cards (WCAG 2.5.7). The card is `aria-busy` while a request is unsettled.
- Lane `tag` (a neutral badge, e.g. "Decision"), `subheading` (the statuses in the lane) and `dropPreview` (text shown while a card is dragged over the lane).
- `draggable={false}` turns pointer drag off; `emptyLabel` and `ariaLabel` set the copy.

## Submission status badges

Use `statusTone(status)` to pick the `Badge` tone for a submission status, so the Kanban and Table views agree. Always render the status label as the badge text: the tone is never the only signal.

```tsx
import { Badge, statusTone } from '@ensured/xds';

const StatusCell = ({ status, label, archived }: StatusCellProps) => (
  <>
    <Badge variant={statusTone(status)}>{label}</Badge>
    {archived ? <Badge variant="archived" /> : null}
  </>
);
```

| Status                          | Tone      |
| ------------------------------- | --------- |
| draft                           | `neutral` |
| submitted, modeling, priced     | `info`    |
| approved, quoted                | `primary` |
| bound                           | `success` |
| rejected (declined)             | `danger`  |
| org board statuses, unknown, "" | `surface` |

Matching ignores case and surrounding spaces. `SUBMISSION_SYSTEM_STATUSES` and `isSubmissionSystemStatus()` are exported too. The `archived` variant shows an archive icon (hidden from screen readers) and the text "Archived" unless you pass your own text. Badge text keeps at least 4.5:1 contrast in the light and dark themes; `primary` badge text uses `primarySoft` for this. See **Feedback/Badge** in Storybook.

## Radio groups

`RadioGroup` (`xds.radio-group`) is a `fieldset` with a visible `legend` and native radios. Each option has a label and an optional description. Nothing is selected until the person chooses:

```tsx
const [decision, setDecision] = useState<string | null>(null);

<RadioGroup
  name="decision"
  legend="Decision for SUB-8401"
  required
  value={decision}
  onChange={setDecision}
  error={showError ? 'Choose Approve or Decline.' : undefined}
  options={[
    {
      value: 'approve',
      label: 'Approve',
      description: 'Not priced yet. Price SUB-8401 before approving.',
      disabled: true,
    },
    { value: 'decline', label: 'Decline', description: 'You will be asked for a reason.' },
  ]}
/>;
```

- `value={null}` is controlled with nothing selected; leave `value` undefined for an uncontrolled group. There is never a default selection.
- Native radio keyboard behaviour: Tab enters the group, arrow keys move and select, Tab leaves.
- Option descriptions link to their radio with `aria-describedby`. A disabled option keeps its description at full contrast, so the reason is readable.
- `hint` and `error` link to the fieldset with `aria-describedby`. The error has an icon and a hidden "Error:" prefix, so it is never shown by colour alone.
- `orientation="horizontal"` lays options out in a wrapping row; `legendHidden` hides the legend visually but keeps it as the group name.

See **Form Elements/RadioGroup** in Storybook.

## Status toasts

`StatusToast` (`xds.status-toast`) shows one polite status message with at most one action, such as "SUB-8401 moved from New to Triage." with Undo. Mount it once, after the main content, and pass the current message:

```tsx
const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

<StatusToast
  message={toast?.message}
  messageId={toast?.id}
  action={{ label: 'Undo', onAction: undoLastMove }}
  returnFocusRef={moveButtonRef}
  onDismiss={() => setToast(null)}
/>;
```

- The `role="status"` region is always mounted, even with no message, so the next message is announced. It never takes focus.
- One message at a time: a new `message` or `messageId` replaces the current one and restarts the timer.
- Neutral toasts dismiss after `duration` (10 000 ms by default; `0` keeps them). Hover or focus pauses the timer, which then resumes with the time left (WCAG 2.2.1).
- `tone="error"` stays until dismissed, adds a close button ("Dismiss message") and a hidden "Error:" prefix, so the tone is never shown by colour alone.
- `onDismiss(reason)` reports `'timeout'`, `'action'` or `'close'`. If focus was inside the toast (after Undo or close), it moves to `returnFocusRef`.
- `position="fixed"` (the default) pins it to the bottom centre above modals; at 768 px and below it spans the content width with 16 px gutters. `position="inline"` is for previews.

See **Feedback/StatusToast** in Storybook.

## Confirmation dialogs

Use `Modal` (`xds.modal`) with `role="alertdialog"` to confirm an irreversible or superseding action, such as superseding a sent quote, accepting or declining terms, or binding. The modal manages focus: it focuses `initialFocusRef` on open (point it at the safe action, never the destructive one), traps Tab, and returns focus to the trigger (or `returnFocusRef`) on close.

```tsx
const backRef = useRef<HTMLButtonElement>(null);

<Modal
  open={open}
  role="alertdialog"
  title="Supersede quote Q-1042 v2?"
  describedBy="supersede-consequence"
  initialFocusRef={backRef}
  onClose={() => setOpen(false)}
  submitting={isSubmitting}
  error={errorMessage}
  footer={
    <>
      <Button
        ref={backRef}
        variant="secondary"
        onClick={() => setOpen(false)}
        disabled={isSubmitting}
      >
        Back to quote
      </Button>
      <Button tone="danger" onClick={supersede} disabled={isSubmitting}>
        {isSubmitting ? 'Superseding…' : 'Supersede and create v3'}
      </Button>
    </>
  }
>
  <p id="supersede-consequence">…</p>
</Modal>;
```

- **Esc and the scrim:** Esc calls `onClose`, acting as Cancel (`closeOnEscape`, default true). A scrim click closes a `dialog` but not an `alertdialog` (`closeOnScrimClick`).
- **Submitting:** `submitting` sets `aria-busy`, disables the close button, and ignores Esc and scrim clicks. The caller disables its own buttons and sets the in-progress label.
- **Errors:** `error` shows a `role="alert"` region at the top of the body and moves focus to it.
- **Labelling:** the title labels the dialog, and `ariaLabel` names it when there is no title.
- **Narrow screens:** below 480 px, the footer's direct children stack full width with 44 px targets. Pass the buttons as a fragment, not wrapped in an element.

See **Modals/Modal** in Storybook.

## Filtered results components

Use `ResultsToolbar`, `ResultsPanel`, `ResultMetricCard`, and `AllocationList` for filtered dashboards. They use XDS color, typography, spacing and radius tokens and compose existing Badge, Button and ProgressBar controls. They are exported from the package root and component subpaths and registered in the generated component manifest.

Dashboard component props, item types, result states, filters, and loss-ratio snapshots are defined in `src/components/UnderwritingDashboard.types.ts` and exported from the package root. Component modules re-export their existing type names for compatibility. The overview fixture is checked against `UnderwritingDashboardData`; this presentation model is not a backend API schema.

Review `Page Compositions/Underwriting Dashboard` in Storybook for the responsive composition and the individual Data Display, Feedback, Workflow and Insurance stories for all data states. Story values are illustrative fixtures, not live financial results. The preview's filter action toggles a sample selection; the application owns the real drawer and query state.

Pass formatted values and explicit business meaning from the application. Null metric values render unavailable; zero remains a valid result. Loading, empty, unavailable and error states hide stale values, comparisons and health badges. Comparison direction and favorable/unfavorable tone are independent. Coverage specifies populated records out of matching records. Targets require a positive denominator. Allocation shares require an explicit basis and do not infer whether overlapping categories sum to 100 percent.

Backend aggregation, effective revision selection, financial calculations and live dashboard adoption are separate integration work. These components do not fetch data or infer underwriting decisions.

### Catastrophe and treaty sections

`NatCatRiskBanner` displays a scenario title, gross exposure, retained exposure, treaty count, monitoring status and attachment buffer. GIS and stress-test buttons are controlled by callbacks; stress-test progress and errors are supplied by the application. Optional details support controlled or local disclosure state with accessible expanded/controls attributes. The component does not run models or infer retention.

`TreatyRenewalCard` displays broker/reference, status, target limit, indicative rate on line, explicit rate-change tone, expiry, syndicate participation and terms status. `TreatyRenewalWatchlist` composes cards in a responsive grid, derives the critical count from supplied flags, and accepts a formatted total and valuation basis. Totals are never calculated from display strings. Loading, empty, error and unavailable watchlists suppress stale totals and cards.

See the individual `Feedback/NatCatRiskBanner`, `Insurance/TreatyRenewalCard` and `Insurance/TreatyRenewalWatchlist` stories, or the combined `Page Compositions/Underwriting Dashboard` preview. GIS, catastrophe models, treaty calculations and live API integration remain application responsibilities. All preview figures are illustrative fixtures.

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

## Component organization

Storybook and its source stories are organized by composition and placement.
Stories live in `src/stories/<category>/`; reusable implementations retain their
stable `src/components` locations and published import paths. Existing Storybook
IDs are explicit so saved story links continue to resolve after regrouping.

| Category          | Use and examples                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Foundations       | Colors, palette, design tokens and typography                                                 |
| Form Elements     | Inputs, selects, checkboxes, toggles, ranges, selection cards, field wrappers and file inputs |
| Actions           | Buttons and reusable action controls                                                          |
| Filters           | Filter panels, segmented filtering and results toolbars                                       |
| Navigation        | Main/side/sub navigation, breadcrumbs and steppers                                            |
| Page Layout       | Page/section headers, cards, collapsible sections, grids and panels                           |
| Location          | Planned subject location, route and boundary controls; appears when implemented               |
| Icons             | Icon grids and icon presentation                                                              |
| Modals            | Dialogs and modal compositions                                                                |
| Data Display      | Tables, document rows, activity, avatars, metrics and allocation lists                        |
| Feedback          | Badges, confidence, progress and risk alerts                                                  |
| Workflow          | Boards, onboarding, pipeline stages, queues and SLA panels                                    |
| Insurance         | Domain compositions such as deal cards, treaty renewals and appetite distribution             |
| Page Compositions | Complete examples assembled from multiple component families                                  |

Place each story in one primary category based on its purpose, even when a
component is reused elsewhere. For example, a checkbox stays in Form Elements
when used inside a Filters panel. Domain forms belong under `Form Elements/Insurance`,
while read-only domain compositions belong under `Insurance`. Full-page examples
belong in Page Compositions. Empty planned categories do not imply implemented
components. See [ROADMAP.md](ROADMAP.md) for the planned component mapping.

## Storybook hosting

The `Storybook Pages` workflow builds and tests pull requests, then publishes the
static Storybook from `main` to GitHub Pages. In repository Settings → Pages,
select **GitHub Actions** as the build source. The workflow can also be started
manually from Actions. The expected URL is
https://simeoncalixte.github.io/EnsuredXDS/.

Storybook uses relative asset paths for project-site hosting and does not load
local environment files. Preview stories use in-repository fixtures; never add
customer documents, credentials or real personal data. Fonts load from Google
Fonts. To preview the production build locally:

```sh
npm run build-storybook
python3 -m http.server 6006 --directory storybook-static
```

## Contributing and license

See [ROADMAP.md](ROADMAP.md) for proposed work. Include a representative Storybook
example with component changes and run `npm test`, `npm run lint`,
`npm run format:check` and `npm run build-storybook` before submitting changes.
Preserve the existing Git history. EnsuredXDS is available under the
[MIT license](LICENSE).

### Scroll-controlled sequences (AIN-277)

`SequenceReveal` is progressive enhancement for an ordered list. Its transforms
follow native scroll position and reverse when the user scrolls back. It has no
autoplay clock or entrance-triggered animation; content stays readable at full
contrast with JavaScript disabled. `stagger` (0.09) and `distance` (0.4) are
fractions of viewport height, not milliseconds. `reducedMotion` and the user's
media preference remove movement. Import `@ensured/xds/styles.css` for the shared
motion-duration/easing tokens; durations collapse to zero under reduced motion.

`PlaybackControls` is controlled and does not run a clock. A scroll-driven host
uses its callbacks to pause the visual response or navigate to a specific step.
It must not interpret Play/Replay as permission for timed homepage autoplay.

### RiskGlobe (AIN-275, implementation in progress)

`RiskGlobe` takes a normalized `progress` value from the host's native scroll
position. Hero and film share this one instance and WebGL context. The renderer
has no clock: it draws only when progress/seat/markers, size or visibility change.
`paused` freezes the last accepted frame; resuming uses current scroll progress.
Reduced motion selects static shot states. WebGL initialization errors or context
loss preserve the static SVG and readable HTML step legend.

The land sample is derived from Natural Earth 110m public-domain topology, using
a two-degree longitude/latitude grid. The current film camera and scene objects
are an initial implementation; full page composition, labels/choreography against
the approved storyboard, accessibility and performance acceptance remain open.
