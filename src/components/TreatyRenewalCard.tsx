import React, { useId } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';
import Badge from './Badge.js';
import Button from './Button.js';

import type { TreatyRenewalCardProps } from './UnderwritingDashboard.types.js';
export type { TreatyRenewalCardProps } from './UnderwritingDashboard.types.js';

const Root = styled.article`
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: ${spacing.md}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainer};
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};
`;
const Header = styled.header`
  display: flex;
  gap: ${spacing.sm}px;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  h3 {
    margin: 0;
    flex: 1 1 160px;
    overflow-wrap: anywhere;
    font-size: ${typography.sizes.sm}px;
    line-height: 1.5;
  }
`;
const Meta = styled.p`
  margin: ${spacing.sm}px 0 ${spacing.md}px;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
  gap: ${spacing.sm}px;
  border-top: 1px solid ${colors.outlineVariant};
  padding-top: ${spacing.md}px;
  margin: auto 0 ${spacing.md}px;
  dt {
    font-size: ${typography.sizes.xs}px;
    color: ${colors.onSurfaceVariant};
  }
  dd {
    margin: ${spacing.xs}px 0 0;
    font-family: ${typography.labelFamily};
    font-size: ${typography.sizes.xs}px;
    overflow-wrap: anywhere;
  }
`;
const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${spacing.sm}px;
  border-top: 1px solid ${colors.outlineVariant};
  padding-top: ${spacing.md}px;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  line-height: 1.5;
`;
const Tone = styled.span<{ $tone: 'neutral' | 'success' | 'warning' | 'danger' }>`
  color: ${({ $tone }) => ($tone === 'neutral' ? colors.onSurfaceVariant : colors[$tone])};
`;
export function TreatyRenewalCard({
  title,
  broker,
  treatyReference,
  status,
  targetLimit,
  indicativeRate,
  expiryDate,
  expiryLabel,
  participation,
  rateChange,
  terms,
  onOpen,
}: TreatyRenewalCardProps) {
  const heading = useId();
  return (
    <Root aria-labelledby={heading}>
      <Header>
        <h3 id={heading}>{title}</h3>
        <Badge variant={status.tone ?? 'neutral'}>{status.label}</Badge>
      </Header>
      <Meta>
        Broker: {broker ?? 'Unavailable'} · Treaty {treatyReference}
      </Meta>
      <Facts>
        <div>
          <dt>Target limit</dt>
          <dd>{targetLimit ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Indicative ROL</dt>
          <dd>
            {indicativeRate ?? 'Unavailable'}
            {indicativeRate != null && rateChange && (
              <>
                <br />
                <Tone $tone={rateChange.tone ?? 'neutral'}>{rateChange.label}</Tone>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Expiry date</dt>
          <dd>
            {expiryLabel != null ? (
              <time dateTime={expiryDate ?? undefined}>{expiryLabel}</time>
            ) : (
              'Unavailable'
            )}
          </dd>
        </div>
      </Facts>
      <Footer>
        <span>Syndicate participation: {participation ?? 'Unavailable'}</span>
        {terms && <Tone $tone={terms.tone ?? 'neutral'}>{terms.label}</Tone>}
        {onOpen && (
          <Button
            type="button"
            variant="text"
            size="sm"
            aria-label={`Open ${title}`}
            onClick={onOpen}
          >
            Open treaty
          </Button>
        )}
      </Footer>
    </Root>
  );
}
export default TreatyRenewalCard;
