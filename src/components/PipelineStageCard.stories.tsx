import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, within, userEvent } from '@storybook/test';
import PipelineStageCard from './PipelineStageCard';
const meta = {
  title: 'Results/PipelineStageCard',
  component: PipelineStageCard,
  args: {
    title: 'New intake & triage',
    count: 5,
    exposure: '$28.5M',
    tone: 'info',
    metric: { label: 'Auto-rating pass', value: '80% (4/5)' },
    progress: { percent: 38.5, label: 'Share of active inquiries' },
    notes: ['Average SLA: 14h', 'Queue: +2 today'],
    onOpen: fn(),
  },
} satisfies Meta<typeof PipelineStageCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Intake: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'View New intake & triage' }),
    );
    await expect(args.onOpen).toHaveBeenCalled();
  },
};
export const Zero: Story = {
  args: { count: 0, exposure: '$0', metric: undefined, progress: undefined, notes: [] },
};
export const MissingValues: Story = {
  args: { count: null, exposure: null, metric: undefined, progress: undefined, notes: [] },
};
export const Loading: Story = { args: { state: 'loading' } };
export const Error: Story = { args: { state: 'error' } };
