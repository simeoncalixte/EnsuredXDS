import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { ToggleSwitch } from '../../components/ToggleSwitch.js';
import { ValidationMessage } from '../../components/ValidationMessage.js';

const meta: Meta<typeof ToggleSwitch> = {
  id: 'xds-toggleswitch',
  title: 'Form Elements/ToggleSwitch',
  component: ToggleSwitch,
};

export default meta;

type Story = StoryObj<typeof ToggleSwitch>;

const Controlled: React.FC<{
  initial?: boolean;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
}> = ({ initial = false, label, disabled, id, invalid, describedBy, ariaLabel }) => {
  const [checked, setChecked] = useState(initial);
  return (
    <ToggleSwitch
      checked={checked}
      onChange={setChecked}
      label={label}
      disabled={disabled}
      id={id}
      invalid={invalid}
      describedBy={describedBy}
      aria-label={ariaLabel}
    />
  );
};

export const Off: Story = {
  render: () => <Controlled initial={false} label="Notifications" />,
};

export const On: Story = {
  render: () => <Controlled initial label="Notifications" />,
};

export const Disabled: Story = {
  render: () => <Controlled initial label="Locked setting" disabled />,
};

export const TogglesOnClick: Story = {
  render: () => <Controlled initial={false} label="Enable feature" id="feature-toggle" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    expect(sw).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  },
};

const Invalid: React.FC<{ disabled?: boolean }> = ({ disabled }) => (
  <div>
    <Controlled
      initial={false}
      label="I confirm the property has a sprinkler system"
      id="sprinkler-toggle"
      invalid
      describedBy="sprinkler-error"
      disabled={disabled}
    />
    <ValidationMessage id="sprinkler-error">
      Confirm the sprinkler system to continue.
    </ValidationMessage>
  </div>
);

const assertInvalid = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const sw = canvas.getByRole('switch');
  expect(sw).toHaveAttribute('aria-invalid', 'true');
  const describedBy = sw.getAttribute('aria-describedby');
  expect(describedBy).toBe('sprinkler-error');
  const message = canvasElement.ownerDocument.getElementById(describedBy!);
  expect(message).not.toBeNull();
  expect(message).toHaveTextContent('Confirm the sprinkler system to continue.');
  expect(sw).toHaveAccessibleDescription('Confirm the sprinkler system to continue.');
  return sw;
};

export const InvalidState: Story = {
  render: () => <Invalid />,
  play: async ({ canvasElement }) => {
    const sw = await assertInvalid(canvasElement);
    expect(sw).toBeEnabled();
  },
};

export const InvalidDisabled: Story = {
  name: 'Invalid + disabled (read-only)',
  render: () => <Invalid disabled />,
  play: async ({ canvasElement }) => {
    const sw = await assertInvalid(canvasElement);
    expect(sw).toBeDisabled();
  },
};

export const ValidStateHasNoAriaInvalid: Story = {
  render: () => <Controlled initial label="Notifications" />,
  play: async ({ canvasElement }) => {
    const sw = within(canvasElement).getByRole('switch');
    expect(sw).not.toHaveAttribute('aria-invalid');
    expect(sw).not.toHaveAttribute('aria-describedby');
  },
};

/** The consumer renders its own label, so the switch takes `aria-label` and shows no second label. */
export const ExternalLabel: Story = {
  render: () => (
    <div>
      <span id="external-label">Has sprinklers</span>
      <Controlled initial={false} ariaLabel="Has sprinklers" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch', { name: 'Has sprinklers' });
    expect(sw).not.toHaveAttribute('aria-labelledby');
    expect(canvas.getAllByText('Has sprinklers')).toHaveLength(1);
  },
};
