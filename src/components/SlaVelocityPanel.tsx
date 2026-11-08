import React from 'react';
import styled from 'styled-components';
import { spacing } from '../tokens.js';
import ResultsPanel from './ResultsPanel.js';
import ResultMetricCard from './ResultMetricCard.js';
import Badge from './Badge.js';
import type { SlaVelocityPanelProps } from './UnderwritingDashboard.types.js';
export type { SlaVelocityPanelProps } from './UnderwritingDashboard.types.js';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: ${spacing.sm}px;
`;
export function SlaVelocityPanel({
  title,
  description,
  cycleTime,
  clearanceEfficiency,
  onTime,
  comparison,
  basis,
  queueNote,
  state = 'ready',
  message,
  onRetry,
}: SlaVelocityPanelProps) {
  return (
    <ResultsPanel
      title={title}
      description={description}
      state={state}
      message={message}
      onRetry={onRetry}
      action={
        state === 'ready' && onTime ? (
          <Badge variant={onTime.tone ?? 'neutral'}>{onTime.label}</Badge>
        ) : undefined
      }
    >
      <Grid>
        <ResultMetricCard label="Average cycle time" value={cycleTime} comparison={comparison} />
        <ResultMetricCard label="Clearance efficiency" value={clearanceEfficiency} />
      </Grid>
      <p>{basis}</p>
      {queueNote && <p>{queueNote}</p>}
    </ResultsPanel>
  );
}
export default SlaVelocityPanel;
