import React, { useId } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/** The two lists a callout panel compares: what something is, and what it isn't. */
export type CalloutPanelItems = {
  /** Statements for the "is" column, e.g. "A place to structure and check submissions". */
  is: string[];
  /** Statements for the "isn't" column, e.g. "An insurer, broker or carrier". */
  isnt: string[];
};

export type CalloutPanelProps = {
  /** Panel heading, e.g. "What the platform is and isn't". Also names the region. */
  title: string;
  /** The two lists. Each column renders as a real `ul`. */
  items: CalloutPanelItems;
  /** Heading of the "is" column. Defaults to "What it is". */
  isLabel?: string;
  /** Heading of the "isn't" column. Defaults to "What it isn't". */
  isntLabel?: string;
  /** Heading level of the panel title, so it fits the page outline. Columns use the next level. Defaults to 2. */
  headingLevel?: 2 | 3 | 4;
  /** Shown in a column that has no statements. Defaults to "Nothing listed yet". */
  emptyLabel?: string;
  className?: string;
};

type Column = 'is' | 'isnt';

const Root = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md}px;
  min-width: 0;
  padding: ${spacing.lg}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.lg}px;
  background: ${colors.surfaceContainerLow};
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};

  @media (max-width: 599px) {
    padding: ${spacing.md}px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${typography.sizes.lg}px;
  font-weight: ${typography.weights.semibold};
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${spacing.md}px ${spacing.lg}px;

  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ColumnRoot = styled.div<{ $column: Column }>`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
  min-width: 0;
  padding-top: ${spacing.sm}px;
  border-top: 2px solid
    ${({ $column }) => ($column === 'is' ? colors.success : colors.outlineVariant)};
`;

const ColumnTitle = styled.h3`
  margin: 0;
  font-size: ${typography.sizes.md}px;
  font-weight: ${typography.weights.semibold};
  line-height: 1.35;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm}px;
  min-width: 0;
  font-size: ${typography.sizes.sm}px;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const IconWrap = styled.span<{ $column: Column }>`
  display: inline-flex;
  flex: none;
  margin-top: 1px;
  color: ${({ $column }) => ($column === 'is' ? colors.success : colors.onSurfaceVariant)};

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;

const Empty = styled.p`
  margin: 0;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.sm}px;
  font-style: italic;
`;

const TickIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M4.5 10.5 8.25 14 15.5 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Two-column "what it is / what it isn't" panel, e.g. the trust section of the signed-out
 * homepage ("An insurer or broker" sits in the isn't column; binding is by the carrier).
 * Each column is a real heading plus a `ul`, so the meaning is carried by text, never by the
 * tick and cross icons (which are aria-hidden) or the accent colour. Columns stack under
 * 600 px. Presentational only; the caller owns the copy.
 */
export function CalloutPanel({
  title,
  items,
  isLabel = 'What it is',
  isntLabel = "What it isn't",
  headingLevel = 2,
  emptyLabel = 'Nothing listed yet',
  className,
}: CalloutPanelProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const titleTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const columnTag = `h${headingLevel + 1}` as 'h3' | 'h4' | 'h5';

  const columns: { key: Column; label: string; entries: string[] }[] = [
    { key: 'is', label: isLabel, entries: items?.is ?? [] },
    { key: 'isnt', label: isntLabel, entries: items?.isnt ?? [] },
  ];

  return (
    <Root className={className} aria-labelledby={titleId}>
      <Title as={titleTag} id={titleId}>
        {title}
      </Title>
      <Columns>
        {columns.map(({ key, label, entries }) => {
          const columnId = `${baseId}-${key}`;
          return (
            <ColumnRoot key={key} $column={key} data-column={key}>
              <ColumnTitle as={columnTag} id={columnId}>
                {label}
              </ColumnTitle>
              {entries.length > 0 ? (
                <List aria-labelledby={columnId}>
                  {entries.map((entry, index) => (
                    <Item key={`${index}-${entry}`}>
                      <IconWrap $column={key}>
                        {key === 'is' ? <TickIcon /> : <CrossIcon />}
                      </IconWrap>
                      <span>{entry}</span>
                    </Item>
                  ))}
                </List>
              ) : (
                <Empty>{emptyLabel}</Empty>
              )}
            </ColumnRoot>
          );
        })}
      </Columns>
    </Root>
  );
}

export default CalloutPanel;
