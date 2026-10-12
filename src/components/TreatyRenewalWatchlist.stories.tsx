import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import TreatyRenewalWatchlist from './TreatyRenewalWatchlist';
const meta = {
  title: 'Results/TreatyRenewalWatchlist',
  component: TreatyRenewalWatchlist,
  args: {
    title: 'Q4 Treaty Renewal & Retrocession Watchlist',
    description: 'Tracking expiry horizons, indicative rate on line and upcoming renewal terms.',
    totalRenewingLimit: '$160.0M',
    basis: 'Illustrative fixtures · USD target limits for these three renewals.',
    onOpenTreaty: fn(),
    items: [
      {
        id: 'TR-4091',
        treatyReference: '#TR-4091',
        title: 'Allianz Global Re · Property Excess',
        broker: 'Guy Carpenter',
        critical: true,
        status: { label: 'Quoting', tone: 'success' },
        targetLimit: '$50.0M',
        indicativeRate: '12.5%',
        rateChange: { label: '+8.2% vs expiring', tone: 'success' },
        expiryDate: '2026-11-15',
        expiryLabel: 'Nov 15, ’26',
        participation: '35%',
        terms: { label: 'Terms favorable', tone: 'success' },
      },
      {
        id: 'TR-8820',
        treatyReference: '#TR-8820',
        title: 'Zurich North America · Specialty Marine',
        broker: 'Aon Re Solutions',
        critical: true,
        status: { label: 'Term sheet', tone: 'info' },
        targetLimit: '$75.0M',
        indicativeRate: '9.8%',
        rateChange: { label: '+4.1% vs expiring' },
        expiryDate: '2026-12-01',
        expiryLabel: 'Dec 01, ’26',
        participation: '20%',
        terms: { label: 'Lead terms agreed', tone: 'success' },
      },
      {
        id: 'TR-1104',
        treatyReference: '#TR-1104',
        title: 'Hannover Rück · Cyber Aggregate Stop-Loss',
        broker: 'Gallagher Re',
        critical: true,
        status: { label: 'Revise terms', tone: 'danger' },
        targetLimit: '$35.0M',
        indicativeRate: '14.2%',
        rateChange: { label: '+16.5% vs expiring', tone: 'danger' },
        expiryDate: '2026-12-31',
        expiryLabel: 'Dec 31, ’26',
        participation: '15%',
        terms: { label: 'Waiting actuarial sign-off', tone: 'warning' },
      },
    ],
  },
} satisfies Meta<typeof TreatyRenewalWatchlist>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3 critical renewals')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open Allianz Global Re · Property Excess' }),
    );
    await expect(args.onOpenTreaty).toHaveBeenCalledWith('TR-4091');
  },
};
export const Empty: Story = { args: { items: [] } };
export const Loading: Story = { args: { state: 'loading' } };
export const Unavailable: Story = {
  args: {
    state: 'unavailable',
    message: 'Treaty relationships have not been established for this selection.',
  },
};
export const Error: Story = { args: { state: 'error', onRetry: fn() } };
export const PartialData: Story = {
  args: {
    totalRenewingLimit: null,
    basis: 'Target limits are incomplete; no aggregate is inferred.',
    items: [
      {
        ...meta.args.items[0],
        targetLimit: null,
        indicativeRate: null,
        expiryLabel: null,
        expiryDate: null,
        participation: null,
        critical: false,
      },
    ],
  },
};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
