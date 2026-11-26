import React, { useEffect, useId, useRef } from 'react';
import styled from 'styled-components';
import { zIndices } from '../tokens.js';
import { colors, withAlpha } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';

export type XdsModalRole = 'dialog' | 'alertdialog';

export type ModalProps = {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  /**
   * `alertdialog` is for confirming irreversible or superseding actions (supersede a
   * sent quote, accept or decline terms, bind). It defaults `closeOnScrimClick` to
   * false. Pair it with `describedBy` and an `initialFocusRef` on the safe action.
   */
  role?: XdsModalRole;
  /** Id of the element (usually inside `children`) that states the consequence. */
  describedBy?: string;
  /** Accessible name when there is no visible `title`. */
  ariaLabel?: string;
  /**
   * Element focused when the modal opens. For confirmations, point it at Cancel /
   * "Back to quote", never at the destructive action. Defaults to the first
   * focusable element in the body or footer.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Element focused when the modal closes, resolved when it opens. Defaults to
   * whatever had focus on open (normally the trigger).
   */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Esc calls `onClose` (acts as Cancel). Default true. Ignored while `submitting`. */
  closeOnEscape?: boolean;
  /** Clicking the scrim calls `onClose`. Default true for `dialog`, false for `alertdialog`. */
  closeOnScrimClick?: boolean;
  /**
   * The action is in flight: sets `aria-busy`, disables the close button and ignores
   * Esc and scrim clicks. The caller disables its footer buttons and sets the
   * in-progress label (for example "Superseding…").
   */
  submitting?: boolean;
  /**
   * Inline error shown at the top of the body in a `role="alert"` region. Focus
   * moves to it when it appears, so the reason is read before the actions.
   */
  error?: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusableIn = (root: HTMLElement | null): HTMLElement[] =>
  root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

// Footer: a row of actions; below 480 px it stacks full width with 44 px targets.
const Footer = styled.div`
  padding: ${spacing.md}px;
  background: ${withAlpha(colors.surface, 0.5)};
  display: flex;
  gap: ${spacing.sm + spacing.xs}px;
  flex-shrink: 0;

  @media (max-width: 479px) {
    flex-direction: column;

    & > * {
      width: 100%;
      min-height: 44px;
    }
  }
`;

const ErrorRegion = styled.div`
  padding: ${spacing.sm + spacing.xs}px ${spacing.md}px;
  border-radius: ${radii.md}px;
  background: ${colors.errorContainer};
  color: ${colors.onErrorContainer};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.5;

  &:focus-visible {
    outline: 2px solid ${colors.onErrorContainer};
    outline-offset: 2px;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${withAlpha(colors.onSurface, 0.7)};
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  border-radius: ${radii.sm}px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

// Presentational modal. It owns focus management (initial focus, Tab trap, focus
// return) and Esc/scrim handling; the caller owns open state and the actions.
export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
  width = 'min(640px, 94%)',
  role = 'dialog',
  describedBy,
  ariaLabel,
  initialFocusRef,
  returnFocusRef,
  closeOnEscape = true,
  closeOnScrimClick,
  submitting = false,
  error,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const scrimCloses = closeOnScrimClick ?? role !== 'alertdialog';
  const hasError = error !== undefined && error !== null && error !== false && error !== '';

  // Initial focus on open; return focus on close or unmount.
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    const target = initialFocusRef?.current ?? focusableIn(panelRef.current)[0] ?? panelRef.current;
    // Resolved on open: the trigger is the element to return to.
    const back = returnFocusRef?.current ?? previouslyFocused;
    target?.focus();
    return () => {
      if (back && typeof document !== 'undefined' && document.contains(back)) back.focus();
    };
    // Refs are read on open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc is handled on the document, so it still cancels when focus has left the
  // panel (for example after a click on a non-focusable area).
  const escapeRef = useRef<() => void>(() => undefined);
  escapeRef.current = () => {
    if (closeOnEscape && !submitting) onClose?.();
  };
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escapeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Move focus to the error so it is announced before the actions.
  useEffect(() => {
    if (open && hasError) errorRef.current?.focus();
  }, [open, hasError, error]);

  if (!open) return null;

  const outlineColor = withAlpha(colors.neutral[400], 0.2);
  const outlineColorLight = withAlpha(colors.neutral[400], 0.15);

  const requestClose = () => {
    if (!submitting) onClose?.();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const items = focusableIn(panelRef.current);
    if (items.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      data-xds-modal-scrim=""
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: withAlpha(colors.scrim, 0.6),
        zIndex: zIndices.modal,
      }}
      onClick={scrimCloses ? requestClose : undefined}
      // Keep focus inside the dialog when the scrim is pressed.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        aria-describedby={describedBy}
        aria-busy={submitting || undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: colors.surface,
          color: colors.text.primary,
          borderRadius: radii.lg,
          border: `1px solid ${outlineColor}`,
          boxShadow: `0 40px 40px ${withAlpha(colors.primarySoft, 0.12)}`,
          outline: 'none',
        }}
      >
        <div
          style={{
            padding: spacing.lg - 8,
            borderBottom: `1px solid ${outlineColorLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <h3
            id={titleId}
            style={{
              margin: 0,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: colors.text.primary,
            }}
          >
            {title}
          </h3>
          <CloseButton
            type="button"
            aria-label="Close"
            onClick={requestClose}
            disabled={submitting}
          >
            ✕
          </CloseButton>
        </div>

        <div
          style={{
            padding: spacing.xl - 8,
            display: 'grid',
            gap: spacing.md,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {hasError ? (
            <ErrorRegion ref={errorRef} role="alert" tabIndex={-1}>
              {error}
            </ErrorRegion>
          ) : null}
          <div style={{ marginBottom: spacing.md }}>{children}</div>
        </div>

        <Footer>
          {footer ? (
            footer
          ) : (
            <>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: colors.text.secondary,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={requestClose}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: colors.primary,
                  border: 'none',
                  color: colors.onPrimary,
                  borderRadius: radii.sm,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Transaction
              </button>
            </>
          )}
        </Footer>
      </div>
    </div>
  );
};

export default Modal;
