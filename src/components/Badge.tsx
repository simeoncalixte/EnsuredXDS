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

/**
 * How strongly the badge is drawn (AIN-362). Omit it to keep the default look of each
 * variant exactly as it was before this prop existed.
 * - outline: no fill, tone-coloured text and border (a working / in-progress state).
 * - tint: the tone at 12% fill with a matching border (today's look for semantic tones).
 * - solid: a full tone fill with inverse text (a final state, e.g. bound).
 */
export type XdsBadgeEmphasis = 'outline' | 'tint' | 'solid';

/**
 * Decorative leading icon. The badge text always carries the meaning, so icons are
 * rendered with aria-hidden. `dot` is a filled circle (larger than the `dot` prop mark).
 */
export type XdsBadgeIcon = 'check' | 'cross' | 'arrowUpRight' | 'dot';

export type XdsBadgeProps = {
  variant?: XdsBadgeVariant;
  /** Fill strength. Omit for the variant's default look (unchanged from 0.4.x). */
  emphasis?: XdsBadgeEmphasis;
  /** Optional decorative leading icon. Takes precedence over `dot`; ignored for `archived`. */
  icon?: XdsBadgeIcon;
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

/** Text colour of each variant, used by the outline and solid emphasis levels. */
const variantInk: Record<XdsBadgeVariant, string> = {
  primary: colors.primarySoft,
  secondary: colors.secondary,
  tertiary: colors.onSurfaceVariant,
  surface: colors.onSurfaceVariant,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  neutral: colors.onSurfaceVariant,
  archived: colors.onSurfaceVariant,
};

/** Fill and text for `emphasis="solid"`. Neutral families use the inverse surface pair. */
const solidThemes: Record<XdsBadgeVariant, { background: string; color: string }> = {
  primary: { background: colors.primary, color: colors.onPrimary },
  secondary: { background: colors.secondary, color: colors.text.inverse },
  tertiary: { background: colors.onSurface, color: colors.surface },
  surface: { background: colors.onSurface, color: colors.surface },
  success: { background: colors.success, color: colors.text.inverse },
  warning: { background: colors.warning, color: colors.text.inverse },
  danger: { background: colors.danger, color: colors.text.inverse },
  info: { background: colors.info, color: colors.text.inverse },
  neutral: { background: colors.onSurface, color: colors.surface },
  archived: { background: colors.onSurface, color: colors.surface },
};

const themeFor = (variant: XdsBadgeVariant, emphasis?: XdsBadgeEmphasis): VariantTheme => {
  if (emphasis === 'outline') {
    const ink = variantInk[variant];
    return { background: 'transparent', color: ink, border: `1px solid ${ink}` };
  }
  if (emphasis === 'solid') {
    const solid = solidThemes[variant];
    return { ...solid, border: `1px solid ${solid.background}` };
  }
  // `tint` and the default share today's styles (neutral families keep their container look).
  return variantThemes[variant];
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

/**
 * Badge tones that `statusPresentation()` can return. A superset of `SubmissionStatusTone`
 * (which is unchanged): approved uses `success` and quoted uses `warning` (AIN-362, PM 11154).
 */
export type SubmissionStatusPresentationTone = SubmissionStatusTone | 'warning';

/** Presentation of a submission status: pass all three to Badge (AIN-362). */
export type SubmissionStatusPresentation = {
  tone: SubmissionStatusPresentationTone;
  emphasis: XdsBadgeEmphasis;
  icon?: XdsBadgeIcon;
};

// Tone differs from statusTone() only for approved (success) and quoted (warning), so
// approved and quoted never share declined's red family in the light theme. Bound would be
// "solid inverse" in the design, but XDS has no inverse tone, so it stays success + solid.
const submissionStatusPresentations: Record<SubmissionSystemStatus, SubmissionStatusPresentation> =
  {
    draft: { tone: 'neutral', emphasis: 'outline' },
    submitted: { tone: 'info', emphasis: 'outline' },
    modeling: { tone: 'info', emphasis: 'outline' },
    priced: { tone: 'info', emphasis: 'outline' },
    quoted: { tone: 'warning', emphasis: 'tint', icon: 'arrowUpRight' },
    approved: { tone: 'success', emphasis: 'tint', icon: 'check' },
    rejected: { tone: 'danger', emphasis: 'tint', icon: 'cross' },
    bound: { tone: 'success', emphasis: 'solid', icon: 'dot' },
  };

/**
 * Full badge presentation for a submission status: tone plus emphasis plus icon, so
 * status families never rely on hue alone. Working states (submitted, modeling, priced)
 * and draft are outline with no icon; quoted (↗), approved (✓) and declined (✕) are
 * tinted; bound is solid with a filled dot because the contract is final. Org board
 * statuses, unknown and empty values → surface, outline, no icon.
 *
 * `tone` equals `statusTone(status)` except approved → success (✓) and quoted →
 * warning (↗), so approved and quoted never share declined's hue. `statusTone()` itself
 * is unchanged since 0.3.0. Always render the status label as the badge text.
 */
export function statusPresentation(
  status: string | null | undefined,
): SubmissionStatusPresentation {
  const key = normaliseStatus(status);
  if (!isSubmissionSystemStatus(key)) return { tone: 'surface', emphasis: 'outline' };
  return { ...submissionStatusPresentations[key as SubmissionSystemStatus] };
}

const StyledBadge = styled.span<{ $variant: XdsBadgeVariant; $emphasis?: XdsBadgeEmphasis }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${radii.md}px;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.bold};
  text-transform: uppercase;
  letter-spacing: 1px;

  ${({ $variant, $emphasis }: { $variant: XdsBadgeVariant; $emphasis?: XdsBadgeEmphasis }) => {
    const theme = themeFor($variant, $emphasis);
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

const IconDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: ${radii.round}px;
  background: currentColor;
  flex: 0 0 auto;
`;

const iconPaths: Record<Exclude<XdsBadgeIcon, 'dot'>, React.ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  arrowUpRight: <path d="M7 17L17 7M9 7h8v8" />,
};

const BadgeIcon: React.FC<{ icon: XdsBadgeIcon }> = ({ icon }) =>
  icon === 'dot' ? (
    <IconDot aria-hidden="true" data-xds-icon="dot" />
  ) : (
    <ArchiveSvg
      aria-hidden="true"
      focusable="false"
      data-xds-icon={icon}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[icon]}
    </ArchiveSvg>
  );

export const Badge: React.FC<XdsBadgeProps> = ({
  variant = 'surface',
  emphasis,
  icon,
  dot = false,
  children,
  className,
}) => {
  const archived = variant === 'archived';
  return (
    <StyledBadge
      $variant={variant}
      $emphasis={emphasis}
      className={className}
      data-xds-variant={variant}
      data-xds-emphasis={emphasis}
    >
      {archived ? (
        <ArchiveIcon />
      ) : icon ? (
        <BadgeIcon icon={icon} />
      ) : dot ? (
        <Dot aria-hidden="true" />
      ) : null}
      {archived && (children === undefined || children === null || children === '')
        ? 'Archived'
        : children}
    </StyledBadge>
  );
};

export default Badge;
