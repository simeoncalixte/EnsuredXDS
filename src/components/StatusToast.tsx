import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { radii, spacing, typography, zIndices } from '../tokens.js';

export type StatusToastTone = 'neutral' | 'error';

/** Why the toast went away: its timer ran out, its action was used, or the close button was pressed. */
export type StatusToastDismissReason = 'timeout' | 'action' | 'close';

export type StatusToastAction = {
  /** Visible button text, e.g. "Undo". */
  label: string;
  /** Called when the action is pressed. The toast then calls `onDismiss('action')`. */
  onAction: () => void;
};

export type StatusToastProps = {
  /**
   * The message, e.g. "SUB-8401 moved from New to Triage.". When empty, nothing is shown but the
   * `role="status"` region stays mounted, so the next message is announced.
   */
  message?: string | null;
  /**
   * Identifies one message. A new id replaces the current toast and restarts its timer, even when
   * the text is the same (e.g. two moves of the same submission). Defaults to the message text.
   */
  messageId?: string | number;
  /** One optional action, e.g. Undo. */
  action?: StatusToastAction;
  /**
   * Milliseconds before a neutral toast dismisses itself. Defaults to 10000. The timer pauses
   * while the toast is hovered or has focus (WCAG 2.2.1). Pass 0 to keep it until dismissed.
   * The error tone ignores this and stays until dismissed.
   */
  duration?: number;
  /** `error` stays until dismissed, shows a close button and a hidden "Error:" prefix. */
  tone?: StatusToastTone;
  /** Called once per message when it goes away. Clear `message` here. */
  onDismiss?: (reason: StatusToastDismissReason) => void;
  /** Accessible name of the close button. Defaults to "Dismiss message". */
  closeLabel?: string;
  /** Hidden prefix read before an error message. Defaults to "Error:". */
  errorPrefix?: string;
  /**
   * `fixed` (default) pins the toast to the bottom centre of the viewport, above modals.
   * `inline` renders it in the normal flow, for previews and tests.
   */
  position?: 'fixed' | 'inline';
  /**
   * Where focus goes when the toast closes while focus is inside it (after Undo or close), e.g.
   * the moved card's menu button. Without it the caller must move focus in `onDismiss`, or focus
   * falls back to the page.
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

const DEFAULT_DURATION = 10000;

const Wrapper = styled.div<{ $position: 'fixed' | 'inline' }>`
  font-family: ${typography.fontFamily};
  ${({ $position }) =>
    $position === 'fixed'
      ? css`
          position: fixed;
          left: 50%;
          bottom: ${spacing.lg}px;
          transform: translateX(-50%);
          z-index: ${zIndices.toast};
          width: min(560px, calc(100vw - ${spacing.md * 2}px));
          pointer-events: none;

          @media (max-width: 768px) {
            left: ${spacing.md}px;
            right: ${spacing.md}px;
            bottom: ${spacing.md}px;
            width: auto;
            transform: none;
          }
        `
      : css`
          position: relative;
          width: 100%;
          max-width: 560px;
        `}
`;

const Panel = styled.div<{ $tone: StatusToastTone; $open: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.sm}px ${spacing.md}px;
  box-sizing: border-box;
  width: 100%;
  pointer-events: auto;
  color: ${({ $tone }) => ($tone === 'error' ? colors.onErrorContainer : colors.onSurface)};

  ${({ $open, $tone }) =>
    $open
      ? css`
          padding: ${spacing.sm + spacing.xs}px ${spacing.md}px;
          border: 1px solid ${$tone === 'error' ? colors.error : colors.outlineVariant};
          border-radius: ${radii.md}px;
          background: ${$tone === 'error' ? colors.errorContainer : colors.surfaceContainerHighest};
          box-shadow: 0 6px 24px ${withAlpha(colors.black, 0.28)};
        `
      : css`
          /* Closed: keep the live region in the layout tree (never display:none) but draw nothing. */
          padding: 0;
          border: 0;
          background: transparent;
          pointer-events: none;
        `}
`;

const Body = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm}px;
  flex: 1 1 240px;
  min-width: 0;
`;

const Icon = styled.svg`
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
`;

const Region = styled.p`
  margin: 0;
  font-size: ${typography.sizes.sm}px;
  line-height: 1.45;
  overflow-wrap: anywhere;
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

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
  margin-left: auto;
`;

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border-radius: ${radii.sm}px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: ${typography.sizes.sm}px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  @media (pointer: coarse) {
    min-height: 44px;
    min-width: 44px;
  }
`;

