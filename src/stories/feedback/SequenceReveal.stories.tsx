import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from '@storybook/test';
import SequenceReveal from '../../components/SequenceReveal.js';
const meta = {
  title: 'Feedback/SequenceReveal',
  id: 'xds-sequence-reveal',
  component: SequenceReveal,
  args: {
    label: 'Example workflow',
    onDone: fn(),
    children: [
      <span key="1">Documents arrive</span>,
      <span key="2">A person confirms the AI draft</span>,
      <span key="3">The carrier binds</span>,
    ],
  },
} satisfies Meta<typeof SequenceReveal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(args.onDone).toHaveBeenCalled(), { timeout: 4000 });
    await expect(c.getByText('The carrier binds')).toBeVisible();
  },
};
export const AlreadyInView: Story = { ...Default, args: { distance: 0.01, stagger: 0 } };
export const ReducedMotion: Story = { ...Default, args: { reducedMotion: true } };
export const StaticEquivalent: Story = {
  args: { reducedMotion: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (const item of c.getAllByRole('listitem')) await expect(item).toBeVisible();
  },
};

/** Regression for the owner requirement: waiting never advances the sequence;
 * native scroll advances it, and scrolling back reverses the same transform. */
export const ScrollControlled: Story = {
  render: (args) => (
    <div>
      <div style={{ height: '100vh' }} aria-hidden="true" />
      <SequenceReveal {...args} />
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const list = c.getByRole('list', { name: 'Example workflow' });
    const item = c.getAllByRole('listitem')[0];
    window.scrollTo(0, 0);
    await waitFor(() => expect(getComputedStyle(item).transform).not.toBe('none'));
    const before = getComputedStyle(item).transform;
    await new Promise((resolve) => setTimeout(resolve, 160));
    await expect(getComputedStyle(item).transform).toBe(before);
    window.scrollTo(0, list.getBoundingClientRect().top + window.scrollY);
    await waitFor(() => expect(getComputedStyle(item).transform).toBe('none'));
    window.scrollTo(0, 0);
    await waitFor(() => expect(getComputedStyle(item).transform).toBe(before));
    for (const li of c.getAllByRole('listitem'))
      await expect(getComputedStyle(li).opacity).toBe('1');
  },
};
