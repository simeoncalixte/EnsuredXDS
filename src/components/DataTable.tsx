import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/**
 * Legacy fixed-shape row used by the original DataTable API.
 * Preserved verbatim so existing callers keep compiling.
 */
export type Row = {
  id: string;
  tranche: string;
  value: string;
  status: string;
  statusVariant?: 'secondary' | 'primary' | 'error';
};

type Align = 'left' | 'right' | 'center';

/**
 * Generic column descriptor for the additive DataTable API.
 */
export type DataTableColumn<T = any> = {
  key: string;
  header: React.ReactNode;
  align?: Align;
  render?: (row: T) => React.ReactNode;
  /**
   * Current sort direction of this column. Sets `aria-sort` on the `th` and shows a
   * ▼/▲ glyph. Without `onSort` the header stays non-interactive (a fixed order).
   */
  sort?: 'ascending' | 'descending';
  /** Makes the header a `<button>` inside the `th`. Set only when the user can change the sort. */
  onSort?: () => void;
  /**
   * Second line under the cell value, e.g. a submission or policy reference. Rendered in
   * the mono label face and muted colour.
   */
  secondary?: (row: T) => React.ReactNode;
  /**
   * Makes this cell's primary value the row's single link. Return `undefined` for no link.
   * The whole row is never a click target.
   */
  href?: (row: T) => string | undefined;
  /** Accessible name for the link when the visible text is not enough (e.g. a missing insured name). */
  linkLabel?: (row: T) => string | undefined;
  /** Plain-text column name used as the field label in the stacked (< 600 px) layout. Defaults to `header` when it is a string. */
  label?: string;
  /** Width of the skeleton bar for this column while loading, e.g. "60%". Defaults to "70%". */
  skeletonWidth?: string;
};

/** Row tone. `muted` uses `onSurfaceVariant` text (≥ 4.5:1 in both themes), e.g. for archived rows. */
export type DataTableRowTone = 'default' | 'muted';

/** Props for the legacy fixed-Row API (backward compatible). */
export type DataTableLegacyProps = {
  rows: Row[];
};

/** Props for the generic columns/data API. */
export type DataTableGenericProps<T = any> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyText?: string;
  rowActions?: (row: T) => React.ReactNode;
  /** Table caption, e.g. "Submissions, sorted by last updated, newest first". */
  caption?: string;
  /** Hides the caption visually while keeping it for screen readers. */
  captionHidden?: boolean;
  /**
   * Callback ref to the caption, e.g. `(el) => (captionRef.current = el)`. When set, the
   * caption gets `tabIndex={-1}` so the app can move focus to it after a page loads.
   */
  captionRef?: (element: HTMLTableCaptionElement | null) => void;
  /** Tone per row. `muted` rows keep their text and links; pair with a visible label such as an Archived badge. */
  rowTone?: (row: T) => DataTableRowTone;
  /** Stable React key per row, e.g. the record id. Defaults to the row index; pass an id when rows change between keyset pages. */
  rowKey?: (row: T, index: number) => string;
  /**
   * While `loading`, show this many skeleton rows at the column widths instead of the
   * "Loading..." line. The table gets `aria-busy` and a hidden `loadingLabel`.
   */
  skeletonRows?: number;
  /** Loading text: the visible line, or the hidden label with `skeletonRows`. Defaults to "Loading...". */
  loadingLabel?: string;
  /** Stack below 600 px, or use `always` inside narrow panels at any viewport. */
  stacked?: boolean | 'always';
  /** Component used for links instead of `<a>`, e.g. a router link. It receives `href`, and `to` with the same value. */
  linkAs?: React.ComponentType<any>;
};

export type DataTableProps<T = any> = DataTableLegacyProps | DataTableGenericProps<T>;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, Menlo, monospace;
`;

const HeaderRow = styled.tr`
  background: ${withAlpha(colors.onSurface, 0.02)};
`;

const HeaderCell = styled.th<{ $align?: Align }>`
  padding: 12px;
  font-size: 10px;
  text-transform: uppercase;
  color: ${colors.onSurfaceVariant};
  text-align: ${(p) => p.$align ?? 'left'};
`;

const BodyRow = styled.tr`
  border-top: 1px solid ${withAlpha(colors.neutral[400], 0.06)};
  cursor: pointer;
`;

const BodyCell = styled.td<{ $align?: Align; $variant?: 'primary' | 'muted' }>`
  padding: 12px;
  text-align: ${(p) => p.$align ?? 'left'};
  color: ${(p) => (p.$variant === 'muted' ? colors.onSurfaceVariant : colors.text.primary)};
`;

const StatusBadge = styled.span<{ $statusVariant?: 'secondary' | 'primary' | 'error' }>`
  padding: 6px 8px;
  border-radius: ${radii.md}px;
  font-size: 10px;
  font-weight: 700;
  background: ${(p) =>
    p.$statusVariant === 'secondary'
      ? withAlpha(colors.primary, 0.08)
      : p.$statusVariant === 'error'
        ? withAlpha(colors.error, 0.08)
        : withAlpha(colors.neutral[500], 0.06)};
  color: ${(p) =>
    p.$statusVariant === 'error'
      ? colors.error
      : p.$statusVariant === 'secondary'
        ? colors.primary
        : colors.onSurfaceVariant};