const ActionButton = styled.button`
  ${buttonBase};
  padding: 0 ${spacing.sm + spacing.xs}px;
  border: 1px solid currentColor;
  font-weight: ${typography.weights.semibold};

  &:hover {
    background: ${colors.surfaceContainerHigh};
  }
`;

const CloseButton = styled.button`
  ${buttonBase};
  min-width: 32px;
  padding: 0;
  border: 1px solid transparent;

  &:hover {
    border-color: currentColor;
  }
`;

const InfoIcon = () => (
  <Icon viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 9v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="10" cy="6.25" r="1.1" fill="currentColor" />
  </Icon>
);

const ErrorIcon = () => (
  <Icon viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path
      d="M10 2.2 18.4 17H1.6L10 2.2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10 7.5v4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="10" cy="14.5" r="1.1" fill="currentColor" />
  </Icon>
);

/**
 * StatusToast (`xds.status-toast`): one polite status message with at most one action, e.g.
 * "SUB-8401 moved from New to Triage." with Undo.
 *
 * - The `role="status"` region is always mounted, so a message that arrives later is announced.
 * - It never takes focus. Keyboard users reach the action with Tab; place the toast after the
 *   main content in the DOM.
 * - One message at a time: a new `message`/`messageId` replaces the current one.
 * - Neutral toasts dismiss after `duration` (10 s); hover or focus pauses the timer.
 * - The error tone stays until dismissed and has a close button.
 */
export function StatusToast({
  message,
  messageId,
  action,
  duration = DEFAULT_DURATION,
  tone = 'neutral',
  onDismiss,
  closeLabel = 'Dismiss message',
  errorPrefix = 'Error:',
  position = 'fixed',
  returnFocusRef,
  className,
}: StatusToastProps) {
  const hasMessage = typeof message === 'string' && message.length > 0;
  const key = hasMessage ? String(messageId ?? message) : null;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const open = key !== null && key !== dismissedKey;

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const remaining = useRef(duration);
  const panelRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(
    (reason: StatusToastDismissReason) => {
      if (key === null) return;
      const hadFocus = !!panelRef.current?.contains(document.activeElement);
      setDismissedKey(key);
      if (hadFocus) returnFocusRef?.current?.focus();
      onDismissRef.current?.(reason);
    },
    [key, returnFocusRef],
  );

  // A new message gets the full duration. React runs every cleanup before any effect body, so
  // this reset happens after the timer cleanup below has subtracted the old elapsed time.
  useEffect(() => {
    remaining.current = duration;
  }, [key, duration]);

  // A message that is replaced while hovered should not inherit the paused state forever.
  useEffect(() => {
    if (!open) setPaused(false);
  }, [open]);

  const autoDismiss = open && tone !== 'error' && duration > 0;
  useEffect(() => {
    if (!autoDismiss || paused) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(() => dismiss('timeout'), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [autoDismiss, paused, key, dismiss]);

  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !panelRef.current?.contains(next)) {
      if (!panelRef.current?.matches(':hover')) setPaused(false);
    }
  };

  const isError = tone === 'error';

  return (
    <Wrapper $position={position} className={className} data-tone={tone}>
      <Panel
        ref={panelRef}
        $tone={tone}
        $open={open}
        data-open={open ? 'true' : 'false'}
        data-paused={paused ? 'true' : 'false'}
        onMouseEnter={open ? () => setPaused(true) : undefined}
        onMouseLeave={
          open
            ? () => {
                if (!panelRef.current?.contains(document.activeElement)) setPaused(false);
              }
            : undefined
        }
        onFocus={open ? () => setPaused(true) : undefined}
        onBlur={open ? onBlur : undefined}
      >
        <Body>
          {open && (isError ? <ErrorIcon /> : <InfoIcon />)}
          <Region role="status" aria-live="polite" aria-atomic="true">
            {open && (
              <>
                {isError && <VisuallyHidden>{`${errorPrefix} `}</VisuallyHidden>}
                {message}
              </>
            )}
          </Region>
        </Body>
        {open && (action || isError) && (
          <Actions>
            {action && (
              <ActionButton
                type="button"
                onClick={() => {
                  action.onAction();
                  dismiss('action');
                }}
              >
                {action.label}
              </ActionButton>
            )}
            {isError && (
              <CloseButton type="button" aria-label={closeLabel} onClick={() => dismiss('close')}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M2 2l10 10M12 2 2 12"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </CloseButton>
            )}
          </Actions>
        )}
      </Panel>
    </Wrapper>
  );
}

export default StatusToast;
