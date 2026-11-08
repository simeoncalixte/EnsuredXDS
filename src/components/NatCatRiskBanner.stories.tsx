import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, userEvent, within } from '@storybook/test';
import NatCatRiskBanner from './NatCatRiskBanner';
const meta = {
  title: 'Results/NatCatRiskBanner',
  component: NatCatRiskBanner,
  args: {
    title: 'Live NatCat Risk Accumulation: Atlantic Wind Event (Cat 3 Track)',
    grossExposure: '$18.2M TIV',
    netRetained: '$7.4M',
    treatyCount: 14,
    status: { label: 'Zone monitored', tone: 'success' },
    bufferLabel: 'Buffer: Cat 4 attachment',
    basis: 'Illustrative scenario · USD · Retained after quota share',
    onViewHazard: fn(),
    onRunStressTest: fn(),
    details: (
      <p>
        Illustrative scenario detail. The application supplies hazard layers, model results and
        valuation assumptions.
      </p>
    ),
  },
} satisfies Meta<typeof NatCatRiskBanner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'View GIS hazard' }));
    await expect(args.onViewHazard).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Run RDS stress test' }));
    await expect(args.onRunStressTest).toHaveBeenCalled();
    const toggle = canvas.getByRole('button', { name: 'Show details' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(canvas.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(canvas.getByText(/Illustrative scenario detail/)).toBeVisible();
  },
};
export const Expanded: Story = { args: { defaultExpanded: true } };
export const Running: Story = { args: { stressTestRunning: true } };
export const FailedStressTest: Story = {
  args: { stressTestError: 'The model run failed. Review the scenario and try again.' },
};
export const PartialData: Story = {
  args: {
    netRetained: null,
    bufferLabel: undefined,
    status: { label: 'Retention unavailable', tone: 'warning' },
  },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Unavailable: Story = {
  args: {
    state: 'unavailable',
    message: 'Risk locations and hazard data are required for accumulation results.',
  },
};
export const Error: Story = { args: { state: 'error', onRetry: fn() } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