`;

const StateCell = styled.td<{ $tone?: 'error' | 'muted' }>`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: ${(p) => (p.$tone === 'error' ? colors.error : colors.onSurfaceVariant)};
`;

const ActionsCell = styled.td`
  padding: 12px;
  text-align: right;
`;

const ActionsHeader = styled.th`
  padding: 12px;
  font-size: 10px;
  text-transform: uppercase;
  color: ${colors.onSurfaceVariant};
  text-align: right;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const VisuallyHidden = styled.span`
  ${visuallyHidden}
`;

const STACK_QUERY = '@media (max-width: 599.98px)';

const GenericTable = styled(Table)<{ $stacked: boolean | 'always' }>`
  ${({ $stacked }) =>
    $stacked &&
    css`
      ${$stacked === 'always' ? '@media all' : STACK_QUERY} {
        &,
        & > caption,
        & > tbody,
        & > tbody > tr,
        & > tbody > tr > td {
          display: block;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: anywhere;
        }

        & > thead {
          ${visuallyHidden}
        }

        & > tbody > tr {
          padding: ${spacing.sm}px 0;
        }

        & > tbody > tr > td {
          padding: ${spacing.xs}px ${spacing.md}px;
          text-align: left;
        }

        & > tbody > tr > td[data-label]::before {
          content: attr(data-label);
          display: block;
          font-family: ${typography.fontFamily};
          font-size: ${typography.sizes.xs}px;
          color: ${colors.onSurfaceVariant};
        }
      }
    `}
`;

const Caption = styled.caption<{ $hidden: boolean }>`
  padding: ${spacing.sm}px ${spacing.md}px;
  text-align: left;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.onSurfaceVariant};

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  ${({ $hidden }) => ($hidden ? visuallyHidden : '')}
`;

const GenericRow = styled.tr<{ $muted: boolean }>`
  border-top: 1px solid ${withAlpha(colors.neutral[400], 0.06)};

  & > td {
    color: ${({ $muted }) => ($muted ? colors.onSurfaceVariant : colors.text.primary)};
  }
`;

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${spacing.xs}px;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-transform: inherit;
  color: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  @media (pointer: coarse), (max-width: 1023.98px) {
    min-height: 44px;
  }
`;

const SortGlyph = styled.span`
  margin-left: ${spacing.xs}px;
`;

const CellLink = styled.a`
  color: inherit;
  font-weight: ${typography.weights.semibold};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
    border-radius: ${radii.sm}px;
  }
`;

const SecondaryLine = styled.span`
  display: block;
  margin-top: ${spacing.xs}px;
  font-family: ${typography.labelFamily};
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
`;

const SkeletonBar = styled.span<{ $width: string }>`
  display: block;
  width: ${({ $width }) => $width};
  height: ${typography.sizes.sm}px;
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainerHigh};
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const columnLabel = <T,>(col: DataTableColumn<T>) =>
  col.label ?? (typeof col.header === 'string' ? col.header : undefined);

const sortGlyph = (sort: DataTableColumn['sort']) =>
  sort === 'ascending' ? '▲' : sort === 'descending' ? '▼' : null;

function isGeneric<T>(props: DataTableProps<T>): props is DataTableGenericProps<T> {
  return Array.isArray((props as DataTableGenericProps<T>).columns);
}

/**
 * Legacy fixed-Row rendering. Visual output is identical to the previous
 * inline-styled implementation.
 */
const LegacyDataTable: React.FC<DataTableLegacyProps> = ({ rows }) => {
  return (
    <Table>
      <thead>
        <HeaderRow>
          <HeaderCell>Contract ID</HeaderCell>
          <HeaderCell>Tranche</HeaderCell>
          <HeaderCell $align="right">Value (USD)</HeaderCell>
          <HeaderCell $align="center">Status</HeaderCell>
        </HeaderRow>
      </thead>
      <tbody>
        {rows.map((r) => (
          <BodyRow key={r.id}>
            <BodyCell>{r.id}</BodyCell>
            <BodyCell $variant="muted">{r.tranche}</BodyCell>
            <BodyCell $align="right">{r.value}</BodyCell>
            <BodyCell $align="center">
              <StatusBadge $statusVariant={r.statusVariant}>{r.status}</StatusBadge>
            </BodyCell>
          </BodyRow>
        ))}
      </tbody>
    </Table>
  );
};

/**
 * Generic columns/data rendering with loading (text or skeleton), error, empty,
 * sortable headers, link and two-line cells, row tones, caption and an optional
 * stacked layout below 600 px.
 */
