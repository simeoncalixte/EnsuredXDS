import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

/**
 * Banner tone. It sets the icon, the accent stripe and the hidden tone prefix that screen
 * readers announce, so the tone is never shown by colour alone.
 * - `info`: context the reader should know, e.g. "Figures on this page are illustrative".
 * - `warning`: something that may affect what the reader does next, e.g. a quote close to expiry.
 * - `neutral`: a plain notice with no urgency.
 */
export type BannerTone = 'info' | 'warning' | 'neutral';

export type BannerProps = {
  /** Sets the icon, accent stripe and hidden tone prefix. Defaults to `info`. */
  tone?: BannerTone;
  /** Short, bold first line. Also names the banner for assistive technology. */
  title?: string;
  /** Body text. */
  children?: React.ReactNode;
  /** Optional action, e.g. a link or a tertiary Button. Wraps below the text on narrow screens. */
  action?: React.ReactNode;
  /** Shows a dismiss button. */
  dismissible?: boolean;
  /** Called when the dismiss button is pressed. Move focus to a sensible place here. */
  onDismiss?: () => void;
  /** Accessible name of the dismiss button. Defaults to "Dismiss notice", plus the title when there is one. */
  dismissLabel?: string;
  /** Controlled visibility. Leave it unset to let the banner hide itself after dismissal. */
  open?: boolean;
  /** Overrides the hidden tone prefix ("Information", "Warning" or "Notice"). */
  toneLabel?: string;
  className?: string;
};

const TONE_LABELS: Record<BannerTone, string> = {
  info: 'Information',
  warning: 'Warning',
  neutral: 'Notice',
};

const TONE_COLORS: Record<BannerTone, { accent: string; icon: string }> = {
  info: { accent: colors.info, icon: colors.info },
  warning: { accent: colors.warning, icon: colors.warning },
  neutral: { accent: colors.outlineVariant, icon: colors.onSurfaceVariant },
};

const Root = styled.div<{ $tone: BannerTone }>`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${spacing.sm}px ${spacing.md}px;
  min-width: 0;
  padding: ${spacing.sm + spacing.xs}px ${spacing.md}px;
  border: 1px solid ${colors.outlineVariant};
  border-left: 4px solid ${({ $tone }) => TONE_COLORS[$tone].accent};
  border-radius: ${radii.md}px;
  background: ${colors.surfaceContainerLow};
  color: ${colors.onSurface};
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.45;
`;

const Lead = styled.div`
  display: flex;
  flex: 1 1 240px;
  align-items: flex-start;
  gap: ${spacing.sm}px;
  min-width: 0;
`;

const IconWrap = styled.span<{ $tone: BannerTone }>`
  display: inline-flex;
  flex: none;
  margin-top: 1px;
  color: ${({ $tone }) => TONE_COLORS[$tone].icon};

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs}px;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Title = styled.p`
  margin: 0;
  font-weight: ${typography.weights.semibold};
`;

const Body = styled.div`
  color: ${colors.onSurfaceVariant};

  & > p {
    margin: 0;
  }
`;

const Trailing = styled.div`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: ${spacing.sm}px;
  margin-left: auto;
`;

const DismissButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  border: 0;
  border-radius: ${radii.sm}px;
  background: transparent;
  color: ${colors.onSurfaceVariant};
  font: inherit;
  cursor: pointer;

  &:hover {
    background: ${colors.surfaceContainerHigh};
    color: ${colors.onSurface};
  }

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }

  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
  }
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

const ToneIcon: React.FC<{ tone: BannerTone }> = ({ tone }) => {
  if (tone === 'warning')
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M10 2.5 18 17H2L10 2.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14.5" r="1" fill="currentColor" />
      </svg>
    );
  if (tone === 'neutral')
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.5 10h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="6.25" r="1" fill="currentColor" />
    </svg>
  );
};

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Page-level notice, e.g. "Figures on this page are illustrative" or "This quote expires in
 * 3 days". It uses `role="status"` (polite), never `alert`: use Modal (alertdialog) or a
 * ValidationMessage for anything that must interrupt. Presentational only; the caller owns
 * the copy and, when it is dismissible, where focus goes afterwards.
 */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  dismissible = false,
  onDismiss,
  dismissLabel,
  open,
  toneLabel,
  className,
}: BannerProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const [dismissed, setDismissed] = useState(false);
  const visible = open ?? !dismissed;
  if (!visible) return null;

  const prefix = toneLabel ?? TONE_LABELS[tone];
  const handleDismiss = () => {
    if (open === undefined) setDismissed(true);
    onDismiss?.();
  };

  return (
    <Root
      role="status"
      className={className}
      $tone={tone}
      data-tone={tone}
      aria-labelledby={title ? titleId : undefined}
    >
      <Lead>
        <IconWrap $tone={tone}>
          <ToneIcon tone={tone} />
        </IconWrap>
        <Text>
          {title ? (
            <Title id={titleId}>
              <VisuallyHidden>{prefix}: </VisuallyHidden>
              {title}
            </Title>
          ) : (
            <VisuallyHidden>{prefix}: </VisuallyHidden>
          )}
          {children !== undefined && children !== null && children !== false && (
            <Body>{children}</Body>
          )}
        </Text>
      </Lead>
      {(action || dismissible) && (
        <Trailing>
          {action}
          {dismissible && (
            <DismissButton
              type="button"
              aria-label={dismissLabel ?? (title ? `Dismiss notice: ${title}` : 'Dismiss notice')}
              onClick={handleDismiss}
            >
              <CloseIcon />
            </DismissButton>
          )}
        </Trailing>
      )}
    </Root>
  );
}

export default Banner;
