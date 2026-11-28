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
  h2,
  h3,
  h4 {
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
  p {
    margin: 0;
  }
  code {
    font-family: ${typography.labelFamily};
    color: ${colors.onSurface};
    overflow-wrap: anywhere;
  }
`;
const Message = styled.div`
  display: grid;
  gap: ${spacing.xs}px;
`;
const Basis = styled.p`
  font-size: ${typography.sizes.xs}px;
`;
const AdminDetails = styled.details`
  width: 100%;
  font-size: ${typography.sizes.xs}px;
  summary {
    cursor: pointer;
    color: ${colors.onSurface};
  }
  summary:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
  > div {
    margin-top: ${spacing.sm}px;
    overflow-wrap: anywhere;
  }
`;
const messages = {
  loading: 'Loading results…',
  empty: 'No results match the selected filters.',
  unavailable: 'Data is not available for this result.',
  error: "We couldn't load this panel. The other panels aren't affected. Try again in a moment.",
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
  headingLevel = 2,
  basis,
  reference,
  adminDetails,
  announce,
}: ResultsPanelProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const live = announce ?? state !== 'unavailable';
  const role = live ? (state === 'error' ? 'alert' : 'status') : undefined;
  const showBasis = basis && (state === 'unavailable' || state === 'empty');
  return (
    <Root className={className} aria-labelledby={headingId} aria-busy={state === 'loading'}>
      <Header>
        <div>
          <Heading id={headingId}>{title}</Heading>
          {description && <p>{description}</p>}
        </div>
        {action}
      </Header>
      {state === 'ready' ? (
        children
      ) : (
        <Notice>
          <Message role={role}>
            <p>{message ?? messages[state]}</p>
            {showBasis && <Basis>{basis}</Basis>}
            {state === 'error' && reference && (
              <p>
                If this keeps happening, contact support and give this reference. Reference:{' '}
                <code>{reference}</code>
              </p>
            )}
          </Message>
          {state === 'error' && onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
          {state === 'error' && adminDetails && (
            <AdminDetails>
              <summary>Technical details (admins only)</summary>
              <div>{adminDetails}</div>
            </AdminDetails>
          )}
        </Notice>
      )}
    </Root>
  );
}
export default ResultsPanel;
