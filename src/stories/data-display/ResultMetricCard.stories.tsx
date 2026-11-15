import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
