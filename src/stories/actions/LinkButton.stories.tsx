import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from '@storybook/test';
import LinkButton from '../../components/LinkButton.js';
const clicked = fn();
const meta = {
  title: 'Actions/LinkButton',
  id: 'xds-link-button',
  component: LinkButton,
  args: { href: '#example-destination', children: 'Read the example', onClick: clicked },
  render: (args) => (
    <>
      <LinkButton {...args} />
      <h2 id="example-destination">Example destination</h2>
    </>
  ),
} satisfies Meta<typeof LinkButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Read the example' });
    await expect(link).toHaveAttribute('href', '#example-destination');
    await expect(link).not.toHaveAttribute('variant');
    link.focus();
    await userEvent.keyboard('{Enter}');
    await expect(clicked).toHaveBeenCalledTimes(1);
    await expect(window.location.hash).toBe('#example-destination');
  },
};
export const Text: Story = { args: { variant: 'text' }, play: Primary.play };
