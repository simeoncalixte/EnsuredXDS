import React, { useId, useState } from 'react';
import styled, { css } from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/** Trailing status of a contents item. It is always text (plus an `aria-hidden` glyph), never colour alone. */
export type FormContentsStatus =
  { kind: 'complete' } | { kind: 'issues'; count: number } | { kind: 'text'; text: string };

export type FormContentsItem = {
  id: string;
  /** Section name from the shape, e.g. "Insured" or "Coverages". */
  label: string;
  /** Link target, usually `#<section-id>`. */
  href: string;
  status?: FormContentsStatus;
  /** Sub-sections. Only two levels are shown; deeper children are not rendered. */
  children?: FormContentsItem[];
};

export type FormContentsGroupItem = {
  id: string;
  label: string;
  /** Secondary line, e.g. "Deductible: USD 25,000.00 → USD 50,000.00". */
  detail?: string;
  href: string;
};

export type FormContentsGroup = {
  id: string;
  /** Group title, e.g. "Changes in this edit". The item count is appended: "Changes in this edit · 3". */
  title: string;
  items: FormContentsGroupItem[];
  /**
   * Plural noun used in the compact summary, e.g. "changes" gives "· 3 changes".
   * Leave it out to keep this group out of the summary.
   */
  summaryLabel?: { one: string; other: string };
};

export type FormContentsProps = {
  /** Accessible name of the `nav` landmark, e.g. "Form contents". */
  label: string;
  /** Visible heading, e.g. "Contents · form v2". */
  heading: string;
  /** Heading level for `heading`; group titles use the next level. Defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5;
  /** The shape's sections (two levels at most). */
  items: FormContentsItem[];
  /** Id of the section in view. Its link gets `aria-current="location"`. */
  currentId?: string;
  /** Titled link groups such as changes in this edit or values not in this form. Empty groups are hidden. */
  groups?: FormContentsGroup[];
  /**
   * Called with the item id when a link is activated. Links to `#id` targets also
   * move focus to the target (it gets `tabindex="-1"` if it isn't focusable).
   */
  onNavigate?: (id: string) => void;
  /**
   * `'auto'` (default): a single disclosure button below a 1024 px viewport, or below
   * 1024 px of an ancestor with `container: xds-form-layout / inline-size`.
   * `true` / `false` force compact or full mode.
   */
  compact?: boolean | 'auto';
  /** Draws skeleton items with `aria-busy="true"` on the list. */
  loading?: boolean;
  /** Screen-reader text while loading. Defaults to "Loading contents". */
  loadingLabel?: string;
  /** Sticky offset from the top of the scroll container, in px. Defaults to `spacing.md`. Pass `null` to turn sticky off. */
  stickyTop?: number | null;
  id?: string;
  className?: string;
};

type Mode = 'auto' | 'compact' | 'full';

const plural = (n: number, one: string, other: string) => `${n} ${n === 1 ? one : other}`;

const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

// Compact rules, applied directly ('compact') or through the viewport / named-container queries ('auto').
const compactRules = css`
  [data-part='heading'] {
    display: none;
  }
  [data-part='toggle'] {
    display: flex;
  }
  [data-part='panel'][data-expanded='false'] {
    display: none;
  }
  [data-part='panel'] {
    max-height: 60vh;
    margin-top: ${spacing.xs}px;
  }
  a {
    min-height: 44px;
  }
`;

const Nav = styled.nav<{ $mode: Mode; $stickyTop: number | null }>`
  font-family: ${typography.fontFamily};
  color: ${colors.text.primary};
  min-width: 0;
  ${({ $stickyTop }) =>
    $stickyTop === null
      ? ''
      : css`
          position: sticky;
          top: ${$stickyTop}px;
        `}

  [data-part='toggle'] {
    display: none;
  }
  [data-part='panel'] {
    max-height: ${({ $stickyTop }) =>
      $stickyTop === null ? 'none' : `calc(100vh - ${$stickyTop + spacing.md}px)`};
    overflow-y: auto;
  }

  ${({ $mode }) =>
    $mode === 'compact'
      ? compactRules
      : $mode === 'auto'
        ? css`
            @media (max-width: 1023.98px) {
              ${compactRules}
            }
            @container xds-form-layout (max-width: 1023.98px) {
              ${compactRules}
            }
          `
        : ''}
`;

