import React, { useId } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/**
 * Keyset (cursor) pagination: Previous / Next only.
 *
 * Keyset lists have no cheap total and no page numbers, so this component never
 * shows either. Disabled buttons use `aria-disabled` (not `disabled`) so they stay
 * focusable and their reason is read through `aria-describedby`.
 */
export type PaginationMode = 'keyset';

export type PaginationProps = {
  /** Only keyset (cursor) mode is supported today. */
  mode?: PaginationMode;
  /** True when a previous cursor exists. When false, Previous is aria-disabled. */
  hasPrevious: boolean;
  /** True when the API returned a next cursor. When false, Next is aria-disabled. */
  hasNext: boolean;
  /** Called when an enabled Previous button is activated. */
  onPrevious?: () => void;
  /** Called when an enabled Next button is activated. */
  onNext?: () => void;
  /** A page request is in flight: both buttons are aria-disabled and the nav is aria-busy. */
  loading?: boolean;
  /** Accessible name of the navigation landmark. Defaults to "Pagination". */
  label?: string;
  /** Visible text of the Previous button. Defaults to "Previous". */
  previousLabel?: string;
  /** Visible text of the Next button. Defaults to "Next". */
  nextLabel?: string;
  /** Reason read when Previous is disabled. Defaults to "You're on the first page". */
  previousDisabledReason?: string;
  /** Reason read when Next is disabled. Defaults to "You're on the last page". */
  nextDisabledReason?: string;
  /** Reason read for both buttons while loading. Defaults to "Loading the page". */
  loadingReason?: string;
  /** Optional status text shown at the end of the bar, e.g. "25 per page". */
  pageSizeLabel?: string;
  className?: string;
};

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.sm}px ${spacing.md}px;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.primary};
`;

const Buttons = styled.div`
  display: flex;
  gap: ${spacing.sm}px;
`;

const PageButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs}px;
  /* 32 px meets WCAG 2.5.8 (24 px minimum) on fine pointers at desktop widths. */
  min-height: 32px;
  min-width: 32px;
  padding: ${spacing.xs}px ${spacing.md}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  background: transparent;
  color: ${colors.text.primary};
  font: inherit;
  font-weight: ${typography.weights.semibold};
  cursor: pointer;

  &:hover:not([aria-disabled='true']) {
    background: ${colors.surfaceContainerHigh};
  }

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    color: ${colors.onSurfaceVariant};
    border-style: dashed;
  }

  /* 44 x 44 px targets on touch pointers and below 1024 px. */
  @media (pointer: coarse), (max-width: 1023px) {
    min-height: 44px;
    min-width: 44px;
  }
`;

const Glyph = styled.span`
  font-size: ${typography.sizes.md}px;
  line-height: 1;
`;

const PageSize = styled.span`
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
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

export function Pagination({
  mode = 'keyset',
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  loading = false,
  label = 'Pagination',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  previousDisabledReason = "You're on the first page",
  nextDisabledReason = "You're on the last page",
  loadingReason = 'Loading the page',
  pageSizeLabel,
  className,
}: PaginationProps) {
  const id = useId();
  const previousReasonId = `${id}-previous-reason`;
  const nextReasonId = `${id}-next-reason`;

  const previousDisabled = loading || !hasPrevious;
  const nextDisabled = loading || !hasNext;
  const previousReason = loading ? loadingReason : previousDisabledReason;
  const nextReason = loading ? loadingReason : nextDisabledReason;

  const state = loading
    ? 'loading'
    : hasPrevious && hasNext
      ? 'middle'
      : hasPrevious
        ? 'last'
        : hasNext
          ? 'first'
          : 'single';

  return (
    <Nav
      aria-label={label}
      aria-busy={loading || undefined}
      className={className}
      data-xds="pagination"
      data-mode={mode}
      data-state={state}
    >
      <Buttons>
        <PageButton
          type="button"
          aria-disabled={previousDisabled || undefined}
          aria-describedby={previousDisabled ? previousReasonId : undefined}
          onClick={previousDisabled ? undefined : onPrevious}
        >
          <Glyph aria-hidden="true">‹</Glyph>
          {previousLabel}
        </PageButton>
        <PageButton
          type="button"
          aria-disabled={nextDisabled || undefined}
          aria-describedby={nextDisabled ? nextReasonId : undefined}
          onClick={nextDisabled ? undefined : onNext}
        >
          {nextLabel}
          <Glyph aria-hidden="true">›</Glyph>
        </PageButton>
      </Buttons>
      {previousDisabled && <VisuallyHidden id={previousReasonId}>{previousReason}</VisuallyHidden>}
      {nextDisabled && <VisuallyHidden id={nextReasonId}>{nextReason}</VisuallyHidden>}
      {pageSizeLabel && <PageSize>{pageSizeLabel}</PageSize>}
    </Nav>
  );
}

export default Pagination;
