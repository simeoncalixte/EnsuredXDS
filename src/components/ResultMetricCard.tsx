import React from 'react';
import styled from 'styled-components';
import { spacing, typography } from '../tokens.js';
import { colors } from '../colors.js';
import ResultsPanel from './ResultsPanel.js';
import Badge from './Badge.js';
import ProgressBar from './ProgressBar.js';

import type { ResultMetricCardProps } from './UnderwritingDashboard.types.js';
export type { ResultMetricCardProps } from './UnderwritingDashboard.types.js';

const Value = styled.div`
  font-family: ${typography.labelFamily};
  font-size: ${typography.sizes.xl}px;
  font-weight: ${typography.weights.bold};
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
`;
const Details = styled.div`
  display: grid;
  gap: ${spacing.md}px;
  p {
    margin: 0;
    font-size: ${typography.sizes.xs}px;
    color: ${colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;
const Change = styled.div<{ $tone: 'neutral' | 'success' | 'warning' | 'danger' }>`
  font-size: ${typography.sizes.xs}px;
  color: ${({ $tone }) => ($tone === 'neutral' ? colors.onSurfaceVariant : colors[$tone])};
`;
export function ResultMetricCard({
  label,
  value,
  state = 'ready',
  message,
  status,
  comparison,
  coverage,
  target,
  basis,
  onRetry,
  className,
}: ResultMetricCardProps) {
  const resolvedState = state === 'ready' && value == null ? 'unavailable' : state;
  const validCoverage =
    coverage &&
    Number.isInteger(coverage.populated) &&
    Number.isInteger(coverage.total) &&
    coverage.populated >= 0 &&
    coverage.total >= coverage.populated;
  const validTarget =
    target &&
    Number.isFinite(target.value) &&
    Number.isFinite(target.max) &&
    target.max > 0 &&
    target.value >= 0;
  return (
    <ResultsPanel
      title={label}
      state={resolvedState}
      message={message}
      onRetry={onRetry}
      className={className}
      action={
        resolvedState === 'ready' && status ? (
          <Badge variant={status.tone ?? 'neutral'}>{status.label}</Badge>
        ) : undefined
      }
    >
      <Details>
        <Value>{value}</Value>
        {comparison && (
          <Change $tone={comparison.tone ?? 'neutral'}>
            {comparison.direction && (
              <span
                aria-label={
                  comparison.direction === 'flat'
                    ? 'Unchanged'
                    : comparison.direction === 'up'
                      ? 'Increased'
                      : 'Decreased'
                }
              >
                {comparison.direction === 'up'
                  ? '↑ '
                  : comparison.direction === 'down'
                    ? '↓ '
                    : '→ '}
              </span>
            )}
            {comparison.label}
          </Change>
        )}
        {validTarget && (
          <ProgressBar value={target.value} max={target.max} label={target.label} size="sm" />
        )}
        {validCoverage && (
          <p>
            {coverage.populated} of {coverage.total} matching records populated
            {coverage.populated < coverage.total ? ' · Partial data' : ''}
          </p>
        )}
        {basis && <p>{basis}</p>}
      </Details>
    </ResultsPanel>
  );
}
export default ResultMetricCard;
