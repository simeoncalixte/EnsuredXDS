import React from 'react';
import styled from 'styled-components';
import { spacing } from '../tokens.js';
import ResultsPanel from './ResultsPanel.js';
import TreatyRenewalCard from './TreatyRenewalCard.js';
import Badge from './Badge.js';

import type { TreatyRenewalWatchlistProps } from './UnderwritingDashboard.types.js';
export type {
  TreatyRenewalItem,
  TreatyRenewalWatchlistProps,
} from './UnderwritingDashboard.types.js';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: ${spacing.md}px;
`;
const Summary = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.md}px;
`;
export function TreatyRenewalWatchlist({
  title,
  description,
  items,
  totalRenewingLimit,
  basis,
  state = 'ready',
  message,
  onRetry,
  onOpenTreaty,
}: TreatyRenewalWatchlistProps) {
  const currentState = state === 'ready' && items.length === 0 ? 'empty' : state;
  const critical = items.filter((item) => item.critical).length;
  return (
    <ResultsPanel
      title={title}
      description={description}
      state={currentState}
      message={message}
      onRetry={onRetry}
      action={
        currentState === 'ready' ? (
          <Summary>
            {critical > 0 && (
              <Badge variant="warning">
                {critical} critical {critical === 1 ? 'renewal' : 'renewals'}
              </Badge>
            )}
            <span>
              Total renewing limit: <strong>{totalRenewingLimit ?? 'Unavailable'}</strong>
            </span>
          </Summary>
        ) : undefined
      }
    >
      <Grid>
        {items.map(({ id, critical: _, ...item }) => (
          <TreatyRenewalCard
            key={id}
            {...item}
            onOpen={onOpenTreaty ? () => onOpenTreaty(id) : undefined}
          />
        ))}
      </Grid>
      {basis && <p>{basis}</p>}
    </ResultsPanel>
  );
}
export default TreatyRenewalWatchlist;
