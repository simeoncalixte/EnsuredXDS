import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';
import { formatDateOnly } from '../formatDateOnly.js';

/**
 * How a value is shown.
 * - `text`: as given.
 * - `date-only`: a `YYYY-MM-DD` calendar day (effective, inception or expiry date),
 *   shown as `01 Jan 2027` in every time zone and never passed through `Date`.
 * - `mono`: identifiers such as a submission, policy or claim reference.
 */
export type KeyValueListItemType = 'text' | 'date-only' | 'mono';

export type KeyValueListItem = {
  /** Stable key for React. Defaults to the label. */
  id?: string;
  /** Term shown in the `dt`, e.g. "Effective date". */
  label: string;
  /** Value shown in the `dd`. `null`, `undefined` or an empty string shows the empty placeholder. */
  value?: string | number | null;
  /** How the value is formatted. Defaults to `text`. */
  type?: KeyValueListItemType;
  /** Machine-readable date or datetime. Wraps the value in `<time dateTime>`. Set automatically for valid `date-only` values. */
  dateTime?: string;
};

export type KeyValueListProps = {
  /** Terms and values, in reading order. */
  items: KeyValueListItem[];
  /** Maximum columns at wide widths. 3 shows 3 columns at 1024 px and up, 2 from 600 px, and 1 below 600 px. Defaults to 1. */
  columns?: 1 | 2 | 3;
  /** Shows a skeleton instead of the list and sets `aria-busy`. */
  loading?: boolean;
  /** Number of skeleton rows while loading. Defaults to the number of items, or 6 when there are none. */
  skeletonCount?: number;
  /** Visible placeholder for an empty value. Defaults to "—". */
  emptyValue?: string;
  /** Screen-reader text for an empty value. Defaults to "Not set". */
  emptyValueLabel?: string;
  /** Screen-reader text while loading. Defaults to "Loading details". */
  loadingLabel?: string;
  /** Shown when `items` is empty. Defaults to "No details to show." */
  emptyMessage?: string;
  className?: string;
};

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

const gridColumns = css<{ $columns: 1 | 2 | 3 }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${spacing.md}px ${spacing.lg}px;
  margin: 0;
  font-family: ${typography.fontFamily};

  @media (min-width: 600px) {
    grid-template-columns: repeat(${({ $columns }) => Math.min($columns, 2)}, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  }
`;

const Grid = styled.dl<{ $columns: 1 | 2 | 3 }>`
  ${gridColumns}
`;

const SkeletonGrid = styled.div<{ $columns: 1 | 2 | 3 }>`
  ${gridColumns}
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
  min-width: 0;
`;

const Term = styled.dt`
  margin: 0;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.medium};
  color: ${colors.onSurfaceVariant};
`;

const Value = styled.dd<{ $mono: boolean }>`
  margin: 0;
  font-family: ${({ $mono }) => ($mono ? typography.labelFamily : typography.fontFamily)};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.primary};
  overflow-wrap: anywhere;
`;

const Empty = styled.span`
  color: ${colors.onSurfaceVariant};
`;

const Bar = styled.span<{ $width: string; $height: number }>`
  display: block;
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height}px;
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainerHigh};
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Message = styled.p`
  margin: 0;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.onSurfaceVariant};
`;

const VisuallyHidden = styled.span`
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

const isEmpty = (value: KeyValueListItem['value']): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

const VALUE_WIDTHS = ['70%', '55%', '80%', '45%', '65%', '60%'];

export function KeyValueList({
  items,
  columns = 1,
  loading = false,
  skeletonCount,
  emptyValue = '—',
  emptyValueLabel = 'Not set',
  loadingLabel = 'Loading details',
  emptyMessage = 'No details to show.',
  className,
}: KeyValueListProps) {
  if (loading) {
    const count = Math.max(1, skeletonCount ?? (items.length || 6));
    return (
      <div
        className={className}
        data-xds="key-value-list"
        data-state="loading"
        data-columns={columns}
        aria-busy="true"
      >
        <VisuallyHidden>{loadingLabel}</VisuallyHidden>
        <SkeletonGrid $columns={columns} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <Group key={index}>
              <Bar $width="40%" $height={typography.sizes.xs} />
              <Bar
                $width={VALUE_WIDTHS[index % VALUE_WIDTHS.length]}
                $height={typography.sizes.sm}
              />
            </Group>
          ))}
        </SkeletonGrid>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Message className={className} data-xds="key-value-list" data-state="empty">
        {emptyMessage}
      </Message>
    );
  }

  return (
    <Grid $columns={columns} className={className} data-xds="key-value-list" data-columns={columns}>
      {items.map((item) => {
        const type = item.type ?? 'text';
        let content: React.ReactNode;
        if (isEmpty(item.value)) {
          content = (
            <Empty data-empty="true">
              <span aria-hidden="true">{emptyValue}</span>
              <VisuallyHidden>{emptyValueLabel}</VisuallyHidden>
            </Empty>
          );
        } else {
          const raw = String(item.value);
          const formatted = type === 'date-only' ? formatDateOnly(raw) : null;
          // An invalid date-only value is shown as given, so the data stays visible.
          const text = formatted ?? raw;
          const dateTime = item.dateTime ?? (formatted ? raw : undefined);
          content = dateTime ? <time dateTime={dateTime}>{text}</time> : text;
        }
        return (
          <Group key={item.id ?? item.label} data-type={type}>
            <Term>{item.label}</Term>
            <Value $mono={type === 'mono'}>{content}</Value>
          </Group>
        );
      })}
    </Grid>
  );
}

export default KeyValueList;
