import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import DataTable, {
  type DataTableColumn,
  type DataTableGenericProps,
} from '../../components/DataTable.js';
import Badge from '../../components/Badge.js';
import { formatDateOnly } from '../../formatDateOnly.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { expectStoryViewport, storyViewport, storyViewports } from '../viewport.js';

const meta: Meta<typeof DataTable> = {
  id: 'xds-datatable',
  title: 'Data Display/DataTable',
  component: DataTable,
  parameters: { viewport: { viewports: storyViewports } },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

/** Legacy fixed-Row API — preserved for backward compatibility. */
export const LegacyRows: Story = {
  render: () => (
    <DataTable
      rows={[
        {
          id: '#SY-8821',
          tranche: 'Senior Secure',
          value: '1,240,000.00',
          status: 'ACTIVE',
          statusVariant: 'secondary',
        },
        {
          id: '#SY-4491',
          tranche: 'Mezzanine B',
          value: '450,200.00',
          status: 'PENDING',
          statusVariant: 'primary',
        },
        {
          id: '#SY-1022',
          tranche: 'Junior Equity',
          value: '88,000.50',
          status: 'HALTED',
          statusVariant: 'error',
        },
      ]}
    />
  ),
};

type DealRow = { deal: string; tranche: string; amount: string };

const genericColumns: DataTableColumn<DealRow>[] = [
  { key: 'deal', header: 'Deal' },
  { key: 'tranche', header: 'Tranche' },
  { key: 'amount', header: 'Amount', align: 'right' },
];

const genericData: DealRow[] = [
  { deal: 'Atlas Re', tranche: 'Senior', amount: '2,000,000' },
  { deal: 'Boreas Cat', tranche: 'Mezz', amount: '750,000' },
];

/** Generic columns/data API with row actions. */
export const Generic: Story = {
  render: () => (
    <DataTable<DealRow>
      columns={genericColumns}
      data={genericData}
      rowActions={(row) => <button type="button">View {row.deal}</button>}
    />
  ),
};

/** Loading state. */
export const Loading: Story = {
  render: () => <DataTable<DealRow> columns={genericColumns} data={[]} loading />,
};

/** Error state. */
export const ErrorState: Story = {
  render: () => (
    <DataTable<DealRow> columns={genericColumns} data={[]} error="Failed to load deals" />
  ),
};

/** Empty state. */
export const Empty: Story = {
  render: () => (
    <DataTable<DealRow> columns={genericColumns} data={[]} emptyText="No deals found" />
  ),
};

/**
 * Interaction test: a row action button toggles a selected-row label.
 * Uses local state in the story so the interaction is observable.
 */
export const Interactive: Story = {
  render: function Render() {
    const Wrapper: React.FC = () => {
      const [selected, setSelected] = useState<string | null>(null);
      return (
        <div>
          <div data-testid="selected">{selected ? `Selected: ${selected}` : 'None selected'}</div>
          <DataTable<DealRow>
            columns={genericColumns}
            data={genericData}
            rowActions={(row) => (
              <button type="button" onClick={() => setSelected(row.deal)}>
                Select {row.deal}
              </button>
            )}
          />
        </div>
      );
    };
    return <Wrapper />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId('selected')).toHaveTextContent('None selected');

    const button = canvas.getByRole('button', { name: 'Select Boreas Cat' });
    await userEvent.click(button);

    expect(canvas.getByTestId('selected')).toHaveTextContent('Selected: Boreas Cat');
  },
};

/* ---------------------------------------------------------------------------
 * AIN-281 scope item 1: submissions list (Design AIN-280 §2, §4, §5, §6).
 * Illustrative fixtures only, not live data.
 * ------------------------------------------------------------------------- */

type SubmissionRow = {
  id: string;
  reference: string;
  insured: string | null;
  lineOfBusiness: string | null;
  effectiveDate: string | null;
  status: string;
  statusTone: 'neutral' | 'info' | 'primary' | 'success' | 'danger' | 'surface';
  updated: string;
  updatedIso: string;
  updatedBy: string;
  archived?: boolean;
};

