import React from 'react';
import styled from 'styled-components';
import { spacing, radii, typography } from '../tokens.js';
import { colors } from '../colors.js';
import ResultsPanel from './ResultsPanel.js';
import Badge from './Badge.js';
import Button from './Button.js';
import type { PriorityUnderwriterQueueProps } from './UnderwritingDashboard.types.js';
export type {
  PriorityQueueItem,
  PriorityUnderwriterQueueProps,
} from './UnderwritingDashboard.types.js';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${spacing.sm}px;
  li {
    padding: ${spacing.md}px;
    border-radius: ${radii.sm}px;
    background: ${colors.surfaceContainer};
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing.sm}px;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    margin: 0;
    font-size: ${typography.sizes.sm}px;
    color: ${colors.onSurface};
    overflow-wrap: anywhere;
  }
  p {
    margin: ${spacing.xs}px 0 0;
    font-size: ${typography.sizes.xs}px;
    color: ${colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;
export function PriorityUnderwriterQueue({
  title,
  description,
  items,
  escalationNote,
  state = 'ready',
  message,
  onRetry,
  onOpenSubmission,
}: PriorityUnderwriterQueueProps) {
  const effectiveState = state === 'ready' && items.length === 0 ? 'empty' : state;
  const critical = items.filter((item) => item.critical).length;
  return (
    <ResultsPanel
      title={title}
      description={description}
      state={effectiveState}
      message={message}
      onRetry={onRetry}
      action={
        effectiveState === 'ready' && critical > 0 ? (
          <Badge variant="danger">{critical} critical</Badge>
        ) : undefined
      }
    >
      <List>
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
            </div>
            <Badge variant={item.status.tone ?? 'neutral'}>{item.status.label}</Badge>
            {onOpenSubmission && (
              <Button
                type="button"
                variant="text"
                size="sm"
                aria-label={`Open ${item.title}`}
                onClick={() => onOpenSubmission(item.id)}
              >
                Open submission
              </Button>
            )}
          </li>
        ))}
      </List>
      {escalationNote && <p>{escalationNote}</p>}
    </ResultsPanel>
  );
}
export default PriorityUnderwriterQueue;
