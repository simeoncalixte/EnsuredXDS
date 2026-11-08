import type { Meta, StoryObj } from '@storybook/react';
import AppetiteDistribution from './AppetiteDistribution';
const meta = {
  title: 'Results/AppetiteDistribution',
  component: AppetiteDistribution,
  args: {
    title: 'Appetite mandate compliance',
    description: 'Portfolio underwriting guidelines on active inquiries.',
    segments: [
      { id: 'in', label: 'In appetite', percent: 68, tone: 'success' },
      { id: 'border', label: 'Borderline', percent: 24, tone: 'info' },
      { id: 'ref', label: 'Referral', percent: 8, tone: 'danger' },
    ],
    basis: 'Illustrative fixture · Share of assessed inquiries; mutually exclusive categories.',
    note: 'Property: 100% in appetite · Casualty: under referral',
  },
} satisfies Meta<typeof AppetiteDistribution>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Distribution: Story = {};
export const Unclassified: Story = {
  args: {
    segments: [{ id: 'in', label: 'In appetite', percent: 68, tone: 'success' }],
    note: undefined,
  },
};
export const UnknownShare: Story = {
  args: { segments: [{ id: 'in', label: 'In appetite', percent: null }], note: undefined },
};
export const InvalidTotal: Story = {
  args: {
    segments: [
      { id: 'a', label: 'In appetite', percent: 80 },
      { id: 'b', label: 'Referral', percent: 30 },
    ],
  },
};
export const Empty: Story = { args: { segments: [] } };
export const Loading: Story = { args: { state: 'loading' } };
