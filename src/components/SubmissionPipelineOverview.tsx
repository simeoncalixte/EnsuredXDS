import React from 'react';
import styled from 'styled-components';
import { spacing } from '../tokens.js';
import ResultsPanel from './ResultsPanel.js';
import PipelineStageCard from './PipelineStageCard.js';
import Badge from './Badge.js';
import type { SubmissionPipelineOverviewProps } from './UnderwritingDashboard.types.js';
export type {
  PipelineStage,
  SubmissionPipelineOverviewProps,
} from './UnderwritingDashboard.types.js';

const Stages = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: ${spacing.md}px;
`;
const Detail = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
  gap: ${spacing.md}px;
  margin-top: ${spacing.lg}px;
`;
const Summary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.sm}px;
`;
export function SubmissionPipelineOverview({
  title,
  description,
  stages,
  activeCount,
  capacity,
  basis,
  state = 'ready',
  message,
  onRetry,
  onOpenStage,
  children,
}: SubmissionPipelineOverviewProps) {
  const effectiveState = state === 'ready' && stages.length === 0 ? 'empty' : state;
  const validCount = activeCount != null && Number.isInteger(activeCount) && activeCount >= 0;
  return (
    <ResultsPanel
      title={title}
      description={description}
      state={effectiveState}
      message={message}
      onRetry={onRetry}
      action={
        effectiveState === 'ready' ? (
          <Summary>
            {validCount && <Badge variant="success">{activeCount} active inquiries</Badge>}
            {capacity != null && <Badge variant="info">{capacity} capacity</Badge>}
          </Summary>
        ) : undefined
      }
    >
      <Stages>
        {stages.map(({ id, ...stage }) => (
          <PipelineStageCard
            key={id}
            {...stage}
            onOpen={onOpenStage ? () => onOpenStage(id) : undefined}
          />
        ))}
      </Stages>
      {basis && <p>{basis}</p>}
      {children && <Detail>{children}</Detail>}
    </ResultsPanel>
  );
}
export default SubmissionPipelineOverview;
