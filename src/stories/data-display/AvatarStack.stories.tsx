import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import AvatarStack from '../../components/AvatarStack.js';

// Generated geometric fixtures keep the image example independent of photo services.
const avatarImage = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}"/><circle cx="40" cy="30" r="14" fill="white"/><path d="M14 80a26 30 0 0 1 52 0" fill="white"/></svg>`)}`;

const meta: Meta<typeof AvatarStack> = {
  id: 'xds-avatarstack',
  title: 'Data Display/AvatarStack',
  component: AvatarStack,
};

export default meta;

type Story = StoryObj<typeof AvatarStack>;

export const GradientInitials: Story = {
  args: {
    size: 40,
    avatars: [
      { initials: 'AB', gradient: 'linear-gradient(135deg, #f59e0b, #dc2626)' },
      { initials: 'CD', gradient: 'linear-gradient(135deg, #16a34a, #0891b2)' },
      { initials: 'EF', gradient: 'linear-gradient(135deg, #6366f1, #312e81)' },
    ],
  },
};

export const WithImages: Story = {
  args: {
    size: 40,
    avatars: [
      { src: avatarImage('#6366f1'), initials: 'AB' },
      { src: avatarImage('#0891b2'), initials: 'CD' },
      { initials: 'EF' },
    ],
  },
};

export const OverflowChip: Story = {
  args: {
    size: 40,
    max: 3,
    avatars: [
      { initials: 'AB' },
      { initials: 'CD' },
      { initials: 'EF' },
      { initials: 'GH' },
      { initials: 'IJ' },
      { initials: 'KL' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 6 avatars, max 3 -> overflow of +3
    const chip = await canvas.findByText('+3');
    await expect(chip).toBeInTheDocument();
    // Hover the chip to exercise interaction; aria-label is present.
    await userEvent.hover(chip);
    await expect(canvas.getByLabelText('3 more')).toBeInTheDocument();
  },
};
