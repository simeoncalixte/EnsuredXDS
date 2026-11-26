import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within, waitFor } from '@storybook/test';
import InputString, {
  type InputStringValue,
  type InputStringProps,
  type InputStringFlow,
} from '../../components/InputString.js';
const complete = fn();
const changed = fn();
const flowChanged = fn();
const flows: InputStringFlow[] = [
  {
    id: 'risk',
    label: 'I bring risk',
    steps: [
      {
        id: 'line',
        label: 'Example line',
        type: 'single',
        options: [
          { id: 'property', label: 'Property' },
          { id: 'cyber', label: 'Cyber' },
        ],
      },
      {
        id: 'region',
        label: 'Example region',
        type: 'multi',
        options: [
          { id: 'us', label: 'US', tag: 'example pilot' },
          { id: 'emea', label: 'EMEA', tag: 'not in pilot' },
        ],
      },
      { id: 'send', label: 'Show example appetite fits', type: 'action' },
    ],
  },
  {
    id: 'capacity',
    label: 'Institutional capacity',
    disabled: true,
    notice: 'Pending clearance. Capacity matching is not available yet.',
    steps: [],
  },
];
function Fixture(args: InputStringProps) {
  const [value, setValue] = useState<InputStringValue>({});
  return (
    <InputString
      {...args}
      value={value}
      onChange={(next) => {
        changed(next);
        setValue(next);
      }}
    />
  );
}
const meta = {
  title: 'Forms/InputString',
  id: 'xds-input-string',
  component: InputString,
  args: {
    flows,
    value: {},
    onChange: changed,
    onComplete: complete,
    onFlowChange: flowChanged,
    renderResult: () => 'Appetite fits 2 of 7 sample providers. Nothing is quoted or bound here.',
  },
  render: (args) => <Fixture {...args} />,
  beforeEach: () => {
    complete.mockClear();
    flowChanged.mockClear();
    changed.mockClear();
  },
} satisfies Meta<typeof InputString>;
export default meta;
type Story = StoryObj<typeof meta>;
const open = async (element: HTMLElement) => {
  const c = within(element);
  await userEvent.click(c.getByRole('button', { name: 'Try an example' }));
  await expect(c.getByRole('button', { name: 'I bring risk' })).toHaveFocus();
  await userEvent.click(c.getByRole('button', { name: 'I bring risk' }));
  return c;
};
export const RiskPath: Story = {
  play: async ({ canvasElement }) => {
    const c = await open(canvasElement);
    await expect(c.getByRole('button', { name: 'Property' })).toHaveFocus();
    await userEvent.click(c.getByRole('button', { name: 'Property' }));
    await expect(c.getByRole('button', { name: 'US · example pilot' })).toHaveFocus();
    await expect(c.getByRole('button', { name: 'Next' })).toBeDisabled();
    await userEvent.click(c.getByRole('button', { name: 'US · example pilot' }));
    await userEvent.click(c.getByRole('button', { name: 'Next' }));
    await userEvent.click(c.getByRole('button', { name: 'Show example appetite fits' }));
    await waitFor(() =>
      expect(complete).toHaveBeenCalledWith({
        flowId: 'risk',
        answers: { line: ['property'], region: ['us'] },
      }),
    );
    await expect(c.getByRole('status')).toHaveTextContent('Example:');
    await expect(c.getByRole('status')).toHaveFocus();
  },
};
export const NoneSelected: Story = {
  play: async ({ canvasElement }) => {
    const c = await open(canvasElement);
    await expect(c.getByRole('button', { name: 'Next' })).toBeDisabled();
    await expect(complete).not.toHaveBeenCalled();
    await userEvent.click(c.getByRole('button', { name: 'Property' }));
    const option = c.getByRole('button', { name: 'US · example pilot' });
    await userEvent.click(option);
    await userEvent.click(c.getByRole('button', { name: '✓ US · example pilot' }));
    await expect(c.getByRole('button', { name: 'Next' })).toBeDisabled();
  },
};
export const GoBack: Story = {
  play: async ({ canvasElement }) => {
    const c = await open(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Property' }));
    await userEvent.click(c.getByRole('button', { name: 'Example line: Property. Change' }));
    await userEvent.click(c.getByRole('button', { name: 'Cyber' }));
    await userEvent.click(c.getByRole('button', { name: 'EMEA · not in pilot' }));
    await userEvent.click(c.getByRole('button', { name: 'Next' }));
    await userEvent.click(c.getByRole('button', { name: 'Show example appetite fits' }));
    await expect(complete).toHaveBeenCalledWith({
      flowId: 'risk',
      answers: { line: ['cyber'], region: ['emea'] },
    });
  },
};
export const CapacityUnavailable: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Try an example' }));
    const capacity = c.getByRole('button', { name: 'Institutional capacity' });
    await expect(capacity).toBeDisabled();
    await expect(capacity).toHaveAccessibleDescription(
      'Pending clearance. Capacity matching is not available yet.',
    );
    await expect(complete).not.toHaveBeenCalled();
  },
};
export const KeyboardOnly: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    c.getByRole('button', { name: 'Try an example' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await expect(c.getByRole('button', { name: '✓ US · example pilot' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const send = c.getByRole('button', { name: 'Show example appetite fits' });
    await userEvent.tab();
    await expect(send).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(complete).toHaveBeenCalledWith({
      flowId: 'risk',
      answers: { line: ['property'], region: ['us'] },
    });
  },
};

export const Empty: Story = {
  args: { flows: [] },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Try an example' }));
    await expect(c.getByText('No example paths are available.')).toBeVisible();
    await expect(complete).not.toHaveBeenCalled();
  },
};
