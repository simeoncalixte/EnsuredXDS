import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
import Button from './Button.js';
import Badge from './Badge.js';

import type { ResultsToolbarProps } from './UnderwritingDashboard.types.js';
export type { ResultsToolbarProps } from './UnderwritingDashboard.types.js';

const Root = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${spacing.lg}px;
  font-family: ${typography.fontFamily};
  color: ${colors.onSurface};
  h1 {
    font-size: ${typography.sizes.xl}px;
    margin: 0 0 ${spacing.sm}px;
    overflow-wrap: anywhere;
  }
  p {
    font-size: ${typography.sizes.sm}px;
    margin: 0;
    color: ${colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
`;
export function ResultsToolbar({
  title,
  description,
  periodLabel,
  matchedCount,
  activeFilterCount = 0,
  loading,
  onOpenFilters,
  onClearFilters,
  actions,
}: ResultsToolbarProps) {
  return (
    <Root>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <Actions>
        <Badge variant="neutral">{periodLabel}</Badge>
        <span role="status">
          {loading ? 'Updating results…' : matchedCount != null ? `${matchedCount} matches` : ''}
        </span>
        <Button type="button" variant="secondary" onClick={onOpenFilters}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
        {activeFilterCount > 0 && onClearFilters && (
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {actions}
      </Actions>
    </Root>
  );
}
export default ResultsToolbar;
