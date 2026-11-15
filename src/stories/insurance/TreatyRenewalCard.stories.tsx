import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import TreatyRenewalCard from '../../components/TreatyRenewalCard';
import watchlist from './TreatyRenewalWatchlist.stories';
const meta = {
  id: 'results-treatyrenewalcard',
  title: 'Insurance/TreatyRenewalCard',
  component: TreatyRenewalCard,
  args: { ...watchlist.args.items[0], onOpen: fn() },
} satisfies Meta<typeof TreatyRenewalCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Quoting: Story = {};
export const ReviseTerms: Story = { args: watchlist.args.items[2] };
export const MissingValues: Story = {
  args: { targetLimit: null, indicativeRate: null, expiryLabel: null, participation: null },
};
