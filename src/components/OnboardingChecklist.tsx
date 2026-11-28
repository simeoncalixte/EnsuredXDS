import React, { useId } from 'react';
import styled from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';
import ProgressBar from './ProgressBar.js';
import Card from './Card.js';
import Badge from './Badge.js';
import Button from './Button.js';
import Checkbox from './Checkbox.js';

/**
 * A single step in an onboarding checklist.
 * - `complete`: the user has finished this step (shows a success badge + checked box).
 * - `current`: the next actionable step (its action button is the primary CTA).
 * - `todo`: a future step (its action button is a quiet/secondary affordance).
 */
export type OnboardingStepStatus = 'complete' | 'current' | 'todo';

/**
 * Status of a condition in the `readiness` variant (for example the conditions
 * that must all hold before a contract can be bound).
 * - `met`: the condition holds.
 * - `not-met`: the condition does not hold yet; the action is blocked.
 * - `bypassed`: the condition was waived or overridden by someone with authority
 *   (the caller says who and when in `detail`).
 */
export type ReadinessStatus = 'met' | 'not-met' | 'bypassed';

export type OnboardingChecklistVariant = 'onboarding' | 'readiness';

export type OnboardingStep = {
  id: string;
  title: string;
  description?: string;
  /**
   * Onboarding statuses (`complete` / `current` / `todo`) or readiness statuses
   * (`met` / `not-met` / `bypassed`). Each variant maps the other set:
   * readiness shows `complete` as met and `current` / `todo` as not met;
   * onboarding shows `met` / `bypassed` as complete and `not-met` as to do.
   */
  status: OnboardingStepStatus | ReadinessStatus;
  actionLabel?: string;
  onAction?: () => void;
  /** Readiness: one-line detail under the title (who / when, with time zone). */
  detail?: string;
  /** Readiness: right-aligned link to the step that fixes the condition. Needs `linkLabel`. */
  href?: string;
  /** Readiness: visible text of the `href` link. */
  linkLabel?: string;
};

export type ReadinessStatusLabels = Record<ReadinessStatus, string>;

export type OnboardingChecklistProps = {
  title?: string;
  subtitle?: string;
  steps: OnboardingStep[];
  /** Optional dismiss affordance; the header X only renders when provided. Ignored by `readiness`. */
  onDismiss?: () => void;
  className?: string;
  /**
   * `onboarding` (default, unchanged): progress bar, dismiss, current-step highlight.
   * `readiness`: a plain list of conditions with met / not met / bypassed status,
   * a detail line and a link or action per row. No progress bar, no dismiss, no
   * current-step highlight.
   */
  variant?: OnboardingChecklistVariant;
  /** Accessible name of the list, e.g. "Ready to bind checklist". */
  ariaLabel?: string;
  /** Readiness: a summary line above the list, e.g. "2 of 5 conditions not met". */
  summary?: string;
  /**
   * Readiness: id given to the summary line, so a disabled button elsewhere can
   * point `aria-describedby` at it. Only rendered when `summary` is set.
   */
  summaryId?: string;
  /** Readiness: show aria-hidden skeleton rows. The parent owns the role="status" text. */
  loading?: boolean;
  /** Readiness: number of skeleton rows while loading (default 3). */
  loadingRows?: number;
  /** Readiness: shown instead of the list when `steps` is empty. */
  emptyMessage?: string;
  /** Readiness: status words, visible for not met / bypassed and read by screen readers for all three. */
  statusLabels?: Partial<ReadinessStatusLabels>;
};

const Root = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md}px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${spacing.md}px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
`;

const Title = styled.h3`
  margin: 0;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.lg}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.onSurfaceStrong};
`;

const Subtitle = styled.p`
  margin: 0;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.onSurfaceVariant};
`;

const DismissButton = styled.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${radii.md}px;
  background: transparent;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.md}px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: ${colors.surfaceContainerHigh};
    color: ${colors.onSurface};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${withAlpha(colors.primary, 0.4)};
  }
`;

const StepList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
`;

const StepRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${spacing.md}px;
`;

const StepCard = styled(Card)<{ $current: boolean }>`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: ${spacing.md}px;
  padding: ${spacing.md}px;
  ${({ $current }) => ($current ? `box-shadow: 0 0 0 1px ${withAlpha(colors.primary, 0.45)};` : '')}
`;

const StepBody = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
  min-width: 0;
`;

const StepTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm}px;
`;

const StepTitle = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.onSurface};
`;

const StepDescription = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
`;

const ActionSlot = styled.div`
  flex: 0 0 auto;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const ReadinessSummary = styled.p`
  margin: 0;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.medium};
  color: ${colors.onSurface};
