import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import ResultMetricCard from '../../components/ResultMetricCard';
const meta = {
  id: 'results-resultmetriccard',
  title: 'Data Display/ResultMetricCard',
  component: ResultMetricCard,
  args: { label: 'Quoted premium', value: '$12.4M', basis: 'USD · Current effective revisions' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResultMetricCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {
  args: {
    comparison: { label: '14.2% versus prior period', direction: 'up', tone: 'success' },
    status: { label: 'On target', tone: 'success' },
    target: { label: '82.5% of annual target', value: 82.5, max: 100 },
    coverage: { populated: 24, total: 24 },
  },
};
export const PartialData: Story = {
  args: {
    coverage: { populated: 18, total: 24 },
    status: { label: 'Partial data', tone: 'warning' },
  },
};
export const LowerIsFavorable: Story = {
  args: {
    label: 'Loss ratio',
    value: '54.8%',
    comparison: {
      label: '4.2 percentage points versus prior period',
      direction: 'down',
      tone: 'success',
    },
  },
};
export const Zero: Story = { args: { value: '$0', coverage: { populated: 24, total: 24 } } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Unavailable: Story = {
  args: { value: null, message: 'Earned premium is not available for these submissions.' },
};
export const Error: Story = { args: { state: 'error', onRetry: () => {} } };

// AIN-322: zero is a value, null is unavailable with its basis.
export const ZeroNumber: Story = {
  name: 'Zero (number 0) renders 0',
  args: { label: 'Open referrals', value: 0, basis: 'Referrals above your authority level' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('0');
    await expect(canvasElement.textContent).not.toContain('not available');
    await expect(canvasElement.textContent).not.toContain('Unavailable');
  },
};
export const UnavailableWithBasis: Story = {
  name: 'Unavailable with basis (silent)',
  args: {
    label: 'Loss ratio',
    value: null,
    message: 'Unavailable — not measured yet.',
    basis: 'Appears once claims data is connected.',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('Unavailable — not measured yet.');
    await expect(canvasElement.textContent).toContain('Appears once claims data is connected.');
    await expect(canvasElement.textContent).not.toMatch(/\b0\b/);
    await expect(canvasElement.querySelectorAll('[role="alert"], [role="status"]')).toHaveLength(0);
  },
};
export const ErrorWithReference: Story = {
  name: 'Error with reference',
  args: { state: 'error', onRetry: () => {}, reference: 'req_7f3a9c21e4b84d0a' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('alert')).toHaveLength(1);
    await expect(canvasElement.textContent).toContain('Reference: req_7f3a9c21e4b84d0a');
  },
};