function GenericDataTable<T>({
  columns,
  data,
  loading,
  error,
  emptyText = 'No data',
  rowActions,
  caption,
  captionHidden = false,
  captionRef,
  rowTone,
  rowKey,
  skeletonRows,
  loadingLabel = 'Loading...',
  stacked = false,
  linkAs,
}: DataTableGenericProps<T>) {
  const columnCount = columns.length + (rowActions ? 1 : 0);
  const skeleton = Boolean(loading && skeletonRows && skeletonRows > 0);
  // The stacked layout changes table display, which drops table semantics in some
  // browsers, so explicit roles keep rows and cells announced.
  const role = (name: string) => (stacked ? { role: name } : {});

  const renderCell = (col: DataTableColumn<T>, row: T) => {
    const value = col.render ? col.render(row) : ((row as any)[col.key] as React.ReactNode);
    const href = col.href?.(row);
    const label = col.linkLabel?.(row);
    const primary =
      href !== undefined ? (
        <CellLink
          as={linkAs}
          href={href}
          {...(linkAs ? { to: href } : {})}
          {...(label ? { 'aria-label': label } : {})}
        >
          {value}
        </CellLink>
      ) : (
        value
      );
    const secondary = col.secondary?.(row);
    return secondary === undefined || secondary === null || secondary === '' ? (
      primary
    ) : (
      <>
        <span>{primary}</span>
        <SecondaryLine>{secondary}</SecondaryLine>
      </>
    );
  };

  let body: React.ReactNode;
  if (skeleton) {
    body = Array.from({ length: skeletonRows as number }, (_, rowIndex) => (
      <GenericRow key={rowIndex} $muted={false} aria-hidden="true">
        {columns.map((col) => (
          <BodyCell key={col.key} $align={col.align}>
            <SkeletonBar $width={col.skeletonWidth ?? '70%'} />
          </BodyCell>
        ))}
        {rowActions ? <ActionsCell /> : null}
      </GenericRow>
    ));
  } else if (loading) {
    body = (
      <tr>
        <StateCell colSpan={columnCount} role="status" aria-busy="true">
          {loadingLabel}
        </StateCell>
      </tr>
    );
  } else if (error) {
    body = (
      <tr>
        <StateCell colSpan={columnCount} $tone="error" role="alert">
          {error}
        </StateCell>
      </tr>
    );
  } else if (data.length === 0) {
    body = (
      <tr>
        <StateCell colSpan={columnCount}>{emptyText}</StateCell>
      </tr>
    );
  } else {
    body = data.map((row, rowIndex) => {
      const tone = rowTone?.(row) ?? 'default';
      return (
        <GenericRow
          {...role('row')}
          key={rowKey ? rowKey(row, rowIndex) : rowIndex}
          $muted={tone === 'muted'}
          data-xds-row-tone={tone}
        >
          {columns.map((col) => (
            <BodyCell
              {...role('cell')}
              key={col.key}
              $align={col.align}
              {...(stacked && columnLabel(col) ? { 'data-label': columnLabel(col) } : {})}
            >
              {renderCell(col, row)}
            </BodyCell>
          ))}
          {rowActions ? <ActionsCell {...role('cell')}>{rowActions(row)}</ActionsCell> : null}
        </GenericRow>
      );
    });
  }

  return (
    <GenericTable {...role('table')} $stacked={stacked} aria-busy={skeleton ? true : undefined}>
      {caption ? (
        <Caption $hidden={captionHidden} ref={captionRef} {...(captionRef ? { tabIndex: -1 } : {})}>
          {caption}
          {skeleton ? <VisuallyHidden>{`, ${loadingLabel}`}</VisuallyHidden> : null}
        </Caption>
      ) : skeleton ? (
        <Caption $hidden>{loadingLabel}</Caption>
      ) : null}
      <thead {...role('rowgroup')}>
        <HeaderRow {...role('row')}>
          {columns.map((col) => {
            const glyph = sortGlyph(col.sort);
            return (
              <HeaderCell
                {...role('columnheader')}
                key={col.key}
                $align={col.align}
                scope="col"
                {...(col.sort ? { 'aria-sort': col.sort } : {})}
              >
                {col.onSort ? (
                  <SortButton type="button" onClick={col.onSort}>
                    {col.header}
                    {glyph ? <span aria-hidden="true">{glyph}</span> : null}
                  </SortButton>
                ) : (
                  <>
                    {col.header}
                    {glyph ? <SortGlyph aria-hidden="true">{glyph}</SortGlyph> : null}
                  </>
                )}
              </HeaderCell>
            );
          })}
          {rowActions ? (
            <ActionsHeader {...role('columnheader')} scope="col">
              <VisuallyHidden>Actions</VisuallyHidden>
            </ActionsHeader>
          ) : null}
        </HeaderRow>
      </thead>
      <tbody {...role('rowgroup')}>{body}</tbody>
    </GenericTable>
  );
}

/**
 * DataTable supports two APIs:
 *  - Legacy fixed-Row API: `<DataTable rows={Row[]} />`
 *  - Generic API: `<DataTable columns={...} data={...} loading error emptyText rowActions />`
 *
 * The active API is chosen by which prop is provided (`columns` => generic).
 */
export function DataTable<T = any>(props: DataTableProps<T>) {
  if (isGeneric(props)) {
    return <GenericDataTable<T> {...props} />;
  }
  return <LegacyDataTable {...props} />;
}

export default DataTable;