const submissions: SubmissionRow[] = [
  {
    id: '10482',
    reference: 'SUB-10482',
    insured: 'Harborview Logistics LLC',
    lineOfBusiness: 'Commercial property',
    effectiveDate: '2027-01-01',
    status: 'Quoted',
    statusTone: 'primary',
    updated: '23 Nov 2026, 10:42 EST',
    updatedIso: '2026-11-23T15:42:00Z',
    updatedBy: 'by A. Okafor',
  },
  {
    id: '10490',
    reference: 'SUB-10490',
    insured: null,
    lineOfBusiness: 'Cargo',
    effectiveDate: null,
    status: 'Draft',
    statusTone: 'neutral',
    updated: '22 Nov 2026, 16:05 EST',
    updatedIso: '2026-11-22T21:05:00Z',
    updatedBy: 'by you',
  },
  {
    id: '10477',
    reference: 'SUB-10477',
    insured: 'Northwind Foods',
    lineOfBusiness: 'General liability',
    effectiveDate: '2027-02-15',
    status: 'Bound',
    statusTone: 'success',
    updated: '20 Nov 2026, 09:12 EST',
    updatedIso: '2026-11-20T14:12:00Z',
    updatedBy: 'by J. Ruiz',
    archived: true,
  },
];

const EMPTY = '—';

const submissionColumns: DataTableColumn<SubmissionRow>[] = [
  {
    key: 'insured',
    header: 'Insured',
    render: (row) => row.insured ?? EMPTY,
    href: (row) => `#/underwriting/submissions/${row.id}`,
    linkLabel: (row) => (row.insured ? undefined : `Submission ${row.reference}, insured not set`),
    secondary: (row) => row.reference,
    skeletonWidth: '80%',
  },
  {
    key: 'lineOfBusiness',
    header: 'Line of business',
    render: (row) => row.lineOfBusiness ?? EMPTY,
  },
  {
    key: 'effectiveDate',
    header: 'Effective',
    render: (row) => {
      const formatted = formatDateOnly(row.effectiveDate);
      return formatted && row.effectiveDate ? (
        <time dateTime={row.effectiveDate}>{formatted}</time>
      ) : (
        EMPTY
      );
    },
    skeletonWidth: '50%',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
        <Badge variant={row.statusTone}>{row.status}</Badge>
        {row.archived ? <Badge variant="surface">Archived</Badge> : null}
      </span>
    ),
    skeletonWidth: '40%',
  },
  {
    key: 'updated',
    header: 'Last updated',
    sort: 'descending',
    render: (row) => <time dateTime={row.updatedIso}>{row.updated}</time>,
    secondary: (row) => row.updatedBy,
  },
];

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

const themed = (theme: XdsThemeName) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme}>
      <StoryFn />
    </ThemeFrame>
  ),
];

const SubmissionsTable = (
  props: Partial<DataTableGenericProps<SubmissionRow>> & { includeArchived?: boolean },
) => {
  const { includeArchived = true, ...rest } = props;
  return (
    <DataTable<SubmissionRow>
      columns={submissionColumns}
      data={includeArchived ? submissions : submissions.filter((row) => !row.archived)}
      caption={`Submissions, sorted by last updated, newest first${includeArchived ? ', including archived' : ''}`}
      rowKey={(row) => row.id}
      rowTone={(row) => (row.archived ? 'muted' : 'default')}
      stacked
      {...rest}
    />
  );
};

/**
 * Submissions list: fixed sort (non-interactive `th` with `aria-sort`), insured link
 * cell with a reference line, a muted archived row, and a caption.
 */
export const Submissions: Story = {
  decorators: themed('dark'),
  render: () => <SubmissionsTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', {
      name: 'Submissions, sorted by last updated, newest first, including archived',
    });
    const sorted = within(table).getByRole('columnheader', { name: /Last updated/ });
    await expect(sorted).toHaveAttribute('aria-sort', 'descending');
    // A fixed order is shown, not offered: no button in the header.
    await expect(within(sorted).queryByRole('button')).toBeNull();
    for (const header of within(table).getAllByRole('columnheader')) {
      if (header !== sorted) await expect(header).not.toHaveAttribute('aria-sort');
    }

    // One link per row; a missing insured gets a descriptive accessible name.
    const links = within(table).getAllByRole('link');
    await expect(links).toHaveLength(3);
    await expect(
      within(table).getByRole('link', { name: 'Submission SUB-10490, insured not set' }),
    ).toHaveAttribute('href', '#/underwriting/submissions/10490');
    await expect(within(table).getByText('SUB-10482')).toBeVisible();
    await expect(within(table).getByText('01 Jan 2027')).toBeVisible();

    // Keyboard: tab order runs link to link, one stop per row.
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await userEvent.tab();
    await expect(links[1]).toHaveFocus();
    await userEvent.tab();
    await expect(links[2]).toHaveFocus();

    // Archived row is muted and labelled with text, never colour alone.
    const archivedRow = links[2].closest('tr') as HTMLElement;
    await expect(archivedRow).toHaveAttribute('data-xds-row-tone', 'muted');
    await expect(within(archivedRow).getByText('Archived')).toBeVisible();
  },
};

