import React from 'react';
import { expect, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import HeroHeader from '../../components/HeroHeader.js';

const meta: Meta<typeof HeroHeader> = {
  id: 'xds-heroheader',
  title: 'Page Layout/HeroHeader',
  component: HeroHeader,
};

export default meta;

export const Default = () => (
  <HeroHeader
    tag="System Version 4.2.0"
    title="UI Component Guide"
    subtitle="The visual and interaction standard for high-fidelity reinsurance capital management. Quantitative precision meets sovereign aesthetics."
  />
);

export const Responsive: StoryObj<typeof HeroHeader> = {
  args: {
    responsive: true,
    tag: 'Pilot preview · Illustrative data',
    title: 'Submissions in. Structured, checked, and shortlisted to capital whose appetite fits.',
    subtitle: 'A fictional workflow. People decide.',
  },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    if (window.innerWidth < 600)
      await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeLessThanOrEqual(32);
  },
};
