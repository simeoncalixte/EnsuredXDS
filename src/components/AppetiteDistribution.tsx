import React from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';
import ResultsPanel from './ResultsPanel.js';
import type { AppetiteDistributionProps } from './UnderwritingDashboard.types.js';
export type { AppetiteSegment, AppetiteDistributionProps } from './UnderwritingDashboard.types.js';

const palette = {
  success: colors.success,
  info: colors.info,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.onSurfaceVariant,
};
const Track = styled.div`
  display: flex;
  height: 12px;
  overflow: hidden;
  border-radius: ${radii.round}px;
  background: ${colors.surfaceContainerHigh};
`;
const Segment = styled.span<{ $width: number; $tone: keyof typeof palette }>`
  width: ${({ $width }) => $width}%;
  background: ${({ $tone }) => palette[$tone]};
`;
const Legend = styled.ul`
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: ${spacing.sm}px;
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
  li {
    padding: ${spacing.sm}px;
    background: ${colors.surfaceContainer};
    overflow-wrap: anywhere;
  }
  strong {
    display: block;
    color: ${colors.onSurface};
    font-family: ${typography.labelFamily};
  }
`;
const Note = styled.p`
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
  line-height: 1.5;
`;
export function AppetiteDistribution({
  title,
  description,
  segments,
  basis,
  note,
  state = 'ready',
  message,
}: AppetiteDistributionProps) {
  const valid = (n: number | null): n is number =>
    n != null && Number.isFinite(n) && n >= 0 && n <= 100;
  const total = segments.reduce(
    (sum, segment) => sum + (valid(segment.percent) ? segment.percent : 0),
    0,
  );
  const canDraw =
    segments.length > 0 && segments.every((segment) => valid(segment.percent)) && total <= 100;
  return (
    <ResultsPanel
      title={title}
      description={description}
      state={state === 'ready' && !segments.length ? 'empty' : state}
      message={message}
    >
      {canDraw ? (
        <Track
          role="img"
          aria-label={
            segments.map((segment) => `${segment.label}: ${segment.percent}%`).join(', ') +
            (total < 100 ? `, Unspecified: ${100 - total}%` : '')
          }
        >
          {segments.map((segment) => (
            <Segment key={segment.id} $width={segment.percent!} $tone={segment.tone ?? 'neutral'} />
          ))}
        </Track>
      ) : (
        <Note role="status">
          Distribution unavailable: complete, non-overlapping percentages are required.
        </Note>
      )}
      <Legend>
        {segments.map((segment) => (
          <li key={segment.id}>
            <strong>{valid(segment.percent) ? `${segment.percent}%` : 'Unavailable'}</strong>
            {segment.label}
          </li>
        ))}
        {canDraw && total < 100 && (
          <li>
            <strong>{Number((100 - total).toFixed(1))}%</strong>Unspecified
          </li>
        )}
      </Legend>
      <Note>{basis}</Note>
      {note && <Note>{note}</Note>}
    </ResultsPanel>
  );
}
export default AppetiteDistribution;
