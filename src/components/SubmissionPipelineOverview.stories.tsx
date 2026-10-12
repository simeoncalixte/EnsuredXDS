import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, within, userEvent } from '@storybook/test';
import SubmissionPipelineOverview from './SubmissionPipelineOverview';
import AppetiteDistribution from './AppetiteDistribution';
import SlaVelocityPanel from './SlaVelocityPanel';
import PriorityUnderwriterQueue from './PriorityUnderwriterQueue';
import appetite from './AppetiteDistribution.stories';
import sla from './SlaVelocityPanel.stories';
import queue from './PriorityUnderwriterQueue.stories';
const meta = {
  title: 'Results/SubmissionPipelineOverview',
  component: SubmissionPipelineOverview,
  args: {
    title: 'Submissions & Deal Flow Pipeline',
    description:
      'Illustrative fixture · Stage distribution and triage across facultative and treaty inquiries.',
    activeCount: 13,
    capacity: '$84.2M',
    stages: [
      {
        id: 'intake',
        title: '1. New intake & triage',
        count: 5,
        exposure: '$28.5M',
        tone: 'info',
        metric: { label: 'Auto-rating pass', value: '80% (4/5)' },
        progress: { percent: 38.5, label: 'Share of active inquiries' },
        notes: ['Average SLA: 14h', 'Queue: +2 today'],
      },
      {
        id: 'model',
        title: '2. Actuarial & cat model',
        count: 4,
        exposure: '$32.1M',
        tone: 'success',
        metric: { label: 'RMS / AIR sync', value: '3 in flight' },
        progress: { percent: 30.8, label: 'Share of active inquiries' },
        notes: ['Turnaround: 1.8 days', 'Models active'],
      },
      {
        id: 'review',
        title: '3. Review & pricing',
        count: 3,
        exposure: '$18.6M',
        tone: 'success',
        metric: { label: 'Target rate on line', value: '11.4% average' },
        progress: { percent: 23.1, label: 'Share of active inquiries' },
        notes: ['Consensus: 2/3 voted', 'Lead underwriter review'],
      },
      {
        id: 'bind',
        title: '4. Ready to bind',
        count: 1,
        exposure: '$5.0M',
        tone: 'success',
        metric: { label: 'Syndicate consensus', value: 'Approved 100%' },
        progress: { percent: 7.7, label: 'Share of active inquiries' },
        notes: ['Pending final signature', 'Pinnacle Re #1788'],
      },
    ],
    basis:
      'Stage bars show inquiry share. Capacity is supplied separately from total insured value; totals are never inferred from stage values.',
    onOpenStage: fn(),
    onRetry: fn(),
    children: (
      <>
        <AppetiteDistribution {...appetite.args} />
        <SlaVelocityPanel {...sla.args} />
        <PriorityUnderwriterQueue {...queue.args} />
      </>
    ),
  },
} satisfies Meta<typeof SubmissionPipelineOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Pipeline: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'View 1. New intake & triage' }),
    );
    await expect(args.onOpenStage).toHaveBeenCalledWith('intake');
  },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { stages: [] } };
export const Unavailable: Story = { args: { state: 'unavailable' } };
export const Error: Story = { args: { state: 'error' } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