`;

const ReadinessList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ReadinessRow = styled.li`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: start;
  column-gap: ${spacing.sm}px;
  /* 12px vertical padding from the 4px and 8px spacing tokens. */
  padding: ${spacing.sm + spacing.xs}px 0;
  border-top: 1px solid ${colors.outlineVariant};

  &:first-child {
    border-top: none;
  }

  @media (max-width: 479px) {
    grid-template-columns: 28px minmax(0, 1fr);

    & > :last-child:not(:nth-child(2)) {
      grid-column: 2;
      justify-self: start;
      margin-top: ${spacing.xs}px;
    }
  }
`;

const iconBase = `
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: 50%;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.bold};
  line-height: 1;
`;

const StatusIcon = styled.span<{ $status: ReadinessStatus }>`
  ${iconBase}
  ${({ $status }) =>
    $status === 'met'
      ? `background: ${colors.secondary}; color: ${colors.surface}; border: 2px solid ${colors.secondary};`
      : $status === 'not-met'
        ? `background: transparent; color: ${colors.danger}; border: 2px solid ${colors.danger};`
        : `background: transparent; color: ${colors.onSurfaceVariant}; border: 2px dashed ${colors.onSurfaceVariant};`}
`;

const ReadinessBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
  min-width: 0;
`;

const ReadinessTitle = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.onSurface};
  overflow-wrap: anywhere;
`;

const StatusWord = styled.span<{ $status: ReadinessStatus }>`
  color: ${({ $status }) => ($status === 'not-met' ? colors.danger : colors.onSurfaceVariant)};
`;

const ReadinessDetail = styled.span`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.xs}px;
  color: ${colors.onSurfaceVariant};
  overflow-wrap: anywhere;
