import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, withAlpha } from '../colors.js';
import { radii, spacing, typography, zIndices } from '../tokens.js';

/** A command in the menu, e.g. "Open submission" or "Assign underwriter". */
export type MenuButtonAction = {
  type?: 'item';
  id: string;
  label: string;
  /** Secondary text under the label, e.g. "asks to confirm". Linked with `aria-describedby`. */
  hint?: string;
  /** Focusable but cannot be chosen (`aria-disabled`). Say why in `hint`. */
  disabled?: boolean;
  onSelect?: () => void;
};

export type MenuButtonSeparator = { type: 'separator'; id?: string };

/** A labelled group of commands (`role="group"`). */
export type MenuButtonGroup = {
  type: 'group';
  id?: string;
  label: string;
  items: MenuButtonAction[];
};

export type MenuButtonEntry = MenuButtonAction | MenuButtonSeparator | MenuButtonGroup;

export type MenuButtonRadioOption = {
  value: string;
  label: string;
  /** Secondary text, e.g. "asks to confirm" or "Not priced yet". Linked with `aria-describedby`. */
  hint?: string;
  /** Focusable but cannot be chosen (`aria-disabled`). Say why in `hint`. */
  disabled?: boolean;
};

/** A labelled section of radio options, e.g. "Intake" with Draft and Submitted. */
export type MenuButtonRadioSection = {
  label: string;
  options: MenuButtonRadioOption[];
};

/**
 * A single-choice list rendered as `menuitemradio`s, e.g. "Move to a status". The option whose
 * `value` matches is `aria-checked="true"` and marked with `currentLabel` ("Current").
 * Use `options` for a flat list or `sections` for labelled sub-groups.
 */
export type MenuButtonRadioGroup = {
  label: string;
  value?: string;
  options?: MenuButtonRadioOption[];
  sections?: MenuButtonRadioSection[];
  /** Text shown beside the checked option. Defaults to "Current". */
  currentLabel?: string;
  /** Called with the chosen value. It is not called for the checked option or a disabled one. */
  onChange: (value: string) => void;
};

