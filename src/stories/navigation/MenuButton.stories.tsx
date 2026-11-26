import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect, waitFor } from '@storybook/test';
import MenuButton, {
  type MenuButtonEntry,
  type MenuButtonRadioGroup,
} from '../../components/MenuButton.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const rowActions: MenuButtonEntry[] = [
  { id: 'open', label: 'Open submission', onSelect: fn() },
  { id: 'assign', label: 'Assign underwriter', onSelect: fn() },
  { id: 'refer', label: 'Refer to senior underwriter', hint: 'Above your binding authority' },
  { type: 'separator' },
  {
    id: 'archive',
    label: 'Archive',
    disabled: true,
    hint: 'Bound submissions cannot be archived',
  },
];

const stageSections: MenuButtonRadioGroup['sections'] = [
  {
    label: 'Intake',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Submitted' },
    ],
  },
  {
    label: 'Underwriting',
    options: [
      { value: 'triage', label: 'Triage' },
      { value: 'in-review', label: 'In review' },
      { value: 'referred', label: 'Referred', hint: 'asks to confirm' },
    ],
  },
  {
    label: 'Decision',
    options: [
      { value: 'quoted', label: 'Quoted', hint: 'asks to confirm' },
      {
        value: 'approved',
        label: 'Approved',
        disabled: true,
        hint: 'Not priced yet. Price SUB-8405 before approving.',
      },
      { value: 'declined', label: 'Declined', hint: 'asks to confirm' },
    ],
  },
];

const meta: Meta<typeof MenuButton> = {
  id: 'xds-menu-button',
  title: 'Navigation/MenuButton',
  component: MenuButton,
  parameters: { viewport: { viewports } },
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    triggerText: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    label: 'More actions for SUB-8405',
    items: rowActions,
    placement: 'bottom-start',
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MenuButton>;

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        minHeight: 460,
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

const themed = (theme: XdsThemeName) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme}>
      <StoryFn />
    </ThemeFrame>
  ),
];

/** Stateful "Move to a status" demo: the radio group follows the chosen stage. */
function MoveDemo(
  args: React.ComponentProps<typeof MenuButton> & { onMove?: (v: string) => void },
) {
  const [stage, setStage] = useState('triage');
  const { onMove, ...rest } = args;
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <MenuButton
        {...rest}
        radioGroup={{
          label: 'Move to a status',
          value: stage,
          sections: stageSections,
          onChange: (value) => {
            setStage(value);
            onMove?.(value);
          },
        }}
      />
      <p style={{ margin: 0 }} data-testid="stage">
        Stage: {stage}
      </p>
    </div>
  );
}

const trigger = (el: HTMLElement) =>
  within(el).getByRole('button', { name: 'More actions for SUB-8405' });

/** Closed: an icon-only trigger with `aria-haspopup="menu"` and `aria-expanded="false"`. */
export const Closed: Story = {
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(within(canvasElement).queryByRole('menu')).toBeNull();
  },
};

/** Open, with a hint ("Above your binding authority") and a disabled item that explains why. */
export const Open: Story = {
  decorators: themed('dark'),
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('menu', { name: 'More actions for SUB-8405' });
    await expect(trigger(canvasElement)).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(canvasElement)).toHaveAttribute('aria-controls', menu.id);
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
    await expect(within(menu).getByRole('separator')).toBeInTheDocument();
    const archive = within(menu).getByRole('menuitem', { name: 'Archive' });
    await expect(archive).toHaveAttribute('aria-disabled', 'true');
    await expect(archive).toHaveAccessibleDescription('Bound submissions cannot be archived');
  },
};

