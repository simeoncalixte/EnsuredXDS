import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
import ProgressBar from './ProgressBar.js';
import Badge from './Badge.js';

import type { AllocationListProps } from './UnderwritingDashboard.types.js';
export type { AllocationItem, AllocationListProps } from './UnderwritingDashboard.types.js';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${spacing.lg}px;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  li {
    min-width: 0;
  }
`;
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
  color: ${colors.onSurface};
  span {
    overflow-wrap: anywhere;
  }
`;
const Meta = styled.span`
  color: ${colors.onSurfaceVariant};
  font-family: ${typography.labelFamily};
  font-size: ${typography.sizes.xs}px;
`;
const Basis = styled.p`
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  line-height: 1.5;
  margin: ${spacing.md}px 0 0;
`;
export function AllocationList({
  items,
  basis,
  emptyMessage = 'No allocation data is available.',
}: AllocationListProps) {
  return (
    <div>
      {!items.length ? (
        <Basis role="status">{emptyMessage}</Basis>
      ) : (
        <List aria-label="Allocation results">
          {items.map((item) => {
            const valid =
              item.share !== null &&
              Number.isFinite(item.share) &&
              item.share >= 0 &&
              item.share <= 100;
            return (
              <li key={item.id}>
                <Row>
                  <span>{item.label}</span>
                  <Meta>
                    {item.formattedValue} ·{' '}
                    {valid ? `${item.share!.toFixed(1)}%` : 'Share unavailable'}
                  </Meta>
                  {item.annotation && (
                    <Badge variant={item.annotation.tone ?? 'neutral'}>
                      {item.annotation.label}
                    </Badge>
                  )}
                </Row>
                {valid && (
                  <ProgressBar
                    value={item.share!}
                    size="sm"
                    tone={item.tone ?? 'primary'}
                    aria-label={`${item.label} allocation`}
                  />
                )}
              </li>
            );
          })}
        </List>
      )}
      <Basis>{basis}</Basis>
    </div>
  );
}
export default AllocationList;
