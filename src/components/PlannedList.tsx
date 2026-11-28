import React, { useId } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, typography } from '../tokens.js';

export interface PlannedListItem {
  /** Stable key. Defaults to the title. */
  id?: string;
  /** The panel name, e.g. "Bound premium by line of business". */
  title: string;
  /** What the panel will show once it exists ("Will show"). */
  summary: string;
  /** The condition that makes it appear, e.g. "Binding is enabled for your organization". */
  when: string;
}

export interface PlannedListProps {
  /** List heading. The item count is appended as "(N)". */
  heading: string;
  /** Heading level inside the page outline. Defaults to 2. */
  headingLevel?: 2 | 3 | 4;
  /** Optional sentence under the heading. */
  intro?: string;
  items: PlannedListItem[];
  /** Shown instead of the list when there are no items. Without it, nothing renders. */
  emptyMessage?: string;
  /** Visible label for the "will show" value. */
  summaryLabel?: string;
  /** Visible label for the "appears once" value (always visible when rows stack). */
  whenLabel?: string;
  className?: string;
}

/** Rows stack (and the per-row labels become visible) at and below this width. */
const STACK_QUERY = '@media (max-width: 768px)';

const Root = styled.div`
  min-width: 0;
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};
`;
const Heading = styled.h2`
  margin: 0;
  font-size: ${typography.sizes.md}px;
  font-weight: ${typography.weights.semibold};
  overflow-wrap: anywhere;
`;
const Intro = styled.p`
  margin: ${spacing.xs}px 0 0;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.5;
`;
const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1.5fr);
  gap: ${spacing.md}px;
  margin-top: ${spacing.md}px;
  padding: 0 0 ${spacing.sm}px;
  border-bottom: 1px solid ${colors.outlineVariant};
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.semibold};
  ${STACK_QUERY} {
    display: none;
  }
`;
const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const Row = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1.5fr);
  gap: ${spacing.md}px;
  padding: ${spacing.sm}px 0;
  border-bottom: 1px solid ${colors.outlineVariant};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  ${STACK_QUERY} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${spacing.xs}px;
    padding: ${spacing.md}px 0;
  }
`;
const Title = styled.span`
  font-weight: ${typography.weights.semibold};
`;
const Value = styled.span`
  color: ${colors.onSurfaceVariant};
`;
const Label = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  ${STACK_QUERY} {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    font-weight: ${typography.weights.semibold};
    color: ${colors.onSurface};
  }
`;
const Empty = styled.p`
  margin: ${spacing.md}px 0 0;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.sm}px;
`;

/**
 * Calm list of dashboard panels that are on the roadmap but have no data source yet.
 * It is not an error or a loading state: no role, no live region, no Retry, no request.
 */
export function PlannedList({
  heading,
  headingLevel = 2,
  intro,
  items,
  emptyMessage,
  summaryLabel = 'Will show',
  whenLabel = 'Appears once',
  className,
}: PlannedListProps) {
  const headingId = useId();
  if (items.length === 0 && !emptyMessage) return null;
  const tag = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <Root className={className}>
      <Heading as={tag} id={headingId}>
        {heading} ({items.length})
      </Heading>
      {intro && <Intro>{intro}</Intro>}
      {items.length === 0 ? (
        <Empty>{emptyMessage}</Empty>
      ) : (
        <>
          <Columns aria-hidden="true">
            <span>Panel</span>
            <span>{summaryLabel}</span>
            <span>{whenLabel}</span>
          </Columns>
          <List aria-labelledby={headingId}>
            {items.map((item) => (
              <Row key={item.id ?? item.title}>
                <Title>{item.title}</Title>
                <Value>
                  <Label>{summaryLabel}: </Label>
                  {item.summary}
                </Value>
                <Value>
                  <Label>{whenLabel}: </Label>
                  {item.when}
                </Value>
              </Row>
            ))}
          </List>
        </>
      )}
    </Root>
  );
}
export default PlannedList;
