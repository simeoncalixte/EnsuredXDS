import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect } from '@storybook/test';
import RadioGroup, { type RadioGroupOption } from '../../components/RadioGroup.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';

const viewports = {
  xds390: { name: '390 px', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  xds1440: { name: '1440 px', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
};

const decisionOptions: RadioGroupOption[] = [
  {
    value: 'approve',
    label: 'Approve',
    description: 'Moves SUB-8401 to Approved and notifies the broker.',
  },
  {
    value: 'decline',
    label: 'Decline',
    description: 'Moves SUB-8401 to Declined. You will be asked for a reason.',
  },
];

const meta: Meta<typeof RadioGroup> = {
  id: 'xds-radio-group',
  title: 'Form Elements/RadioGroup',
  component: RadioGroup,
  parameters: { viewport: { viewports } },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    legendHidden: { control: 'boolean' },
    error: { control: 'text' },
  },
  args: {
    name: 'decision',
    legend: 'Decision for SUB-8401',
    options: decisionOptions,
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        boxSizing: 'border-box',
        maxWidth: 560,
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

/** Default: nothing is selected until the underwriter chooses. */
export const Default: Story = {
  name: 'Default · no selection',
  decorators: themed('dark'),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Decision for SUB-8401/ });
    await expect(group.tagName).toBe('FIELDSET');
    const radios = canvas.getAllByRole('radio');
    await expect(radios).toHaveLength(2);
    for (const radio of radios) await expect(radio).not.toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Approve' })).toHaveAccessibleDescription(
      'Moves SUB-8401 to Approved and notifies the broker.',
    );
    await userEvent.click(canvas.getByText('Decline'));
    await expect(canvas.getByRole('radio', { name: 'Decline' })).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith('decline', expect.anything());
  },
};

export const LightTheme: Story = {
  name: 'Light theme · selected',
  decorators: themed('light'),
  args: { value: 'approve' },
};

/** Keyboard: Tab enters the group, arrow keys move and select, Tab leaves. */
export const Keyboard: Story = {
  name: 'Keyboard · arrows select',
  decorators: themed('dark'),
  render: (args) => (
    <>
      <button type="button">Before</button>
      <div style={{ height: 12 }} />
      <RadioGroup {...args} />
      <div style={{ height: 12 }} />
      <button type="button">After</button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    const approve = canvas.getByRole('radio', { name: 'Approve' });
    const decline = canvas.getByRole('radio', { name: 'Decline' });
    await expect(approve).toHaveFocus();
    await expect(approve).not.toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    await expect(decline).toHaveFocus();
    await expect(decline).toBeChecked();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
  },
};

/** Controlled: `value={null}` means nothing chosen yet; the caller owns the state. */
export const Controlled: Story = {
  name: 'Controlled · value null → chosen',
  decorators: themed('dark'),
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <>
        <RadioGroup
          {...args}
          value={value}
          onChange={(next, event) => {
            setValue(next);
            args.onChange?.(next, event);
          }}
        />
        <p style={{ marginTop: 12, fontSize: 14 }}>Chosen: {value ?? 'none'}</p>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Chosen: none')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('radio', { name: 'Approve' }));
    await expect(canvas.getByText('Chosen: approve')).toBeInTheDocument();
  },
};

/** Hint under the legend and the required marker. */
export const WithHintRequired: Story = {
  name: 'Hint · required',
  decorators: themed('dark'),
  args: {
    legend: 'This lane holds working and decision statuses',
    hint: 'Choose where SUB-8401 should go in Underwriting.',
    required: true,
    name: 'lane-status',
    options: [
      { value: 'in-review', label: 'In review', description: 'Working status.' },
      { value: 'referred', label: 'Referred', description: 'Needs a senior underwriter.' },
      { value: 'quoted', label: 'Quoted', description: 'Decision status. Sends the quote.' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    await expect(group).toHaveAccessibleDescription(
      'Choose where SUB-8401 should go in Underwriting.',
    );
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeRequired();
  },
};

/** Disabled option with its reason, at full contrast (AIN-301 Revision 3). */
export const DisabledOption: Story = {
  name: 'Disabled option · with reason',
  decorators: themed('dark'),
  args: {
    options: [
      {
        value: 'approve',
        label: 'Approve',
        description: 'Not priced yet. Price SUB-8401 before approving.',
        disabled: true,
      },
      decisionOptions[1],
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const approve = canvas.getByRole('radio', { name: 'Approve' });
    await expect(approve).toBeDisabled();
    await expect(approve).toHaveAccessibleDescription(
      'Not priced yet. Price SUB-8401 before approving.',
    );
    await expect(canvas.getByRole('radio', { name: 'Decline' })).toBeEnabled();
  },
};

export const WholeGroupDisabled: Story = {
  name: 'Disabled · whole group',
  decorators: themed('dark'),
  args: { disabled: true, value: 'decline' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
  },
};

/** Error: icon + "Error:" prefix + text, linked to the fieldset. Never colour only. */
export const ErrorState: Story = {
  name: 'Error · nothing chosen',
  decorators: themed('dark'),
  args: { required: true, error: 'Choose Approve or Decline.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group')).toHaveAccessibleDescription(
      'Error: Choose Approve or Decline.',
    );
  },
};

export const ErrorLight: Story = {
  name: 'Error · light theme',
  decorators: themed('light'),
  args: { required: true, error: 'Choose Approve or Decline.' },
};

export const Horizontal: Story = {
  name: 'Horizontal · 390 px wraps',
  decorators: themed('dark'),
  args: { orientation: 'horizontal' },
  parameters: { viewport: { defaultViewport: 'xds390' } },
};
