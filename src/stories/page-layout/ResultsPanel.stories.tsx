import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ResultsPanel from '../../components/ResultsPanel';
const meta = {
  id: 'results-resultspanel',
  title: 'Page Layout/ResultsPanel',
  component: ResultsPanel,
  args: {
    title: 'Received submissions',
    description: 'Current filtered population',
    children: 'Place an XDS chart or data table here.',
  },
} satisfies Meta<typeof ResultsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Unavailable: Story = {
  args: { state: 'unavailable', message: 'No historical snapshots are available.' },
};
export const Error: Story = { args: { state: 'error', onRetry: fn() } };