/** Light theme. */
export const SubmissionsLight: Story = {
  ...Submissions,
  decorators: themed('light'),
};

/** Sortable header: only when `onSort` is set does the header render a button. */
export const SortableHeader: Story = {
  decorators: themed('dark'),
  render: function Render() {
    const [sort, setSort] = useState<'ascending' | 'descending'>('descending');
    const columns = submissionColumns.map((col) =>
      col.key === 'updated'
        ? {
            ...col,
            sort,
            onSort: () => setSort((s) => (s === 'descending' ? 'ascending' : 'descending')),
          }
        : col,
    );
    return (
      <DataTable<SubmissionRow>
        columns={columns}
        data={submissions}
        caption="Submissions"
        captionHidden
        rowKey={(row) => row.id}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('columnheader', { name: /Last updated/ });
    const button = within(header).getByRole('button', { name: /Last updated/ });
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await expect(button).toHaveFocus();
    // The caption is still announced when hidden.
    await expect(canvas.getByRole('table', { name: 'Submissions' })).toBeInTheDocument();
  },
};

/** Table-shaped loading skeleton: 8 rows at the column widths, `aria-busy`. */
export const Skeleton: Story = {
  decorators: themed('dark'),
  render: () => (
    <SubmissionsTable data={[]} loading skeletonRows={8} loadingLabel="Loading submissions" />
  ),
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table') as HTMLTableElement;
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.querySelectorAll('tbody tr')).toHaveLength(8);
    await expect(within(table).queryAllByRole('link')).toHaveLength(0);
    await expect(table.querySelector('caption')).toHaveTextContent('Loading submissions');
  },
};

/** Focus moves to the caption after a page loads (Design AIN-280 R2.1-3, R2.4-2). */
export const CaptionFocus: Story = {
  decorators: themed('dark'),
  render: function Render() {
    const captionRef = React.useRef<HTMLTableCaptionElement>(null);
    const [loaded, setLoaded] = useState(false);
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setLoaded(true);
            captionRef.current?.focus();
          }}
        >
          Next page
        </button>
        <DataTable<SubmissionRow>
          columns={submissionColumns}
          data={submissions}
          caption={`Submissions${loaded ? ', next page loaded' : ''}, sorted by last updated, newest first`}
          captionRef={(element) => {
            captionRef.current = element;
          }}
          rowKey={(row) => row.id}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    const caption = canvasElement.querySelector('caption') as HTMLElement;
    await expect(caption).toHaveAttribute('tabindex', '-1');
    await expect(caption).toHaveFocus();
    await expect(caption).toHaveTextContent('next page loaded');
  },
};

type Width = 375 | 768 | 1440;

const responsive = (theme: XdsThemeName, width: Width): Story => ({
  name: `Submissions · ${theme} · ${width} px`,
  decorators: themed(theme),
  parameters: storyViewport(width),
  render: () => <SubmissionsTable />,
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const table = canvasElement.querySelector('table') as HTMLTableElement;
    const firstCell = table.querySelector('tbody td') as HTMLElement;
    // Stacked cards below 600 px; a real table from 600 px.
    await expect(getComputedStyle(firstCell).display).toBe(width < 600 ? 'block' : 'table-cell');
    // Neither layout may widen the page.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    await expect(within(table).getAllByRole('link')).toHaveLength(3);
    if (width < 600) await expect(firstCell).toHaveAttribute('data-label', 'Insured');
  },
});

export const Dark375 = responsive('dark', 375);
export const Dark768 = responsive('dark', 768);
export const Dark1440 = responsive('dark', 1440);
export const Light375 = responsive('light', 375);
export const Light768 = responsive('light', 768);
export const Light1440 = responsive('light', 1440);

