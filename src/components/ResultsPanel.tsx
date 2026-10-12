import React, { useId } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';
import Button from './Button.js';

import type { ResultsPanelProps } from './UnderwritingDashboard.types.js';
export type { ResultState, ResultsPanelProps } from './UnderwritingDashboard.types.js';

const Root = styled.section`
  min-width: 0;
  padding: ${spacing.lg}px;
  border-radius: ${radii.lg}px;
  border: 1px solid ${colors.outlineVariant};
  background: ${colors.surfaceContainerLow};
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};
`;
const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
  h2 {
    margin: 0;
    font-size: ${typography.sizes.md}px;
    font-weight: ${typography.weights.semibold};
    overflow-wrap: anywhere;
  }
  p {
    margin: ${spacing.xs}px 0 0;
    color: ${colors.onSurfaceVariant};
    font-size: ${typography.sizes.xs}px;
    line-height: 1.5;
  }
`;
const Notice = styled.div`
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: ${spacing.md}px;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.5;
`;
const messages = {
  loading: 'Loading results…',
  empty: 'No results match the selected filters.',
  unavailable: 'Data is not available for this result.',
  error: 'Unable to load this result.',
};
export function ResultsPanel({
  title,
  description,
  state = 'ready',
  message,
  action,
  children,
  onRetry,
  className,
}: ResultsPanelProps) {
  const headingId = useId();
  return (
    <Root className={className} aria-labelledby={headingId} aria-busy={state === 'loading'}>
      <Header>
        <div>
          <h2 id={headingId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </Header>
      {state === 'ready' ? (
        children
      ) : (
        <Notice role={state === 'error' ? 'alert' : 'status'}>
          <span>{message ?? messages[state]}</span>
          {state === 'error' && onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          )}
        </Notice>
      )}
    </Root>
  );
}
export default ResultsPanel;
