import type { Meta, StoryObj } from '@storybook/react';
import { fn, expect, within, userEvent } from '@storybook/test';
import PriorityUnderwriterQueue from './PriorityUnderwriterQueue';
const meta = {
  title: 'Results/PriorityUnderwriterQueue',
  component: PriorityUnderwriterQueue,
  args: {
    title: 'High-priority underwriter queue',
    description: 'Illustrative submissions requiring lead underwriter action.',
    items: [
      {
        id: 'munich',
        title: 'Munich Re Property Cat',
        description: '$25M xs $50M · Aon Re',
        status: { label: '4h SLA left', tone: 'danger' },
        critical: true,
      },
      {
        id: 'swiss',
        title: 'Swiss Re Specialty Cyber',
        description: '20% pro-rata · Guy Carpenter',
        status: { label: 'Sign-off needed', tone: 'info' },
        critical: true,
      },
    ],
    escalationNote: 'Triage auto-escalation: Marcus Vance assigned',
    onOpenSubmission: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof PriorityUnderwriterQueue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Queue: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open Munich Re Property Cat' }),
    );
    await expect(args.onOpenSubmission).toHaveBeenCalledWith('munich');
  },
};
export const Empty: Story = { args: { items: [] } };
export const Loading: Story = { args: { state: 'loading' } };
export const Error: Story = { args: { state: 'error' } };
