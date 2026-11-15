import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import SlaVelocityPanel from '../../components/SlaVelocityPanel';
const meta = {
  id: 'results-slavelocitypanel',
  title: 'Workflow/SlaVelocityPanel',
  component: SlaVelocityPanel,
  args: {
    title: 'Modeling & SLA velocity',
    description: 'Turnaround cycle times versus actuarial benchmarks.',
    cycleTime: '2.4 days',
    clearanceEfficiency: '94.6%',
    onTime: { label: '92% on time', tone: 'success' },
    comparison: { label: '1.1 days below the 3.5-day target', direction: 'down', tone: 'success' },
    basis: 'Illustrative fixture · Completed submissions in the selected reporting period.',
    queueNote: 'Active modeling queue: 4 models running under 2h',
    onRetry: fn(),
  },
} satisfies Meta<typeof SlaVelocityPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Metrics: Story = {};
export const MissingValues: Story = {
  args: { cycleTime: null, clearanceEfficiency: null, onTime: undefined, queueNote: undefined },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Error: Story = { args: { state: 'error' } };