export type MenuButtonPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type MenuButtonProps = {
  /** Accessible name of the trigger, e.g. "More actions for SUB-8405". Also names the menu. */
  label: string;
  /** Visible trigger text. When omitted the trigger is an icon-only "more" button. Keep the visible text inside `label` (WCAG 2.5.3). */
  triggerText?: string;
  items?: MenuButtonEntry[];
  radioGroup?: MenuButtonRadioGroup;
  /** Preferred side. The menu flips when it would leave the viewport. Defaults to `bottom-end`. */
  placement?: MenuButtonPlacement;
  disabled?: boolean;
  /** Opens on first render (for stories and visual tests). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
};

type FlatItem = {
  key: string;
  label: string;
  disabled: boolean;
  activate: () => void;
};

const TYPEAHEAD_RESET_MS = 500;

const Root = styled.div`
  position: relative;
  display: inline-flex;
  font-family: ${typography.fontFamily};
`;

const Trigger = styled.button<{ $iconOnly: boolean; $size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.xs}px;
  min-width: ${({ $size }) => ($size === 'sm' ? 24 : 32)}px;
  min-height: ${({ $size }) => ($size === 'sm' ? 24 : 32)}px;
  padding: ${({ $iconOnly, $size }) =>
    $iconOnly ? '0' : `0 ${$size === 'sm' ? spacing.sm : spacing.sm + spacing.xs}px`};
  border: 1px solid ${({ $iconOnly }) => ($iconOnly ? 'transparent' : colors.outlineVariant)};
  border-radius: ${radii.sm}px;
  background: transparent;
  color: ${colors.onSurface};
  font: inherit;
  font-size: ${({ $size }) => ($size === 'sm' ? typography.sizes.xs : typography.sizes.sm)}px;
  font-weight: ${typography.weights.medium};
  cursor: pointer;

  &:hover:not(:disabled),
  &[aria-expanded='true'] {
    background: ${colors.surfaceContainerHigh};
  }

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  svg {
    display: block;
    width: 16px;
    height: 16px;
    flex: none;
  }

  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
  }
`;

const placementStyles = (placement: MenuButtonPlacement) => {
  const [side, align] = placement.split('-');
  return css`
    ${side === 'top' ? 'bottom' : 'top'}: calc(100% + ${spacing.xs}px);
    ${align === 'end' ? 'right' : 'left'}: 0;
  `;
};

const Menu = styled.div<{ $placement: MenuButtonPlacement }>`
  position: absolute;
  ${({ $placement }) => placementStyles($placement)}
  z-index: ${zIndices.dropdown};
  box-sizing: border-box;
  min-width: 200px;
  max-width: min(320px, calc(100vw - ${spacing.md * 2}px));
  max-height: calc(100vh - ${spacing.md * 2}px);
  overflow-y: auto;
  padding: ${spacing.xs}px 0;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  background: ${colors.surfaceContainer};
  color: ${colors.onSurface};
  box-shadow: 0 8px 24px ${withAlpha(colors.scrim, 0.32)};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.4;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: start;
  column-gap: ${spacing.sm}px;
  padding: ${spacing.sm}px ${spacing.sm + spacing.xs}px;
  cursor: pointer;
  outline: none;
  overflow-wrap: anywhere;

  &:hover,
  &:focus {
    background: ${colors.surfaceContainerHigh};
  }

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }

  &[aria-disabled='true'] [data-part='label'] {
    color: ${colors.onSurfaceVariant};
  }

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const Check = styled.span`
  display: inline-flex;
  margin-top: 2px;
  color: ${colors.primary};

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }
`;

const ItemText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Hint = styled.span`
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
`;

const Current = styled.span`
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.semibold};
  white-space: nowrap;
`;

const GroupLabel = styled.div`
  padding: ${spacing.sm}px ${spacing.sm + spacing.xs}px ${spacing.xs}px;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.semibold};
  letter-spacing: 0.02em;
`;

const SubGroupLabel = styled(GroupLabel)`
  padding-top: ${spacing.xs}px;
  font-weight: ${typography.weights.medium};
`;

const Separator = styled.div`
  height: 1px;
  margin: ${spacing.xs}px 0;
  background: ${colors.outlineVariant};
`;

const MoreIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
    <circle cx="3" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="13" cy="8" r="1.5" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M3.5 8.5l3 3 6-7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const flipPlacement = (
  placement: MenuButtonPlacement,
  menu: DOMRect,
  viewport: { width: number; height: number },
): MenuButtonPlacement => {
  let [side, align] = placement.split('-') as ['top' | 'bottom', 'start' | 'end'];
  if (side === 'bottom' && menu.bottom > viewport.height && menu.top - menu.height > 0)
    side = 'top';
  else if (side === 'top' && menu.top < 0 && menu.bottom + menu.height < viewport.height)
    side = 'bottom';
  if (align === 'start' && menu.right > viewport.width) align = 'end';
  else if (align === 'end' && menu.left < 0) align = 'start';
  return `${side}-${align}`;
};

/**
 * Menu button (WAI-ARIA APG menu-button pattern), e.g. a per-row "More actions" menu on a
 * submission, and the keyboard and single-pointer alternative to dragging a card between
 * underwriting stages (WCAG 2.5.7).
 *
 * - The trigger is a native button with `aria-haspopup="menu"` and `aria-expanded`.
 * - Enter, Space or ArrowDown open the menu on the first item; ArrowUp opens it on the last.
 * - In the menu, the arrow keys, Home, End and typeahead move between items, Enter or Space
 *   choose, and Esc closes and returns focus to the trigger. Tab closes the menu.
 * - A click outside closes it; the menu flips to stay inside the viewport.
 *
 * Presentational only: the caller owns the copy, what each command does, and any confirmation
 * (e.g. a Modal in alertdialog mode for a decision stage).
 */
export function MenuButton({
  label,
  triggerText,
  items = [],
  radioGroup,
  placement = 'bottom-end',
  disabled = false,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  className,
}: MenuButtonProps) {
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;
  const [open, setOpenState] = useState(defaultOpen && !disabled);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resolvedPlacement, setResolvedPlacement] = useState<MenuButtonPlacement>(placement);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const typeahead = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const focusOnOpen = useRef(false);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  // Build the flat list of focusable items in DOM order.
  const flat: FlatItem[] = [];
  const addAction = (action: MenuButtonAction) => {
    flat.push({
      key: `a-${action.id}`,
      label: action.label,
      disabled: Boolean(action.disabled),
      activate: () => action.onSelect?.(),
    });
  };
  for (const entry of items) {
    if (entry.type === 'separator') continue;
    if (entry.type === 'group') entry.items.forEach(addAction);
    else addAction(entry);
  }
  const radioSections: MenuButtonRadioSection[] = radioGroup
    ? (radioGroup.sections ?? [{ label: '', options: radioGroup.options ?? [] }])
    : [];
  for (const section of radioSections)
    for (const option of section.options)
      flat.push({
        key: `r-${option.value}`,
        label: option.label,
        disabled: Boolean(option.disabled),
        activate: () => {
          if (option.value !== radioGroup?.value) radioGroup?.onChange(option.value);
        },
      });

  const count = flat.length;

  const focusItem = (index: number) => {
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    setActiveIndex(next);
    itemRefs.current[next]?.focus();
  };

  const closeAndReturn = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openAt = (index: number) => {
    typeahead.current = { text: '', at: 0 };
    setActiveIndex(count === 0 ? 0 : ((index % count) + count) % count);
    focusOnOpen.current = true;
    setOpen(true);
  };

  // Focus the active item once the menu is in the DOM, and keep it in the viewport.
  useLayoutEffect(() => {
    if (!open) {
      setResolvedPlacement(placement);
      return;
    }
    const menu = menuRef.current;
    if (menu && typeof window !== 'undefined') {
      const next = flipPlacement(placement, menu.getBoundingClientRect(), {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (next !== resolvedPlacement) setResolvedPlacement(next);
    }
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      itemRefs.current[activeIndex]?.focus();
    }
    // Only re-run when the menu opens or the preferred placement changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placement]);

  // Close on a pointer press outside the trigger and menu. Focus stays where the user put it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent | MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, setOpen]);

  const choose = (index: number) => {
    const item = flat[index];
    if (!item || item.disabled) return;
    closeAndReturn();
    item.activate();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(count - 1);
    }
  };

  const onTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Keyboard activation is handled in onKeyDown; detail === 0 means a synthetic keyboard click.
    if (event.detail === 0) return;
    if (open) setOpen(false);
    else openAt(0);
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (key === 'ArrowDown') {
      event.preventDefault();
      focusItem(activeIndex + 1);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      focusItem(activeIndex - 1);
    } else if (key === 'Home' || key === 'PageUp') {
      event.preventDefault();
      focusItem(0);
    } else if (key === 'End' || key === 'PageDown') {
      event.preventDefault();
      focusItem(count - 1);
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeAndReturn();
    } else if (key === 'Tab') {
      setOpen(false);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      choose(activeIndex);
    } else if (key.length === 1 && /\S/.test(key) && !event.ctrlKey && !event.metaKey) {
      const now = Date.now();
      const state = typeahead.current;
      state.text = now - state.at > TYPEAHEAD_RESET_MS ? key : state.text + key;
      state.at = now;
      const query = state.text.toLowerCase();
      const repeated = query.split('').every((c) => c === query[0]);
      const start = state.text.length === 1 || repeated ? activeIndex + 1 : activeIndex;
      for (let step = 0; step < count; step += 1) {
        const index = (start + step) % count;
        const text = flat[index].label.toLowerCase();
        if (text.startsWith(repeated ? query[0] : query)) {
          focusItem(index);
          break;
        }
      }
    }
  };

  let flatIndex = 0;
  const renderItem = (
    role: 'menuitem' | 'menuitemradio',
    key: string,
    itemLabel: string,
    opts: { hint?: string; disabled?: boolean; checked?: boolean; currentLabel?: string },
  ) => {
    const index = flatIndex;
    flatIndex += 1;
    const id = `${baseId}-item-${index}`;
    const describedBy = [
      opts.checked ? `${id}-current` : null,
      opts.hint ? `${id}-hint` : null,
    ].filter(Boolean);
    return (
      <Item
        key={key}
        id={id}
        role={role}
        tabIndex={-1}
        ref={(node) => {
          itemRefs.current[index] = node;
        }}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        aria-disabled={opts.disabled ? 'true' : undefined}
        aria-checked={role === 'menuitemradio' ? (opts.checked ? 'true' : 'false') : undefined}
        data-active={index === activeIndex ? 'true' : undefined}
        onClick={() => choose(index)}
        onMouseMove={() => {
          if (index !== activeIndex) focusItem(index);
        }}
      >
        <Check>{opts.checked ? <CheckIcon /> : null}</Check>
        <ItemText>
          <span id={`${id}-label`} data-part="label">
            {itemLabel}
          </span>
          {opts.hint ? <Hint id={`${id}-hint`}>{opts.hint}</Hint> : null}
        </ItemText>
        {opts.checked ? <Current id={`${id}-current`}>{opts.currentLabel}</Current> : <span />}
      </Item>
    );
  };

  const renderAction = (action: MenuButtonAction) =>
    renderItem('menuitem', action.id, action.label, {
      hint: action.hint,
      disabled: action.disabled,
    });

  const renderRadioOptions = (options: MenuButtonRadioOption[]) =>
    options.map((option) =>
      renderItem('menuitemradio', `r-${option.value}`, option.label, {
        hint: option.hint,
        disabled: option.disabled,
        checked: option.value === radioGroup?.value,
        currentLabel: radioGroup?.currentLabel ?? 'Current',
      }),
    );

  const radioLabelId = `${baseId}-radio-label`;

  return (
    <Root ref={rootRef} className={className}>
      <Trigger
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        $iconOnly={!triggerText}
        $size={size}
      >
        {triggerText ? (
          <>
            <span>{triggerText}</span>
            <ChevronIcon />
          </>
        ) : (
          <MoreIcon />
        )}
      </Trigger>
      {open ? (
        <Menu
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          $placement={resolvedPlacement}
          data-placement={resolvedPlacement}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((entry, i) => {
            if (entry.type === 'separator')
              return <Separator key={entry.id ?? `sep-${i}`} role="separator" />;
            if (entry.type === 'group') {
              const groupLabelId = `${baseId}-group-${i}`;
              return (
                <div key={entry.id ?? `group-${i}`} role="group" aria-labelledby={groupLabelId}>
                  <GroupLabel id={groupLabelId} role="presentation">
                    {entry.label}
                  </GroupLabel>
                  {entry.items.map(renderAction)}
                </div>
              );
            }
            return renderAction(entry);
          })}
          {radioGroup ? (
            <>
              {items.length > 0 ? <Separator role="separator" /> : null}
              <div role="group" aria-labelledby={radioLabelId}>
                <GroupLabel id={radioLabelId} role="presentation">
                  {radioGroup.label}
                </GroupLabel>
                {radioGroup.sections
                  ? radioGroup.sections.map((section, s) => {
                      const sectionId = `${baseId}-radio-section-${s}`;
                      return (
                        <div key={`${section.label}-${s}`} role="group" aria-labelledby={sectionId}>
                          <SubGroupLabel id={sectionId} role="presentation">
                            {section.label}
                          </SubGroupLabel>
                          {renderRadioOptions(section.options)}
                        </div>
                      );
                    })
                  : renderRadioOptions(radioGroup.options ?? [])}
              </div>
            </>
          ) : null}
        </Menu>
      ) : null}
    </Root>
  );
}

export default MenuButton;