const Heading = styled.h2`
  margin: 0 0 ${spacing.sm}px;
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text.primary};
`;

const GroupTitle = styled.h3`
  margin: ${spacing.md}px 0 ${spacing.xs}px;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Toggle = styled.button`
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.sm}px;
  width: 100%;
  min-height: 44px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  background: ${colors.surface};
  color: ${colors.text.primary};
  font: inherit;
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.medium};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${colors.outline};
  }
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  flex: none;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  @media (prefers-reduced-motion: no-preference) {
    transition: transform 120ms ease-out;
  }
`;

const List = styled.ol<{ $nested?: boolean }>`
  list-style: none;
  margin: 0;
  padding: 0 0 0 ${({ $nested }) => ($nested ? spacing.md : 0)}px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Link = styled.a<{ $current: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.sm}px;
  min-height: 32px;
  padding: ${spacing.xs}px ${spacing.sm}px ${spacing.xs}px ${spacing.sm + 2}px;
  border-radius: ${radii.sm}px;
  font-size: ${typography.sizes.sm}px;
  color: ${colors.text.primary};
  text-decoration: none;
  box-shadow: ${({ $current }) => ($current ? `inset 2px 0 0 ${colors.primary}` : 'none')};
  background: ${({ $current }) => ($current ? colors.surfaceHigh : 'transparent')};
  font-weight: ${({ $current }) =>
    $current ? typography.weights.semibold : typography.weights.regular};

  &:hover {
    background: ${colors.surfaceContainerLow};
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }

  @media (forced-colors: active) {
    &[aria-current='location'] {
      border-left: 2px solid LinkText;
    }
  }
`;

const LinkText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Detail = styled.span`
  font-size: ${typography.sizes.xs}px;
  color: ${colors.text.secondary};
  font-weight: ${typography.weights.regular};
`;

const Status = styled.span<{ $kind: FormContentsStatus['kind'] }>`
  flex: none;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.medium};
  color: ${({ $kind }) => ($kind === 'issues' ? colors.error : colors.text.secondary)};
  white-space: nowrap;
`;

const Skeleton = styled.span<{ $width: number }>`
  display: block;
  height: ${typography.sizes.sm}px;
  width: ${({ $width }) => $width}%;
  margin: ${spacing.sm}px ${spacing.sm}px;
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainerHigh};
`;

const Hidden = styled.span`
  ${visuallyHidden}