/** Keyboard: Enter opens on the first item; arrows, Home, End and typeahead move; Esc returns focus. */
export const ItemFocusedKeyboard: Story = {
  name: 'Item focused · keyboard',
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = trigger(canvasElement);
    button.focus();
    await userEvent.keyboard('{Enter}');
    const open = canvas.getByRole('menuitem', { name: 'Open submission' });
    await waitFor(() => expect(open).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: 'Assign underwriter' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(open).toHaveFocus();
    await userEvent.keyboard('r');
    await expect(
      canvas.getByRole('menuitem', { name: 'Refer to senior underwriter' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(open).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Archive' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
  },
};

/** A disabled item can be focused but not chosen; Enter on it keeps the menu open. */
export const DisabledItem: Story = {
  decorators: themed('dark'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    trigger(canvasElement).focus();
    await userEvent.keyboard('{ArrowUp}');
    const archive = canvas.getByRole('menuitem', { name: 'Archive' });
    await waitFor(() => expect(archive).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  },
};

/** Choosing a command closes the menu, returns focus to the trigger, then calls `onSelect`. */
export const SelectCommand: Story = {
  decorators: themed('dark'),
  args: {
    items: [
      { id: 'open', label: 'Open submission', onSelect: fn() },
      { id: 'assign', label: 'Assign underwriter', onSelect: fn() },
    ],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(trigger(canvasElement));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Assign underwriter' }));
    const assign = args.items?.[1] as { onSelect: ReturnType<typeof fn> };
    await expect(assign.onSelect).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(trigger(canvasElement)).toHaveFocus();
  },
};

/** A click outside closes the menu without moving focus back to the trigger. */
export const OutsideClickCloses: Story = {
  decorators: themed('dark'),
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <MenuButton {...args} />
      <button type="button">Elsewhere</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(trigger(canvasElement));
    await expect(canvas.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Elsewhere' }));
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  },
};

/**
 * "Move to a status" (AIN-301): grouped `menuitemradio` sections. The current stage is
 * `aria-checked` and marked "Current"; decision stages say they ask to confirm; Approved is
 * disabled with the reason.
 */
export const MoveToStatus: Story = {
  name: 'Move to a status · open',
  decorators: themed('dark'),
  args: { items: [{ id: 'open', label: 'Open submission' }], defaultOpen: true },
  render: (args) => <MoveDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Move to a status' });
    await expect(within(group).getByRole('group', { name: 'Decision' })).toBeInTheDocument();
    await expect(within(group).getAllByRole('menuitemradio')).toHaveLength(8);
    const triage = canvas.getByRole('menuitemradio', { name: 'Triage' });
    await expect(triage).toHaveAttribute('aria-checked', 'true');
    await expect(triage).toHaveAccessibleDescription('Current');
    const approved = canvas.getByRole('menuitemradio', { name: 'Approved' });
    await expect(approved).toHaveAttribute('aria-disabled', 'true');
    await expect(approved).toHaveAttribute('aria-checked', 'false');
    await expect(approved).toHaveAccessibleDescription(
      'Not priced yet. Price SUB-8405 before approving.',
    );
    await expect(
      canvas.getByRole('menuitemradio', { name: 'Declined' }),
    ).toHaveAccessibleDescription('asks to confirm');
  },
};

/** Keyboard-only move: open, typeahead to "In review", Enter; focus returns to the trigger. */
export const KeyboardMove: Story = {
  name: 'Move to a status · keyboard',
  decorators: themed('dark'),
  args: { onMove: fn() } as Partial<React.ComponentProps<typeof MoveDemo>>,
  render: (args) => <MoveDemo {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = trigger(canvasElement);
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getByRole('menu')).toBeInTheDocument());
    await userEvent.keyboard('in');
    await expect(canvas.getByRole('menuitemradio', { name: 'In review' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(button).toHaveFocus();
    const onMove = (args as { onMove: ReturnType<typeof fn> }).onMove;
    await expect(onMove).toHaveBeenCalledWith('in-review');
    await expect(canvas.getByTestId('stage')).toHaveTextContent('Stage: in-review');
    // Choosing the current stage again does nothing.
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('in');
    await userEvent.keyboard('{Enter}');
    await expect(onMove).toHaveBeenCalledTimes(1);
  },
};

/** A trigger with visible text and a chevron. The visible text is inside the accessible name. */
export const TextTrigger: Story = {
  decorators: themed('dark'),
  args: { label: 'Move SUB-8405 to another status', triggerText: 'Move', items: [] },
  render: (args) => <MoveDemo {...args} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Move SUB-8405 to another status',
    });
    await expect(button).toHaveTextContent('Move');
  },
};

/** Disabled trigger (e.g. the submission is locked by another underwriter). */
export const DisabledTrigger: Story = {
  decorators: themed('dark'),
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(trigger(canvasElement)).toBeDisabled();
  },
};

/** Small trigger for dense table rows; 44 px on touch pointers. */
export const SmallInRow: Story = {
  name: 'Small · in a table row',
  decorators: themed('dark'),
  args: { size: 'sm', placement: 'bottom-end' },
  render: (args) => (
    <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 640 }}>
      <caption style={{ textAlign: 'left', paddingBottom: 8 }}>Submissions</caption>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Reference</th>
          <th style={{ textAlign: 'left' }}>Insured</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>SUB-8405</td>
          <td>Harbour Logistics Ltd</td>
          <td style={{ textAlign: 'right' }}>
            <MenuButton {...args} />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

/** Open menu, light theme. */
export const LightTheme: Story = {
  ...MoveToStatus,
  name: 'Move to a status · light',
  decorators: themed('light'),
};

/** 390 px with the trigger at the right edge: the menu flips to `bottom-end` to stay on screen. */
export const Narrow390: Story = {
  name: 'Narrow · 390 px',
  decorators: themed('dark'),
  parameters: { viewport: { defaultViewport: 'xds390' } },
  args: { placement: 'bottom-start', defaultOpen: true },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <MenuButton {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const menu = within(canvasElement).getByRole('menu');
    const rect = menu.getBoundingClientRect();
    const width = canvasElement.ownerDocument.documentElement.clientWidth;
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(width + 1);
  },
};