`;

const ReadinessLink = styled.a`
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.medium};
  /* On-surface + underline, as DataTable link cells: primary reads as danger in dark. */
  color: ${colors.onSurface};
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
  border-radius: ${radii.sm}px;

  &:hover {
    text-decoration-thickness: 2px;
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const SkeletonBar = styled.span<{ $width: string }>`
  display: block;
  height: ${spacing.md - spacing.xs}px;
  width: ${({ $width }) => $width};
  border-radius: ${radii.sm}px;
  background: ${colors.surfaceContainerHighest};
`;

const ReadinessEmpty = styled.p`
  margin: 0;
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  color: ${colors.onSurfaceVariant};
`;

const defaultStatusLabels: ReadinessStatusLabels = {
  met: 'Met',
  'not-met': 'Not met',
  bypassed: 'Bypassed',
};

const statusGlyph: Record<ReadinessStatus, string> = {
  met: '✓',
  'not-met': '✕',
  bypassed: '–',
};

/** Maps any step status onto the readiness set. */
export const toReadinessStatus = (status: OnboardingStep['status']): ReadinessStatus =>
  status === 'complete' || status === 'met'
    ? 'met'
    : status === 'bypassed'
      ? 'bypassed'
      : 'not-met';

/** Maps any step status onto the onboarding set. */
export const toOnboardingStatus = (status: OnboardingStep['status']): OnboardingStepStatus =>
  status === 'met' || status === 'bypassed' ? 'complete' : status === 'not-met' ? 'todo' : status;

type ReadinessViewProps = Omit<OnboardingChecklistProps, 'variant' | 'onDismiss'>;

const ReadinessView: React.FC<ReadinessViewProps> = ({
  title = 'Ready to proceed',
  subtitle,
  steps,
  className,
  ariaLabel,
  summary,
  summaryId,
  loading = false,
  loadingRows = 3,
  emptyMessage,
  statusLabels,
}) => {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const labels = { ...defaultStatusLabels, ...statusLabels };
  const listLabelProps = ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-labelledby': titleId };

  return (
    <Root variant="high" className={className}>
      <Header>
        <HeaderText>
          <Title id={titleId}>{title}</Title>
          {subtitle != null && <Subtitle>{subtitle}</Subtitle>}
        </HeaderText>
      </Header>

      {summary != null && !loading && <ReadinessSummary id={summaryId}>{summary}</ReadinessSummary>}

      {loading ? (
        <ReadinessList aria-hidden="true" data-loading="true">
          {Array.from({ length: Math.max(1, loadingRows) }, (_, i) => (
            <ReadinessRow key={i}>
              <SkeletonBar $width="20px" />
              <ReadinessBody>
                <SkeletonBar $width={i % 2 === 0 ? '60%' : '45%'} />
                <SkeletonBar $width="35%" />
              </ReadinessBody>
            </ReadinessRow>
          ))}
        </ReadinessList>
      ) : steps.length === 0 ? (
        emptyMessage != null ? (
          <ReadinessEmpty>{emptyMessage}</ReadinessEmpty>
        ) : null
      ) : (
        <ReadinessList {...listLabelProps}>
          {steps.map((step) => {
            const status = toReadinessStatus(step.status);
            const word = labels[status];
            return (
              <ReadinessRow key={step.id} data-status={status}>
                <StatusIcon $status={status} aria-hidden="true">
                  {statusGlyph[status]}
                </StatusIcon>
                <ReadinessBody>
                  <ReadinessTitle>
                    {status === 'met' ? (
                      <VisuallyHidden>{`${word}: `}</VisuallyHidden>
                    ) : (
                      <StatusWord $status={status}>{`${word} · `}</StatusWord>
                    )}
                    {step.title}
                  </ReadinessTitle>
                  {step.detail != null && <ReadinessDetail>{step.detail}</ReadinessDetail>}
                  {step.description != null && (
                    <ReadinessDetail>{step.description}</ReadinessDetail>
                  )}
                </ReadinessBody>
                {step.href != null && step.linkLabel != null ? (
                  <ReadinessLink href={step.href}>{step.linkLabel}</ReadinessLink>
                ) : step.actionLabel && step.onAction ? (
                  <Button type="button" size="sm" variant="text" onClick={step.onAction}>
                    {step.actionLabel}
                  </Button>
                ) : null}
              </ReadinessRow>
            );
          })}
        </ReadinessList>
      )}
    </Root>
  );
};

const statusBadge: Record<
  OnboardingStepStatus,
  { variant: 'success' | 'info' | 'neutral'; label: string }
> = {
  complete: { variant: 'success', label: 'Done' },
  current: { variant: 'info', label: 'Next up' },
  todo: { variant: 'neutral', label: 'To do' },
};

/**
 * Pure, props-only onboarding checklist surface (the default `onboarding` variant).
 *
 * Reuses xds primitives (Card, ProgressBar, Badge, Button, Checkbox) and design
 * tokens only. It performs NO data fetching, NO routing, and NO persistence —
 * everything is driven by the `steps` array and the `onAction`/`onDismiss`
 * callbacks supplied by the caller.
 */
const OnboardingView: React.FC<OnboardingChecklistProps> = ({
  title = 'Finish setting up your account',
  subtitle,
  steps: rawSteps,
  onDismiss,
  className,
  ariaLabel,
}) => {
  const steps = rawSteps.map((s) => ({ ...s, status: toOnboardingStatus(s.status) }));
  const total = steps.length;
  const completed = steps.filter((s) => s.status === 'complete').length;

  return (
    <Root variant="high" className={className}>
      <Header>
        <HeaderText>
          <Title>{title}</Title>
          {subtitle != null && <Subtitle>{subtitle}</Subtitle>}
        </HeaderText>
        {onDismiss && (
          <DismissButton
            type="button"
            aria-label="Dismiss onboarding checklist"
            onClick={onDismiss}
          >
            ×
          </DismissButton>
        )}
      </Header>

      <ProgressBar
        value={completed}
        max={total > 0 ? total : 1}
        tone="gain"
        label={`${completed} of ${total} complete`}
      />

      <StepList aria-label={ariaLabel}>
        {steps.map((step) => {
          const badge = statusBadge[step.status];
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';
          return (
            <StepRow key={step.id}>
              <Checkbox
                checked={isComplete}
                readOnly
                aria-label={`${step.title} ${isComplete ? 'complete' : 'incomplete'}`}
              />
              <StepCard variant="low" $current={isCurrent}>
                <StepBody>
                  <StepTitleRow>
                    <StepTitle>{step.title}</StepTitle>
                    <Badge variant={badge.variant} dot={isCurrent}>
                      {badge.label}
                    </Badge>
                  </StepTitleRow>
                  {step.description != null && (
                    <StepDescription>{step.description}</StepDescription>
                  )}
                </StepBody>
                {step.actionLabel && step.onAction && !isComplete && (
                  <ActionSlot>
                    <Button
                      type="button"
                      size="sm"
                      variant={isCurrent ? 'primary' : 'outline'}
                      onClick={step.onAction}
                    >
                      {step.actionLabel}
                    </Button>
                  </ActionSlot>
                )}
              </StepCard>
            </StepRow>
          );
        })}
      </StepList>
    </Root>
  );
};

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  variant = 'onboarding',
  onDismiss,
  ...rest
}) =>
  variant === 'readiness' ? (
    <ReadinessView {...rest} />
  ) : (
    <OnboardingView {...rest} onDismiss={onDismiss} />
  );

export default OnboardingChecklist;