export const NarrowPanelAtAnyViewport: Story = {
  render: () => (
    <div style={{ width: 320, maxWidth: '100%' }}>
      <SubmissionsTable stacked="always" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const table = c.getByRole('table');
    await expect(table.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    await expect(table.scrollWidth).toBeLessThanOrEqual(320);
    const link = c.getAllByRole('link')[0];
    link.focus();
    await expect(link).toHaveFocus();
    await expect(
      c.getAllByRole('cell').every((cell) => getComputedStyle(cell).display === 'block'),
    ).toBe(true);
  },
};

/**
 * AIN-361: a table with `rowActions` inside a consumer's narrow `overflow-x: auto` wrapper that is
 * **not** positioned. The visually hidden "Actions" header label must stay inside the table, so the
 * wrapper scrolls and the document never grows wider than the viewport.
 */
const NarrowScrollerWithRowActions = () => (
  <div data-testid="scroller" style={{ overflowX: 'auto', width: 240, maxWidth: '100%' }}>
    <div style={{ width: 1600 }}>
      <DataTable<DealRow>
        columns={genericColumns}
        data={genericData}
        rowActions={(row) => <button type="button">View {row.deal}</button>}
      />
    </div>
  </div>
);

const rowActionsInScroller = (width: 1280 | 375): Story => ({
  name: `Row actions in a non-positioned scroller · ${width} px`,
  parameters: storyViewport(width),
  render: () => <NarrowScrollerWithRowActions />,
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const c = within(canvasElement);
    // AC2: the actions column keeps its accessible name.
    await expect(c.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    // The wrapper really is narrower than the table, so it scrolls.
    const scroller = c.getByTestId('scroller');
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    // AC1: the hidden label doesn't escape the wrapper and widen the document.
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
});

export const RowActionsInScroller1280 = rowActionsInScroller(1280);
export const RowActionsInScroller375 = rowActionsInScroller(375);

/* ---------------------------------------------------------------------------
 * AIN-372: non-stacked tables at phone width. A table that is wider than the
 * viewport scrolls inside a named region (role="region", named by the caption)
 * that joins the tab order (tabindex="0") while it overflows, instead of widening the page (WCAG
 * 1.4.10). Headers, aria-sort and caption focus are unchanged, and amounts in
 * right-aligned cells never wrap mid-value. Illustrative fixtures only.
 * ------------------------------------------------------------------------- */

type LedgerRow = {
  id: string;
  treaty: string;
  layer: string;
  cededPremium: string;
  retention: string;
  limit: string;
};

const ledgerRows: LedgerRow[] = [
  {
    id: 'TR-2027-014',
    treaty: 'Property cat XoL',
    layer: '2nd layer',
    cededPremium: 'USD 1,240,000.00',
    retention: 'USD 25,000,000.00',
    limit: 'USD 50,000,000.00',
  },
  {
    id: 'TR-2027-021',
    treaty: 'Casualty quota share',
    layer: '30% cession',
    cededPremium: 'USD 450,200.00',
    retention: 'USD 0.00',
    limit: 'USD 10,000,000.00',
  },
];

const ledgerColumns: DataTableColumn<LedgerRow>[] = [
  { key: 'id', header: 'Treaty ID' },
  { key: 'treaty', header: 'Treaty' },
  { key: 'layer', header: 'Layer' },
  { key: 'cededPremium', header: 'Ceded premium', align: 'right' },
  { key: 'retention', header: 'Retention', align: 'right' },
  { key: 'limit', header: 'Limit', align: 'right' },
];

type ScrollWidth = 390 | 1280;

const NonStackedTables = () => {
  const [sort, setSort] = useState<'ascending' | 'descending'>('descending');
  const columns = submissionColumns.map((col) =>
    col.key === 'updated'
      ? {
          ...col,
          sort,
          onSort: () => setSort((s) => (s === 'descending' ? 'ascending' : 'descending')),
        }
      : col,
  );
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <DataTable<SubmissionRow>
        columns={columns}
        data={submissions}
        caption="Submissions, sorted by last updated"
        rowKey={(row) => row.id}
      />
      <DataTable<LedgerRow>
        columns={ledgerColumns}
        data={ledgerRows}
        caption="Treaty ledger, amounts in USD"
        rowKey={(row) => row.id}
      />
    </div>
  );
};

const nonStacked = (theme: XdsThemeName, width: ScrollWidth): Story => ({
  name: `Non-stacked scroll region · ${theme} · ${width} px`,
  decorators: themed(theme),
  parameters: storyViewport(width),
  render: () => <NonStackedTables />,
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const c = within(canvasElement);
    const submissionsRegion = c.getByRole('region', {
      name: 'Submissions, sorted by last updated',
    });
    const ledgerRegion = c.getByRole('region', { name: 'Treaty ledger, amounts in USD' });
    for (const region of [submissionsRegion, ledgerRegion]) {
      await expect(within(region).getByRole('table')).toBeInTheDocument();
      // At phone width the table is wider than its region, so the region scrolls.
      if (width < 600) await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
      // AC2: a region that scrolls is in the tab order; one that fits adds no tab stop.
      if (region.scrollWidth > region.clientWidth) {
        await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
      } else {
        await expect(region).not.toHaveAttribute('tabindex');
      }
    }
    // AC2: the page itself never scrolls sideways.
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    // AC1: headers, aria-sort and the sort button still work.
    const header = within(submissionsRegion).getByRole('columnheader', { name: /Last updated/ });
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(within(header).getByRole('button', { name: /Last updated/ }));
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    // Keyboard: at phone width Tab reaches the region, then the controls inside it.
    if (width < 600) {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(submissionsRegion).toHaveFocus();
      await userEvent.tab();
      await expect(
        within(submissionsRegion).getByRole('button', { name: /Last updated/ }),
      ).toHaveFocus();
    }
    // AC3: amounts sit on one line, never wrapped mid-value.
    const amount = within(ledgerRegion).getByText('USD 25,000,000.00');
    await expect(getComputedStyle(amount).whiteSpace).toBe('nowrap');
    const range = canvasElement.ownerDocument.createRange();
    range.selectNodeContents(amount);
    await expect(range.getClientRects()).toHaveLength(1);
  },
});

