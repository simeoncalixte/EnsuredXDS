import React, { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import Button from './Button.js';
import { colors, withAlpha } from '../colors.js';

/** The application rail/panel geometry shared with the submission overview. */
export const RightHandPanelSurface = styled.aside`
  box-sizing: border-box;
  background: ${colors.surface};
  color: ${colors.text.primary};
  border: 1px solid ${colors.outlineVariant};
  border-radius: 12px;
`;
const Surface = styled(RightHandPanelSurface)`
  position: fixed;
  top: 80px;
  right: 0;
  bottom: 16px;
  z-index: 1100;
  width: min(420px, calc(100vw - 16px));
  min-width: 0;
  display: flex;
  flex-direction: column;
  box-shadow: -12px 12px 32px ${withAlpha(colors.scrim, 0.25)};
  &[hidden] {
    display: none;
  }
  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid ${colors.outlineVariant};
  }
  > header h2 {
    margin: 0;
    font-size: 18px;
  }
  > footer {
    padding: 16px;
    border-top: 1px solid ${colors.outlineVariant};
  }
  :focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }
`;
const Body = styled.div`
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* Filter toolbars become a vertical section without changing their controls. */
  > *,
  form,
  fieldset {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  form,
  && [data-filter-fields] {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    position: static;
    margin: 0;
    box-sizing: border-box;
  }
  input:not([type='checkbox']):not([type='radio']),
  select {
    max-width: 100%;
    box-sizing: border-box;
  }
`;
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1099;
  background: ${withAlpha(colors.scrim, 0.45)};
`;
export type RightHandPanelProps = {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  triggerLabel?: string;
};

/** A controlled panel, or a self-contained filter section with its own trigger.
 * Children remain mounted on close so unsaved selections and local state survive.
 * Rendering in place preserves each owning application's scoped styles.
 */
export function RightHandPanel({
  title,
  children,
  footer,
  open: controlled,
  onClose,
  triggerLabel = title,
}: RightHandPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const open = controlled ?? expanded;
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const closeRef = useRef<() => void>(() => {});
  closeRef.current = () => {
    setExpanded(false);
    onClose?.();
  };
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ) ?? [],
      ).filter(
        (element) => element.getClientRects().length && !element.closest('[hidden], [inert]'),
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === panel.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    // Inert siblings along the ancestor chain, without disabling the panel itself.
    const siblings: HTMLElement[] = [];
    let node: HTMLElement | null = panel.current;
    while (node?.parentElement && node !== document.body) {
      for (const sibling of Array.from(node.parentElement.children))
        if (
          sibling !== node &&
          sibling instanceof HTMLElement &&
          !sibling.hasAttribute('data-panel-backdrop')
        )
          siblings.push(sibling);
      node = node.parentElement;
    }
    const prior = siblings.map((element) => element.inert);
    siblings.forEach((element) => {
      element.inert = true;
    });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      siblings.forEach((element, index) => {
        element.inert = prior[index];
      });
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  return (
    <>
      {controlled === undefined && (
        <Button
          type="button"
          variant="secondary"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setExpanded(true)}
        >
          {triggerLabel}
        </Button>
      )}
      {open && <Backdrop data-panel-backdrop="" onMouseDown={() => closeRef.current()} />}
      <Surface
        ref={panel}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        id={id}
        tabIndex={-1}
        data-right-hand-panel=""
      >
        <header>
          <h2 id={`${id}-title`}>{title}</h2>
          <Button
            type="button"
            variant="secondary"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={() => closeRef.current()}
          >
            ✕
          </Button>
        </header>
        <Body>{children}</Body>
        {footer && <footer>{footer}</footer>}
      </Surface>
    </>
  );
}
export default RightHandPanel;
