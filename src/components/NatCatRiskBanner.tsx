import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';
import Badge from './Badge.js';
import Button from './Button.js';
import ResultsPanel from './ResultsPanel.js';

import type { NatCatRiskBannerProps } from './UnderwritingDashboard.types.js';
export type { NatCatRiskBannerProps } from './UnderwritingDashboard.types.js';

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.lg}px;
  background: ${colors.surfaceContainerLow};
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.lg}px;
  font-family: ${typography.fontFamily};
  color: ${colors.onSurface};
`;
const Copy = styled.div`
  flex: 1 1 320px;
  min-width: 0;
  h2 {
    margin: 0;
    font-size: ${typography.sizes.lg}px;
    overflow-wrap: anywhere;
  }
  p {
    margin: ${spacing.sm}px 0 0;
    color: ${colors.onSurfaceVariant};
    font-size: ${typography.sizes.sm}px;
    line-height: 1.5;
  }
  strong {
    color: ${colors.onSurface};
  }
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px;
`;
const Detail = styled.div`
  flex-basis: 100%;
  min-width: 0;
  padding-top: ${spacing.md}px;
  border-top: 1px solid ${colors.outlineVariant};
`;
export function NatCatRiskBanner({
  title,
  grossExposure,
  netRetained,
  treatyCount,
  status,
  bufferLabel,
  basis,
  state = 'ready',
  message,
  onRetry,
  onViewHazard,
  onRunStressTest,
  stressTestRunning,
  stressTestError,
  details,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
}: NatCatRiskBannerProps) {
  const heading = useId();
  const detailId = useId();
  const [localExpanded, setExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? localExpanded;
  if (state !== 'ready')
    return <ResultsPanel title={title} state={state} message={message} onRetry={onRetry} />;
  return (
    <Header as="section" aria-labelledby={heading}>
      <Copy>
        <h2 id={heading}>{title}</h2>
        <p>
          Estimated gross exposure: <strong>{grossExposure ?? 'Unavailable'}</strong>
          {treatyCount != null && Number.isInteger(treatyCount) && treatyCount >= 0
            ? ` across ${treatyCount} treaties`
            : ''}
          .<br />
          Net retained: <strong>{netRetained ?? 'Unavailable'}</strong>
        </p>
        {basis && <p>{basis}</p>}
      </Copy>
      <Actions>
        {status && <Badge variant={status.tone ?? 'neutral'}>{status.label}</Badge>}
        {bufferLabel && <Badge variant="info">{bufferLabel}</Badge>}
      </Actions>
      <Actions>
        {onViewHazard && (
          <Button type="button" variant="secondary" onClick={onViewHazard}>
            View GIS hazard
          </Button>
        )}
        {onRunStressTest && (
          <Button type="button" onClick={onRunStressTest} disabled={stressTestRunning}>
            {stressTestRunning ? 'Running stress test…' : 'Run RDS stress test'}
          </Button>
        )}
        {details != null && (
          <Button
            type="button"
            variant="ghost"
            aria-expanded={isExpanded}
            aria-controls={detailId}
            onClick={() => {
              const next = !isExpanded;
              setExpanded(next);
              onExpandedChange?.(next);
            }}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button>
        )}
      </Actions>
      {stressTestRunning && <span role="status">Stress test in progress.</span>}
      {stressTestError && <Detail role="alert">{stressTestError}</Detail>}
      {details != null && (
        <Detail id={detailId} hidden={!isExpanded}>
          {details}
        </Detail>
      )}
    </Header>
  );
}
export default NatCatRiskBanner;
