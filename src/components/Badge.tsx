import React from 'react';
import styled, { css } from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { radii, typography } from '../tokens.js';

/**
 * Existing variants (backward-compatible) plus additive semantic tones.
 * - primary / secondary / tertiary / surface: original variants. `primary` text uses
 *   `primarySoft` so it keeps >= 4.5:1 contrast on its tint in the dark theme (AIN-281).
 * - success / warning / danger / info / neutral: semantic tones mapped to colors.ts.
 * - archived: surface styling plus a leading archive icon, so the archived state never
 *   relies on colour alone.
 */
export type XdsBadgeVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'surface'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'archived';

export type XdsBadgeProps = {
  variant?: XdsBadgeVariant;
  /** Optional leading dot rendered before the children. Ignored for `archived`, which shows an icon. */
  dot?: boolean;
  /** Visible badge text. The `archived` variant defaults to "Archived". */
  children?: React.ReactNode;
  className?: string;
};

// Backwards-compatible alias.
export type BadgeProps = XdsBadgeProps;

type VariantTheme = {
  background: string;
  color: string;
  border: string;
};

const variantThemes: Record<XdsBadgeVariant, VariantTheme> = {
  // --- Original variants: preserve exact computed styles ---
  primary: {
    background: withAlpha(colors.primary, 0.12),
    // primarySoft equals primary in the light theme and is lighter in the dark theme,
    // where primary on its own 12% tint is below 4.5:1.
    color: colors.primarySoft,
    border: `1px solid ${withAlpha(colors.primary, 0.2)}`,
  },
  secondary: {
    background: withAlpha(colors.dataViz.green, 0.08),
    color: colors.secondary,
    border: `1px solid ${withAlpha(colors.dataViz.green, 0.12)}`,
  },
  tertiary: {
    background: colors.tertiaryContainer,
    color: colors.onSurfaceVariant,
    border: `1px solid ${withAlpha(colors.neutral[400], 0.08)}`,
  },
  surface: {
    background: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    border: `1px solid ${colors.outlineVariant}`,
  },

  // --- New semantic tones mapped to colors.ts ---
  success: {
    background: withAlpha(colors.success, 0.12),
    color: colors.success,
    border: `1px solid ${withAlpha(colors.success, 0.2)}`,
  },
  warning: {
    background: withAlpha(colors.warning, 0.12),
    color: colors.warning,
    border: `1px solid ${withAlpha(colors.warning, 0.2)}`,
  },
  danger: {
    background: withAlpha(colors.danger, 0.12),
    color: colors.danger,
    border: `1px solid ${withAlpha(colors.danger, 0.2)}`,
  },
  info: {
    background: withAlpha(colors.info, 0.12),
    color: colors.info,
    border: `1px solid ${withAlpha(colors.info, 0.2)}`,
  },
  neutral: {
    background: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    border: `1px solid ${colors.outlineVariant}`,
  },
  archived: {
    background: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    border: `1px solid ${colors.outlineVariant}`,
  },
};

/** System submission statuses (AIN-238). Org boards may add their own statuses. */
export const SUBMISSION_SYSTEM_STATUSES = [
  'draft',
  'submitted',
  'modeling',
  'priced',
  'approved',
  'rejected',
  'quoted',
  'bound',
] as const;

export type SubmissionSystemStatus = (typeof SUBMISSION_SYSTEM_STATUSES)[number];

/** Badge tones that `statusTone()` can return. */
export type SubmissionStatusTone = Extract<
  XdsBadgeVariant,
  'neutral' | 'info' | 'primary' | 'success' | 'danger' | 'surface'
>;

const submissionStatusTones: Record<SubmissionSystemStatus, SubmissionStatusTone> = {
  draft: 'neutral',
  submitted: 'info',
  modeling: 'info',
  priced: 'info',
  approved: 'primary',
  quoted: 'primary',
  bound: 'success',
  rejected: 'danger',
};

const normaliseStatus = (status: unknown): string =>
  typeof status === 'string' ? status.trim().toLowerCase() : '';

/** True when `status` (case-insensitive, trimmed) is one of the system submission statuses. */
export function isSubmissionSystemStatus(status: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(submissionStatusTones, normaliseStatus(status));
}

/**
 * Maps a submission status to a badge tone, shared by the Kanban and Table views:
 * draft → neutral; submitted, modeling, priced → info; approved, quoted → primary;
 * bound → success; rejected (declined) → danger. Org board statuses, unknown values
 * and empty values → surface. The tone is decoration only: always render the status
 * label as the badge text.
 */
export function statusTone(status: string | null | undefined): SubmissionStatusTone {
  const key = normaliseStatus(status);
  return isSubmissionSystemStatus(key)
    ? submissionStatusTones[key as SubmissionSystemStatus]
    : 'surface';
}

const StyledBadge = styled.span<{ $variant: XdsBadgeVariant }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${radii.md}px;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.bold};
  text-transform: uppercase;
  letter-spacing: 1px;

  ${({ $variant }: { $variant: XdsBadgeVariant }) => {
    const theme = variantThemes[$variant];
    return css`
      background: ${theme.background};
      color: ${theme.color};
      border: ${theme.border};
    `;
  }}
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: ${radii.round}px;
  background: currentColor;
  flex: 0 0 auto;
`;

const ArchiveSvg = styled.svg`
  flex: 0 0 auto;
`;

const ArchiveIcon = () => (
  <ArchiveSvg
    aria-hidden="true"
    focusable="false"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    <path d="M10 13h4" />
  </ArchiveSvg>
);

export const Badge: React.FC<XdsBadgeProps> = ({
  variant = 'surface',
  dot = false,
  children,
  className,
}) => {
  const archived = variant === 'archived';
  return (
    <StyledBadge $variant={variant} className={className} data-xds-variant={variant}>
      {archived ? <ArchiveIcon /> : dot ? <Dot aria-hidden="true" /> : null}
      {archived && (children === undefined || children === null || children === '')
        ? 'Archived'
        : children}
    </StyledBadge>
  );
};

export default Badge;
