import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';
import ResultsPanel from './ResultsPanel.js';
import Badge from './Badge.js';
import ProgressBar from './ProgressBar.js';
import Button from './Button.js';
import type { PipelineStageCardProps } from './UnderwritingDashboard.types.js';
export type { PipelineStageCardProps } from './UnderwritingDashboard.types.js';

const Content = styled.div`
  display: grid;
  gap: ${spacing.md}px;
  color: ${colors.onSurface};
  dl {
    margin: 0;
  }
  dt {
    font-size: ${typography.sizes.xs}px;
    color: ${colors.onSurfaceVariant};
  }
  dd {
    margin: ${spacing.xs}px 0 0;
    font-family: ${typography.labelFamily};
    font-size: ${typography.sizes.xl}px;
    overflow-wrap: anywhere;
  }
  p {
    margin: 0;
    color: ${colors.onSurfaceVariant};
    font-size: ${typography.sizes.sm}px;
    line-height: 1.5;
  }
  ul {
    margin: 0;
    padding-left: ${spacing.md}px;
    color: ${colors.onSurfaceVariant};
    font-size: ${typography.sizes.xs}px;
  }
`;
export function PipelineStageCard({
  title,
  count,
  exposure,
  exposureLabel = 'Total insured value',
  tone = 'neutral',
  metric,
  progress,
  notes,
  state = 'ready',
  message,
  onOpen,
}: PipelineStageCardProps) {
  const validCount = count != null && Number.isInteger(count) && count >= 0;
  const validProgress =
    progress &&
    Number.isFinite(progress.percent) &&
    progress.percent >= 0 &&
    progress.percent <= 100;
  return (
    <ResultsPanel
      title={title}
      state={state}
      message={message}
      action={
        state === 'ready' ? (
          <Badge variant={tone}>
            {validCount ? `${count} ${count === 1 ? 'deal' : 'deals'}` : 'Count unavailable'}
          </Badge>
        ) : undefined
      }
    >
      <Content>
        <dl>
          <dt>{exposureLabel}</dt>
          <dd>{exposure ?? 'Unavailable'}</dd>
        </dl>
        {metric && (
          <p>
            {metric.label}: <strong>{metric.value ?? 'Unavailable'}</strong>
          </p>
        )}
        {validProgress && <ProgressBar value={progress.percent} label={progress.label} size="sm" />}
        {notes && (
          <ul>
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        )}
        {onOpen && (
          <Button type="button" variant="text" onClick={onOpen} aria-label={`View ${title}`}>
            View submissions
          </Button>
        )}
      </Content>
    </ResultsPanel>
  );
}
export default PipelineStageCard;