export const NonStackedDark390 = nonStacked('dark', 390);
export const NonStackedLight390 = nonStacked('light', 390);
export const NonStackedDark1280 = nonStacked('dark', 1280);
export const NonStackedLight1280 = nonStacked('light', 1280);

const legacyAt = (width: ScrollWidth): Story => ({
  ...LegacyRows,
  name: `Legacy rows in scroll region · ${width} px`,
  parameters: storyViewport(width),
  play: async ({ canvasElement }) => {
    expectStoryViewport(width);
    const c = within(canvasElement);
    const region = c.getByRole('region', { name: 'Contracts' });
    if (width < 600) {
      await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
      await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    }
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
});

export const LegacyRows390 = legacyAt(390);
export const LegacyRows1280 = legacyAt(1280);

/**
 * AIN-372 review check 1: when the focused region stops overflowing (a rotate or a resize of
 * its container), it keeps its tab stop until it loses focus, so focus never drops silently to
 * <body>. After blur, a region that fits has no tab stop again.
 */
export const RegionKeepsFocusWhenOverflowEnds: Story = {
  name: 'Scroll region keeps focus when overflow ends · 390 px',
  parameters: storyViewport(390),
  render: () => (
    <div data-testid="resizable-container" style={{ width: 360 }}>
      <DataTable<LedgerRow>
        columns={ledgerColumns}
        data={ledgerRows}
        caption="Treaty ledger, amounts in USD"
        rowKey={(row) => row.id}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expectStoryViewport(390);
    const c = within(canvasElement);
    const region = c.getByRole('region', { name: 'Treaty ledger, amounts in USD' });
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    region.focus();
    await expect(region).toHaveFocus();
    // Widen the container (as a rotate to landscape would) so the table fits.
    const container = c.getByTestId('resizable-container');
    container.style.width = '1600px';
    await waitFor(() => expect(region).toHaveAttribute('data-xds-scroll-region', ''));
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    // Still focused and still in the tab order: focus did not fall to <body>.
    await expect(region).toHaveFocus();
    await expect(region).toHaveAttribute('tabindex', '0');
    // Once focus leaves, a region that fits drops its tab stop.
    region.blur();
    await waitFor(() => expect(region).not.toHaveAttribute('tabindex'));
    container.style.width = '360px';
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
  },
};