`;

function StatusText({ status }: { status: FormContentsStatus }) {
  if (status.kind === 'complete')
    return (
      <Status $kind="complete">
        <span aria-hidden="true">✓ </span>Complete
      </Status>
    );
  if (status.kind === 'issues')
    return (
      <Status $kind="issues">
        <span aria-hidden="true">● </span>
        {plural(status.count, 'issue', 'issues')}
      </Status>
    );
  return <Status $kind="text">{status.text}</Status>;
}

function focusTarget(href: string) {
  if (typeof document === 'undefined' || !href.startsWith('#') || href.length < 2) return;
  const target = document.getElementById(decodeURIComponent(href.slice(1)));
  if (!target) return;
  if (!target.matches('a[href], button, input, select, textarea, [tabindex]'))
    target.setAttribute('tabindex', '-1');
  // Let the browser's own hash scroll run first, then move focus without scrolling again.
  requestAnimationFrame(() => target.focus({ preventScroll: true }));
}

const sumIssues = (items: FormContentsItem[], depth = 0): number =>
  items.reduce(
    (n, item) =>
      n +
      (item.status?.kind === 'issues' ? item.status.count : 0) +
      (depth === 0 && item.children ? sumIssues(item.children, 1) : 0),
    0,
  );

/**
 * Sticky contents rail for a long, shape-generated form: a `nav` landmark with the
 * shape's sections (two levels, each with a text status) and titled link groups
 * such as changes in this edit. Every entry is a link that jumps to and focuses its
 * target. Below 1024 px it collapses to one disclosure button.
 */
export default function FormContents({
  label,
  heading,
  headingLevel = 2,
  items,
  currentId,
  groups = [],
  onNavigate,
  compact = 'auto',
  loading = false,
  loadingLabel = 'Loading contents',
  stickyTop = spacing.md,
  id,
  className,
}: FormContentsProps) {
  const autoId = useId();
  const baseId = id ?? `xds-form-contents-${autoId.replace(/:/g, '')}`;
  const panelId = `${baseId}-panel`;
  const [expanded, setExpanded] = useState(false);
  const mode: Mode = compact === 'auto' ? 'auto' : compact ? 'compact' : 'full';
  const visibleGroups = groups.filter((g) => g.items.length > 0);
  const headingTag = `h${headingLevel}` as 'h2';
  const groupTag = `h${Math.min(headingLevel + 1, 6)}` as 'h3';

  const issues = sumIssues(items);
  const summary = [
    'Contents',
    plural(items.length, 'section', 'sections'),
    ...(issues > 0 ? [plural(issues, 'issue', 'issues')] : []),
    ...visibleGroups
      .filter((g) => g.summaryLabel)
      .map((g) => plural(g.items.length, g.summaryLabel!.one, g.summaryLabel!.other)),
  ].join(' · ');

  const activate = (itemId: string, href: string) => {
    onNavigate?.(itemId);
    focusTarget(href);
    if (mode !== 'full') setExpanded(false);
  };

  const renderItem = (item: FormContentsItem, depth: number): React.ReactNode => {
    const current = item.id === currentId;
    const children = depth === 0 ? (item.children ?? []) : [];
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          $current={current}
          aria-current={current ? 'location' : undefined}
          onClick={() => activate(item.id, item.href)}
        >
          <LinkText>{item.label}</LinkText>
          {item.status ? <StatusText status={item.status} /> : null}
        </Link>
        {children.length > 0 ? (
          <List $nested>{children.map((child) => renderItem(child, 1))}</List>
        ) : null}
      </li>
    );
  };

  return (
    <Nav
      aria-label={label}
      id={baseId}
      className={className}
      $mode={mode}
      $stickyTop={stickyTop}
      data-compact={mode}
    >
      <Heading as={headingTag} data-part="heading">
        {heading}
      </Heading>
      <Toggle
        type="button"
        data-part="toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
      >
        <span>{loading ? 'Contents' : summary}</span>
        <Chevron aria-hidden="true" $open={expanded}>
          ▾
        </Chevron>
      </Toggle>
      <div id={panelId} data-part="panel" data-expanded={expanded ? 'true' : 'false'}>
        {loading ? (
          <List aria-busy="true">
            <li>
              <Hidden>{loadingLabel}</Hidden>
            </li>
            {[72, 56, 64, 48, 60].map((w, i) => (
              <li key={i} aria-hidden="true">
                <Skeleton $width={w} />
              </li>
            ))}
          </List>
        ) : (
          <>
            <List>{items.map((item) => renderItem(item, 0))}</List>
            {visibleGroups.map((group) => {
              const titleId = `${baseId}-group-${group.id}`;
              return (
                <section key={group.id} aria-labelledby={titleId}>
                  <GroupTitle as={groupTag} id={titleId}>
                    {group.title} · {group.items.length}
                  </GroupTitle>
                  <List>
                    {group.items.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          href={entry.href}
                          $current={false}
                          onClick={() => activate(entry.id, entry.href)}
                        >
                          <LinkText>
                            {entry.label}
                            {entry.detail ? <Detail>{entry.detail}</Detail> : null}
                          </LinkText>
                        </Link>
                      </li>
                    ))}
                  </List>
                </section>
              );
            })}
          </>
        )}
      </div>
    </Nav>
  );
}
